import Drill from "../models/Drill.js";
import Runbook from "../models/Runbook.js";
import { config } from "../config/env.js";
import { asyncHandler, HttpError } from "../utils/asyncHandler.js";
import { recordAudit } from "../services/auditService.js";

export const listDrills = asyncHandler(async (_req, res) => {
  const drills = await Drill.find().sort({ startedAt: -1 }).limit(100).lean();
  res.json({
    success: true,
    data: drills.map((d) => ({ ...d, rtoMet: d.measuredRtoSeconds <= config.workload.rtoTargetSeconds, rpoMet: d.measuredRpoSeconds <= config.workload.rpoTargetSeconds }))
  });
});

export const createDrill = asyncHandler(async (req, res) => {
  const body = req.body;
  const started = new Date(body.startedAt);
  const restored = new Date(body.restoredAt);
  if (restored < started) throw new HttpError(400, "restoredAt must be after startedAt");
  const rto = Math.round((restored - started) / 1000);
  const drill = await Drill.create({ ...body, startedAt: started, restoredAt: restored, measuredRtoSeconds: body.measuredRtoSeconds ?? rto, conductedBy: req.user._id });
  await Runbook.updateOne({ number: drill.runbookNumber }, { $set: { lastTestedAt: restored } });
  await recordAudit({ user: req.user, action: "drill.create", resource: "drill", resourceId: drill._id, ip: req.ip, metadata: { outcome: drill.outcome, rto: drill.measuredRtoSeconds } });
  res.status(201).json({ success: true, data: drill });
});
