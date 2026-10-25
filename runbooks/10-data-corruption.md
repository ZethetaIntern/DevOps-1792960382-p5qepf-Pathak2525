# Runbook 10: Data corruption or accidental deletion

| Field | Value |
|---|---|
| Severity | CRITICAL |
| Owner | Database Architect |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
Contain bad writes, identify a clean recovery point, restore to an isolated environment and reconcile valid transactions before recovery.

## Trigger
Bad deployment, faulty migration or operator error corrupts or deletes payment data.

## Prerequisites
- Aurora backtrack/PITR enabled
- Immutable backups with cross-region copy
- Change-freeze process

## Procedure
1. Stop the faulty writer/deployment and freeze writes.
2. Identify the corruption start time from audit logs and metrics.
3. Select a clean recovery point (PITR timestamp).
4. Restore to an isolated cluster; do not overwrite production.
5. Diff restored data against production; list valid post-recovery-point transactions.
6. Replay valid transactions idempotently into the restored dataset.
7. Cut over after DBA, Security and Risk approval.

## Validation
- Checksums match
- Ledger balanced
- Sampled records verified by Finance

## Measurable success criteria
- Corrupted data removed, valid transactions retained

## Abort condition
Stop if recovery point cannot be proven clean.

## Rollback
- Keep corrupted cluster read-only for forensics.

## Escalation
- CTO + Compliance Officer

## Evidence to capture
- Corruption timeline
- Restore logs
- Reconciliation report

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
