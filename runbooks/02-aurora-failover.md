# Runbook 02: Aurora PostgreSQL failure

| Field | Value |
|---|---|
| Severity | CRITICAL |
| Owner | Database Architect |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
Check cluster health and replication lag, establish writer ownership, promote the global secondary when approved, validate ledger consistency and reconnect clients.

## Trigger
Aurora writer unavailable, sustained connection failures, or replication lag above RPO target.

## Prerequisites
- Aurora Global Database configured Mumbai -> Hyderabad
- Connection strings via Secrets Manager with regional endpoints
- Ledger reconciliation queries tested

## Procedure
1. Check cluster events, writer status and in-region failover first (multi-AZ) before cross-region action.
2. Record global replication lag (AuroraGlobalDBReplicationLag).
3. Stop application writes (maintenance flag) to prevent split-brain.
4. Approve promotion (DBA + Risk Head).
5. Run managed global-cluster failover/promote of the Hyderabad secondary.
6. Update application writer endpoint and restart connection pools.
7. Run ledger consistency checks: sum of debits = sum of credits, no orphan settlements.
8. Resume writes gradually and monitor error rate.

## Validation
- Writer endpoint accepts INSERT/UPDATE
- Ledger totals reconcile
- Replication from new writer re-established

## Measurable success criteria
- Writes restored within RTO
- No acknowledged transaction missing from ledger

## Abort condition
Abort promotion if lag exceeds RPO and business has not accepted the data loss in writing.

## Rollback
- Do not auto-failback; use runbook 12 after Mumbai is rebuilt.

## Escalation
- DBA on-call -> Database Architect -> CTO

## Evidence to capture
- Lag graph before/after
- Promotion command log
- Ledger reconciliation output

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
