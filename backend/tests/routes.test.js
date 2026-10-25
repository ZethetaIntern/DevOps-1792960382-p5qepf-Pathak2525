import test from "node:test";
import assert from "node:assert/strict";
import { startServer } from "./helpers.js";
import { workloadMath, successRate } from "../src/services/metricsService.js";
import { validateValue } from "../src/middleware/validateRequest.js";

test("GET /api/health returns service info", async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/api/health`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.simulationOnly, true);
  } finally { server.close(); }
});

test("protected routes reject anonymous requests", async () => {
  const { server, base } = await startServer();
  try {
    for (const route of ["/api/dashboard/metrics", "/api/regions", "/api/failover", "/api/audit-logs", "/api/runbooks"]) {
      const res = await fetch(`${base}${route}`);
      assert.equal(res.status, 401, route);
    }
  } finally { server.close(); }
});

test("unknown route returns 404 JSON", async () => {
  const { server, base } = await startServer();
  try {
    const res = await fetch(`${base}/api/nope`);
    assert.equal(res.status, 404);
  } finally { server.close(); }
});

test("workload maths matches the brief (3.2M tx/day, INR 500 crore, 99.99%)", () => {
  const m = workloadMath({ dailyTransactions: 3_200_000, dailyValueInr: 5_000_000_000, sloAvailability: 99.99 });
  assert.equal(m.avgTps, 37);
  assert.equal(m.avgTicketInr, 1563); // INR 500 crore = 5e9; 5e9 / 3.2e6 = 1562.5
  assert.equal(Math.round(m.allowedDowntimeMinutesPerYear * 10) / 10, 52.6);
});

test("successRate computes percentage", () => {
  assert.equal(successRate({ success: 95, failed: 5 }), 95);
  assert.equal(successRate({}), 100);
});

test("validateValue enforces rules", () => {
  assert.match(validateValue(undefined, { required: true }, "x"), /required/);
  assert.match(validateValue("a", { type: "number" }, "x"), /number/);
  assert.match(validateValue("z", { enum: ["a"] }, "x"), /one of/);
  assert.equal(validateValue("a", { enum: ["a"] }, "x"), null);
});
