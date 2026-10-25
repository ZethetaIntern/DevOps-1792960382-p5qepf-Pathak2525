import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePreflight, canApprove, canTransition, simulateExecution, FAILOVER_STEPS } from "../src/services/failoverService.js";
import { lagIsSafe } from "../src/services/replicationService.js";
import { classifyStatus } from "../src/services/healthService.js";

const mumbai = { regionCode: "ap-south-1", role: "primary", status: "healthy" };
const hyd = { regionCode: "ap-south-2", role: "standby", status: "healthy" };
const okServices = [{ regionCode: "ap-south-2", service: "aurora", status: "healthy", replicationLagSeconds: 5 }];

test("preflight passes when target healthy and lag within RPO", () => {
  const r = evaluatePreflight({ sourceRegion: mumbai, targetRegion: hyd, services: okServices });
  assert.equal(r.safe, true);
  assert.deepEqual(r.blockers, []);
});

test("preflight blocks when replication lag exceeds RPO", () => {
  const r = evaluatePreflight({ sourceRegion: mumbai, targetRegion: hyd, services: [{ ...okServices[0], replicationLagSeconds: 400 }] });
  assert.equal(r.safe, false);
  assert.match(r.blockers.join(" "), /lag/i);
});

test("preflight blocks split-brain and same-region", () => {
  assert.equal(evaluatePreflight({ sourceRegion: mumbai, targetRegion: { ...hyd, role: "primary" }, services: okServices }).safe, false);
  assert.equal(evaluatePreflight({ sourceRegion: mumbai, targetRegion: mumbai, services: okServices }).safe, false);
});

test("real (non-simulation) failover is always blocked", () => {
  const r = evaluatePreflight({ sourceRegion: mumbai, targetRegion: hyd, services: okServices, mode: "real" });
  assert.equal(r.safe, false);
  assert.match(r.blockers[0], /disabled/i);
});

test("two-person rule: requester cannot approve", () => {
  const run = { status: "pending_approval", requestedBy: "sre@paysecure.local" };
  assert.equal(canApprove(run, { email: "sre@paysecure.local" }).ok, false);
  assert.equal(canApprove(run, { email: "dba@paysecure.local" }).ok, true);
  assert.equal(canApprove({ ...run, status: "completed" }, { email: "x" }).ok, false);
});

test("state machine only allows valid transitions", () => {
  assert.equal(canTransition("pending_approval", "approved"), true);
  assert.equal(canTransition("pending_approval", "running"), false);
  assert.equal(canTransition("completed", "aborted"), false);
});

test("simulated execution completes all steps inside the 5 minute RTO", () => {
  const out = simulateExecution({ scenario: "region-failure", lagSeconds: 7, random: () => 0.5 });
  assert.equal(out.steps.length, FAILOVER_STEPS.length);
  assert.ok(out.steps.every((s) => s.status === "passed"));
  assert.ok(out.measuredRtoSeconds <= 300, `RTO ${out.measuredRtoSeconds}`);
  assert.equal(out.measuredRpoSeconds, 7);
});

test("lag and health classification", () => {
  assert.equal(lagIsSafe(10), true);
  assert.equal(lagIsSafe(61), false);
  assert.equal(lagIsSafe(NaN), false);
  assert.equal(classifyStatus({ errorRatePercent: 0.1, latencyMs: 20 }), "healthy");
  assert.equal(classifyStatus({ errorRatePercent: 2 }), "degraded");
  assert.equal(classifyStatus({ errorRatePercent: 9 }), "down");
});
