# Runbook 08: Inter-region network failure

| Field | Value |
|---|---|
| Severity | HIGH |
| Owner | SRE / DevOps Lead |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
Distinguish network isolation from region failure, prevent dual writers and validate private connectivity and DNS behavior.

## Trigger
Mumbai<->Hyderabad private connectivity lost while both regions may still be serving users.

## Prerequisites
- Transit Gateway inter-region peering monitored
- Quorum/witness signals defined

## Procedure
1. Check if each region is healthy from external vantage points.
2. If both are healthy but isolated, keep the existing primary as the only writer.
3. Block promotion of the standby while isolation persists.
4. Troubleshoot peering, routes, security groups and DNS resolution.
5. After recovery, confirm replication catches up before lifting restrictions.

## Validation
- Single writer
- Replication lag returns to normal

## Measurable success criteria
- No split-brain occurred

## Abort condition
Never promote standby on isolation alone.

## Rollback
- Restore previous route tables from IaC state.

## Escalation
- Network on-call -> SRE Lead

## Evidence to capture
- Connectivity tests
- Route table diff

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
