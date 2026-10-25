# Runbook 06: DynamoDB replication issue

| Field | Value |
|---|---|
| Severity | HIGH |
| Owner | Database Architect |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
Inspect replication and throttling, determine conflict behavior, reconcile multi-region updates and verify the required recovery data is present.

## Trigger
ReplicationLatency alarm, throttled writes, or conflicting item versions across global-table replicas.

## Prerequisites
- Single-region write ownership for critical items
- Version attributes on items
- Capacity alarms configured

## Procedure
1. Check ReplicationLatency and throttle metrics per replica.
2. Increase capacity or switch to on-demand if throttling.
3. Identify items written in both regions during the window.
4. Apply last-writer-wins awareness: compare version attributes and ledger evidence.
5. Reconcile conflicting items through an audited script.
6. Verify required session/idempotency data exists in the recovery region.

## Validation
- Replication latency normal
- Zero unresolved conflicting items

## Measurable success criteria
- Recovery data complete in Hyderabad
- No lost idempotency keys

## Abort condition
Pause cross-region writes if conflicts cannot be classified.

## Rollback
- Restore table from point-in-time recovery into an isolated table.

## Escalation
- DBA on-call -> Database Architect

## Evidence to capture
- Latency metrics
- Conflict list and resolution script output

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
