import Region from "../models/Region.js";
import ServiceHealth from "../models/ServiceHealth.js";
import FailoverRun from "../models/FailoverRun.js";
import Transaction from "../models/Transaction.js";
import { asyncHandler, HttpError } from "../utils/asyncHandler.js";
import { recordAudit } from "../services/auditService.js";
import { buildSteps, canApprove, canTransition, evaluatePreflight, simulateExecution } from "../services/failoverService.js";

async function loadRun(id) {
  const run = await FailoverRun.findById(id);
  if (!run) throw new HttpError(404, "Failover run not found");
  return run;
}

export const listRuns = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await FailoverRun.find().sort({ createdAt: -1 }).limit(50).lean() });
});

export const getRun = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await loadRun(req.params.id) });
});

/** Step 1: request (does NOT change anything). */
export const requestSimulation = asyncHandler(async (req, res) => {
  const { scenario, reason, direction = "failover" } = req.body;
  const regions = await Region.find();
  const services = await ServiceHealth.find().lean();
  const source = direction === "failback" ? regions.find((r) => r.role !== "primary") : regions.find((r) => r.role === "primary");
  const target = regions.find((r) => source && r.regionCode !== source.regionCode);
  const preflight = direction === "failback"
    ? { safe: true, blockers: [], replicationLagSeconds: 0 }
    : evaluatePreflight({ sourceRegion: source, targetRegion: target, services, mode: "simulation" });

  const run = await FailoverRun.create({
    scenario, reason, direction, mode: "simulation",
    fromRegion: source?.regionCode || "unknown", toRegion: target?.regionCode || "unknown",
    requestedBy: req.user.email, preflight, steps: buildSteps(),
    status: preflight.safe ? "pending_approval" : "rejected",
    abortReason: preflight.safe ? "" : preflight.blockers.join("; ")
  });
  await recordAudit({ user: req.user, action: "failover.request", resource: "failover", resourceId: run._id, ip: req.ip, metadata: { scenario, safe: preflight.safe } });
  res.status(preflight.safe ? 201 : 422).json({ success: preflight.safe, data: run });
});

/** Step 2: second person approves. */
export const approve = asyncHandler(async (req, res) => {
  const run = await loadRun(req.params.id);
  const check = canApprove(run, req.user);
  if (!check.ok) throw new HttpError(409, check.reason);
  run.status = "approved";
  run.approvedBy = req.user.email;
  run.approvedAt = new Date();
  await run.save();
  await recordAudit({ user: req.user, action: "failover.approve", resource: "failover", resourceId: run._id, ip: req.ip });
  res.json({ success: true, data: run });
});

export const reject = asyncHandler(async (req, res) => {
  const run = await loadRun(req.params.id);
  if (!canTransition(run.status, "rejected")) throw new HttpError(409, `Cannot reject a run in status ${run.status}`);
  run.status = "rejected";
  run.abortReason = req.body.reason || "Rejected by approver";
  await run.save();
  await recordAudit({ user: req.user, action: "failover.reject", resource: "failover", resourceId: run._id, ip: req.ip });
  res.json({ success: true, data: run });
});

/** Step 3: execute the approved simulation. Roles swap only in local sim data. */
export const execute = asyncHandler(async (req, res) => {
  const run = await loadRun(req.params.id);
  if (!canTransition(run.status, "running")) throw new HttpError(409, `Cannot execute a run in status ${run.status}`);

  const [source, target] = await Promise.all([Region.findOne({ regionCode: run.fromRegion }), Region.findOne({ regionCode: run.toRegion })]);
  if (!source || !target) throw new HttpError(404, "Region missing");
  const services = await ServiceHealth.find().lean();
  if (run.direction === "failover") {
    const recheck = evaluatePreflight({ sourceRegion: source, targetRegion: target, services, mode: "simulation" });
    if (!recheck.safe) {
      run.status = "aborted";
      run.abortReason = `Pre-execution safety re-check failed: ${recheck.blockers.join("; ")}`;
      await run.save();
      await recordAudit({ user: req.user, action: "failover.abort", resource: "failover", resourceId: run._id, ip: req.ip, metadata: recheck });
      throw new HttpError(422, run.abortReason);
    }
  }

  run.status = "running";
  run.startedAt = new Date();
  await run.save();

  const { steps, measuredRtoSeconds, measuredRpoSeconds } = simulateExecution({ scenario: run.scenario, lagSeconds: run.preflight?.replicationLagSeconds || 0 });

  // Fence old writer first, then enable the new writer (never two writers).
  source.role = run.direction === "failover" ? "fenced" : "standby";
  source.writerEnabled = false;
  source.trafficWeight = 0;
  await source.save();
  target.role = "primary";
  target.writerEnabled = true;
  target.trafficWeight = 100;
  target.status = "healthy";
  await target.save();

  // Simulate uncertain in-flight transactions being reconciled.
  await Transaction.updateMany({ status: "uncertain", regionCode: source.regionCode }, { $set: { status: "success", reconciled: true } });

  run.steps = steps;
  run.measuredRtoSeconds = measuredRtoSeconds;
  run.measuredRpoSeconds = measuredRpoSeconds;
  run.completedAt = new Date();
  run.status = "completed";
  await run.save();
  await recordAudit({ user: req.user, action: "failover.execute", resource: "failover", resourceId: run._id, ip: req.ip, metadata: { rto: measuredRtoSeconds, rpo: measuredRpoSeconds } });
  res.json({ success: true, data: run });
});

export const abort = asyncHandler(async (req, res) => {
  const run = await loadRun(req.params.id);
  if (!canTransition(run.status, "aborted")) throw new HttpError(409, `Cannot abort a run in status ${run.status}`);
  run.status = "aborted";
  run.abortReason = req.body.reason || "Aborted by operator";
  await run.save();
  await recordAudit({ user: req.user, action: "failover.abort", resource: "failover", resourceId: run._id, ip: req.ip, metadata: { reason: run.abortReason } });
  res.json({ success: true, data: run });
});

/** Admin: put the lab back to Mumbai-primary. */
export const resetLab = asyncHandler(async (req, res) => {
  await Region.updateOne({ regionCode: "ap-south-1" }, { $set: { role: "primary", writerEnabled: true, trafficWeight: 100, status: "healthy" } });
  await Region.updateOne({ regionCode: "ap-south-2" }, { $set: { role: "standby", writerEnabled: false, trafficWeight: 0, status: "healthy" } });
  await ServiceHealth.updateMany({}, { $set: { status: "healthy", detail: "" } });
  await recordAudit({ user: req.user, action: "failover.reset", resource: "lab", ip: req.ip });
  res.json({ success: true, message: "Lab reset: Mumbai primary, Hyderabad standby" });
});
