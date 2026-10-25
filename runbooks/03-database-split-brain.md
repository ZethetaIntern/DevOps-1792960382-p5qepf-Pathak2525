# Runbook 03: Database split-brain

| Field | Value |
|---|---|
| Severity | CRITICAL |
| Owner | Database Architect |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
Stop conflicting writes, fence the former primary, identify authoritative transactions, resolve conflicts using ledger evidence and reconcile before resuming processing.

## Trigger
Two regions accept writes for the same ledger partition or conflicting transaction states detected.

## Prerequisites
- Writer fencing mechanism (SG/SCP/feature flag) tested
- Idempotency keys stored with every payment
- Conflict resolution policy approved

## Procedure
1. Freeze all payment writes globally (maintenance mode).
2. Fence the non-authoritative region immediately.
3. Snapshot both databases for forensics.
4. Identify the authoritative writer using the last confirmed promotion record.
5. Diff transactions by idempotency key; classify as same, conflicting or unique.
6. Resolve conflicts with ledger evidence and processor/bank confirmations.
7. Apply corrections via audited compensating entries (never manual deletes).
8. Resume writes only after Database Architect and Risk Head sign off.

## Validation
- Single writer confirmed
- Zero conflicting idempotency keys
- Ledger balanced

## Measurable success criteria
- No customer double-charged
- All conflicts documented and resolved

## Abort condition
Keep writes frozen until conflicts are fully classified.

## Rollback
- Restore from pre-incident snapshot to isolated environment if corruption suspected.

## Escalation
- CTO + Business/Risk Head immediately
- Compliance Officer for regulatory notification

## Evidence to capture
- Both-side transaction diff
- Compensating entry list
- Sign-off record

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
