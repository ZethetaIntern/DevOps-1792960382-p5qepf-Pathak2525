import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboardMetrics } from "../services/metricsService.js";
import { generateLagSeries } from "../services/replicationService.js";
import { refreshSimulatedHealth } from "../services/healthService.js";

export const metrics = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await getDashboardMetrics() });
});

export const replicationLag = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: generateLagSeries(30) });
});

export const refreshHealth = asyncHandler(async (_req, res) => {
  await refreshSimulatedHealth();
  res.json({ success: true, message: "Simulated health refreshed" });
});
