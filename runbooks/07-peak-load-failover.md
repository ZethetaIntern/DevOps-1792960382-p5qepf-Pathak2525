# Runbook 07: Peak-load failover

| Field | Value |
|---|---|
| Severity | HIGH |
| Owner | SRE / DevOps Lead |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
Validate standby capacity, autoscaling limits, connection pools, downstream rate limits and payment processor quotas before shifting traffic.

## Trigger
Failover required during peak traffic (festive sales, salary day) or standby capacity unproven.

## Prerequisites
- Documented peak multiplier (e.g. 5x-10x of ~37 TPS average)
- Pre-warmed compute in Hyderabad
- Processor quota confirmed for recovery region

## Procedure
1. Compare current TPS to Hyderabad provisioned capacity.
2. Raise ASG/ECS desired capacity and confirm quota headroom.
3. Verify Aurora connection pool limits and proxy capacity.
4. Confirm downstream bank/processor rate limits for the new region IPs.
5. Shift traffic in stages (10/25/50/100%) with automatic rollback on error-rate breach.
6. Enable queue-based back-pressure for non-critical flows.

## Validation
- Error rate < 0.5% at each stage
- CPU < 70%
- Latency within SLO

## Measurable success criteria
- Full traffic served without throttling

## Abort condition
Return traffic to previous stage if error rate breaches threshold twice.

## Rollback
- Reverse the staged weight shift.

## Escalation
- SRE Lead -> CTO

## Evidence to capture
- Load test report
- Stage-by-stage metrics

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
