import { config } from "../config/env.js";
import { lagIsSafe } from "./replicationService.js";

/** Ordered, guarded failover workflow. Every step is SIMULATED. */
export const FAILOVER_STEPS = [
  { key: "verify-signals", label: "Verify outage using independent health signals" },
  { key: "fence-writer", label: "Fence old writer (block all writes in source region)" },
  { key: "check-replication", label: "Verify replication lag within RPO and data consistency" },
  { key: "promote-secondary", label: "Promote Aurora secondary / enable writer in target region" },
  { key: "warm-dependencies", label: "Validate DynamoDB, Redis warm-up and Kafka consumer offsets" },
  { key: "route-traffic", label: "Shift DNS / traffic weights to target region" },
  { key: "reconcile", label: "Reconcile uncertain transactions via idempotency keys" },
  { key: "validate-sli", label: "Validate payment success rate and latency SLIs" }
];

export const TRANSITIONS = {
  pending_approval: ["approved", "rejected", "aborted"],
  approved: ["running", "aborted"],
  running: ["completed", "aborted"],
  completed: [],
  aborted: [],
  rejected: []
};

export const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);

/** Safety gate. Returns a list of reasons the failover must NOT proceed. */
export function evaluatePreflight({ sourceRegion, targetRegion, services, mode = "simulation" }) {
  const blockers = [];
  if (mode !== "simulation" && !config.allowRealFailover) blockers.push("Real failover is disabled; only simulation mode is permitted");
  if (!sourceRegion || !targetRegion) blockers.push("Source and target region are required");
  if (sourceRegion && targetRegion && sourceRegion.regionCode === targetRegion.regionCode) blockers.push("Source and target region must differ");
  if (sourceRegion && sourceRegion.role !== "primary") blockers.push("Source region is not the current primary");
  if (targetRegion && targetRegion.role === "primary") blockers.push("Target region is already primary (split-brain risk)");
  if (targetRegion && targetRegion.status === "down") blockers.push("Target region is down");

  const targetServices = (services || []).filter((s) => targetRegion && s.regionCode === targetRegion.regionCode);
  const lag = targetServices.reduce((m, s) => Math.max(m, s.replicationLagSeconds || 0), 0);
  if (!lagIsSafe(lag)) blockers.push(`Replication lag ${lag}s exceeds RPO target ${config.workload.rpoTargetSeconds}s`);
  if (targetServices.some((s) => s.status === "down")) blockers.push("A target-region dependency is down");

  return { safe: blockers.length === 0, blockers, replicationLagSeconds: lag };
}

/** Two-person rule: requester cannot approve own request. */
export function canApprove(run, approver) {
  if (!run || run.status !== "pending_approval") return { ok: false, reason: "Run is not awaiting approval" };
  if (run.requestedBy === approver.email) return { ok: false, reason: "Requester cannot approve their own failover (two-person rule)" };
  return { ok: true };
}

export function buildSteps() {
  return FAILOVER_STEPS.map((s) => ({ ...s, status: "pending" }));
}

/** Simulated execution: returns updated steps and measured RTO/RPO. Deterministic enough for tests. */
export function simulateExecution({ scenario, lagSeconds, random = Math.random }) {
  const now = Date.now();
  const stepDurations = { "verify-signals": 25, "fence-writer": 15, "check-replication": 10, "promote-secondary": 70, "warm-dependencies": 40, "route-traffic": 45, reconcile: 35, "validate-sli": 20 };
  const peakPenalty = scenario === "peak-load" ? 1.4 : 1;
  let elapsed = 0;
  const steps = FAILOVER_STEPS.map((s) => {
    const duration = Math.round(stepDurations[s.key] * peakPenalty * (0.85 + random() * 0.3));
    const startedAt = new Date(now + elapsed * 1000);
    elapsed += duration;
    return { ...s, status: "passed", startedAt, finishedAt: new Date(now + elapsed * 1000), detail: `Simulated in ${duration}s` };
  });
  return { steps, measuredRtoSeconds: elapsed, measuredRpoSeconds: Math.round(lagSeconds) };
}

export function targetFor(regions, sourceCode) {
  return regions.find((r) => r.regionCode !== sourceCode);
}
