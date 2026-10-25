import { config } from "../config/env.js";

/** Deterministic-ish lag series so charts look realistic in simulation. */
export function generateLagSeries(points = 30, baseSeconds = 4, seed = Date.now()) {
  const series = [];
  let x = seed % 997;
  for (let i = 0; i < points; i++) {
    x = (x * 9301 + 49297) % 233280;
    const noise = (x / 233280) * 3;
    const wave = Math.sin(i / 4) * 1.2;
    series.push({
      t: new Date(Date.now() - (points - i) * 60_000).toISOString(),
      aurora: Math.max(0.2, +(baseSeconds + wave + noise).toFixed(2)),
      dynamodb: Math.max(0.1, +(baseSeconds * 0.5 + noise / 2).toFixed(2)),
      kafka: Math.max(0.1, +(baseSeconds * 0.8 + wave / 2 + noise / 2).toFixed(2)),
      rpoTarget: config.workload.rpoTargetSeconds
    });
  }
  return series;
}

/** Is replication lag acceptable to enable writes in the recovery region? */
export function lagIsSafe(lagSeconds, targetSeconds = config.workload.rpoTargetSeconds) {
  return Number.isFinite(lagSeconds) && lagSeconds <= targetSeconds;
}

export function worstLag(services) {
  return services.reduce((max, s) => Math.max(max, s.replicationLagSeconds || 0), 0);
}
