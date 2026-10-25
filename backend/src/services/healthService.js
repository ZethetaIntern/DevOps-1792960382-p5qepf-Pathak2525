import Region from "../models/Region.js";
import ServiceHealth from "../models/ServiceHealth.js";

export function classifyStatus({ errorRatePercent = 0, latencyMs = 0, lagSeconds = 0 }) {
  if (errorRatePercent >= 5 || latencyMs >= 2000 || lagSeconds >= 120) return "down";
  if (errorRatePercent >= 1 || latencyMs >= 500 || lagSeconds >= 30) return "degraded";
  return "healthy";
}

export function regionStatusFromServices(services) {
  if (!services.length) return "healthy";
  if (services.some((s) => s.status === "down")) return "down";
  if (services.some((s) => s.status === "degraded")) return "degraded";
  return "healthy";
}

/** Simulation tick: jitter service metrics so the dashboard has live-looking data. */
export async function refreshSimulatedHealth() {
  const services = await ServiceHealth.find();
  for (const s of services) {
    if (s.status === "down" && s.detail?.startsWith("INJECTED")) continue;
    const jitter = Math.random();
    s.latencyMs = Math.round(8 + jitter * 40 + (s.service === "aurora" ? 15 : 0));
    s.errorRatePercent = +(jitter * 0.2).toFixed(2);
    if (s.replicationLagSeconds !== undefined && s.service !== "redis") {
      s.replicationLagSeconds = +(2 + jitter * 6).toFixed(2);
    }
    s.status = classifyStatus({ errorRatePercent: s.errorRatePercent, latencyMs: s.latencyMs, lagSeconds: s.replicationLagSeconds });
    s.checkedAt = new Date();
    await s.save();
  }
  const regions = await Region.find();
  for (const region of regions) {
    const own = services.filter((s) => s.regionCode === region.regionCode);
    if (region.status !== "down" || !region.simulation) region.status = regionStatusFromServices(own);
    region.lastHealthCheckAt = new Date();
    await region.save();
  }
}

export async function getRegionOverview() {
  const [regions, services] = await Promise.all([Region.find().sort({ name: 1 }).lean(), ServiceHealth.find().lean()]);
  return regions.map((r) => ({ ...r, services: services.filter((s) => s.regionCode === r.regionCode) }));
}
