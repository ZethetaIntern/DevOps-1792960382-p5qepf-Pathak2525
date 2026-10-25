# Runbook 12: Failback and reconciliation

| Field | Value |
|---|---|
| Severity | HIGH |
| Owner | SRE / DevOps Lead |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
Rebuild Mumbai, resynchronize data, verify consistency, obtain approval, transfer writer ownership safely and return traffic gradually.

## Trigger
Mumbai restored and stable; business approves returning to normal topology.

## Prerequisites
- Mumbai stable for agreed soak period
- Reverse replication Hyderabad -> Mumbai caught up
- Change window approved

## Procedure
1. Rebuild or validate Mumbai infrastructure from IaC.
2. Establish reverse replication and wait for lag ~0.
3. Run data consistency comparison between regions.
4. Obtain formal approval (CTO, DBA, Risk).
5. Freeze writes briefly, fence Hyderabad writer, promote Mumbai.
6. Shift traffic gradually back to Mumbai.
7. Run full reconciliation of transactions across the incident window.
8. Restore Hyderabad as warm standby.

## Validation
- Single writer (Mumbai)
- Reconciliation shows zero unresolved differences

## Measurable success criteria
- Normal topology restored with no customer impact

## Abort condition
Abort and remain on Hyderabad if consistency checks fail.

## Rollback
- Fail forward to Hyderabad using runbook 1.

## Escalation
- SRE Lead -> CTO

## Evidence to capture
- Consistency report
- Approval record
- Traffic shift timeline

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
