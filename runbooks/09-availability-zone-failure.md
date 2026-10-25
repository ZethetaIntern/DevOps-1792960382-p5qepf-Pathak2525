# Runbook 09: Availability Zone failure

| Field | Value |
|---|---|
| Severity | MEDIUM |
| Owner | SRE / DevOps Lead |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
Verify multi-AZ resilience, service health, capacity and database failover without unnecessarily switching the whole region.

## Trigger
One AZ in Mumbai degraded or unavailable.

## Prerequisites
- Workloads spread across >= 3 AZs
- Aurora Multi-AZ replicas
- ALB cross-zone enabled

## Procedure
1. Confirm scope: single AZ vs region.
2. Drain the affected AZ from load balancers.
3. Verify Aurora promoted an in-region replica if writer was in the AZ.
4. Check capacity in remaining AZs and scale out.
5. Monitor until AWS declares recovery; rebalance.

## Validation
- Error rate normal
- Capacity >= peak requirement with N-1 AZs

## Measurable success criteria
- No cross-region failover required

## Abort condition
Escalate to runbook 1 if more than one AZ is impaired.

## Rollback
- Re-add AZ to load balancers after health checks pass.

## Escalation
- SRE on-call

## Evidence to capture
- AZ health timeline
- Capacity graphs

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
