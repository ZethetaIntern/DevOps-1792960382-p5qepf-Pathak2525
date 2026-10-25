import { config } from "../config/env.js";
import Transaction from "../models/Transaction.js";
import Drill from "../models/Drill.js";
import ServiceHealth from "../models/ServiceHealth.js";
import Region from "../models/Region.js";
import FailoverRun from "../models/FailoverRun.js";
import { worstLag } from "./replicationService.js";

/** Workload maths from the brief. Pure and unit-tested. */
export function workloadMath({ dailyTransactions, dailyValueInr, sloAvailability }) {
  const avgTps = dailyTransactions / 86_400;
  const avgTicketInr = dailyValueInr / dailyTransactions;
  const allowedDowntimeMinutesPerYear = (1 - sloAvailability / 100) * 365 * 24 * 60;
  return {
    avgTps: +avgTps.toFixed(1),
    avgTicketInr: Math.round(avgTicketInr),
    allowedDowntimeMinutesPerYear: +allowedDowntimeMinutesPerYear.toFixed(1),
    peakTpsAt5x: Math.round(avgTps * 5),
    peakTpsAt10x: Math.round(avgTps * 10)
  };
}

export function successRate(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return total ? +(((counts.success || 0) / total) * 100).toFixed(2) : 100;
}

export async function getDashboardMetrics() {
  const [grouped, drills, services, regions, lastFailover, hourly] = await Promise.all([
    Transaction.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Drill.find().sort({ createdAt: -1 }).limit(10).lean(),
    ServiceHealth.find().lean(),
    Region.find().lean(),
    FailoverRun.findOne({ status: "completed" }).sort({ completedAt: -1 }).lean(),
    Transaction.aggregate([
      { $group: { _id: { $dateToString: { format: "%H:00", date: "$createdAt" } }, total: { $sum: 1 }, failed: { $sum: { $cond: [{ $in: ["$status", ["failed", "uncertain"]] }, 1, 0] } } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  const counts = Object.fromEntries(grouped.map((g) => [g._id, g.count]));
  const lastDrill = drills[0];
  const bestRto = drills.length ? Math.min(...drills.map((d) => d.measuredRtoSeconds)) : null;
  const worstRto = drills.length ? Math.max(...drills.map((d) => d.measuredRtoSeconds)) : null;

  return {
    simulation: true,
    workload: workloadMath(config.workload),
    targets: { rtoSeconds: config.workload.rtoTargetSeconds, rpoSeconds: config.workload.rpoTargetSeconds, availability: config.workload.sloAvailability },
    transactions: { counts, successRate: successRate(counts), hourly: hourly.map((h) => ({ hour: h._id, total: h.total, failed: h.failed })) },
    replication: { worstLagSeconds: worstLag(services), rpoMet: worstLag(services) <= config.workload.rpoTargetSeconds },
    recovery: {
      drills: drills.length,
      lastDrillOutcome: lastDrill?.outcome || "none",
      lastMeasuredRtoSeconds: lastDrill?.measuredRtoSeconds ?? null,
      bestRtoSeconds: bestRto,
      worstRtoSeconds: worstRto,
      rtoMet: lastDrill ? lastDrill.measuredRtoSeconds <= config.workload.rtoTargetSeconds : null,
      lastFailoverAt: lastFailover?.completedAt || null
    },
    regions: regions.map((r) => ({ name: r.name, role: r.role, status: r.status, writerEnabled: r.writerEnabled }))
  };
}
