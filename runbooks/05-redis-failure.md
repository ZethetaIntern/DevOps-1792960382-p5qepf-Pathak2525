# Runbook 05: Redis outage

| Field | Value |
|---|---|
| Severity | HIGH |
| Owner | SRE / DevOps Lead |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
Protect the database from cache stampedes, rebuild or restore cache, expire stale sessions safely and apply rate limits.

## Trigger
ElastiCache primary unavailable, eviction storm, or cache hit-rate collapse.

## Prerequisites
- Cache treated as non-authoritative
- Circuit breakers and request coalescing enabled
- Snapshot schedule verified

## Procedure
1. Enable load shedding and per-merchant rate limits.
2. Turn on cache-bypass with request coalescing to avoid stampede on Aurora.
3. Fail over replica in-region, or restore from latest snapshot / rebuild empty cluster.
4. Invalidate sessions that cannot be trusted and force re-authentication.
5. Warm critical keys (merchant config, rate-limit counters) gradually.
6. Watch Aurora CPU/connections while hit-rate recovers.

## Validation
- Hit-rate recovering
- Aurora connections stable
- No stale session accepted

## Measurable success criteria
- Payments continue with degraded latency only
- No data-loss in system of record

## Abort condition
If DB saturation exceeds 80%, increase shedding rather than risk database failure.

## Rollback
- Remove bypass flags after hit-rate > 90%.

## Escalation
- SRE on-call -> SRE Lead

## Evidence to capture
- Hit-rate and latency graphs
- Shedding policy used

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
