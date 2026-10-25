# Runbook 04: Kafka partition or replication failure

| Field | Value |
|---|---|
| Severity | HIGH |
| Owner | SRE / DevOps Lead |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
Inspect brokers, partition leaders, ISR and replication lag; restore healthy leaders, pause unsafe consumers, verify offsets and replay idempotently.

## Trigger
Under-replicated partitions, leader unavailable, or MirrorMaker 2 replication lag growing.

## Prerequisites
- MirrorMaker 2 offset sync enabled
- Idempotent consumers with dedupe table
- Topic retention >= 7 days

## Procedure
1. Inspect broker health, partition leaders, ISR and under-replicated partitions.
2. Pause consumers whose processing is not idempotent.
3. Restore healthy leaders (preferred leader election) and replace failed brokers.
4. Check MirrorMaker 2 lag and translated consumer offsets.
5. Resume consumers from verified offsets.
6. Replay events idempotently; confirm dedupe table hit-rate.
7. Compare produced vs consumed counts per topic.

## Validation
- ISR complete for all payment topics
- Consumer lag < 30s
- No duplicate side effects

## Measurable success criteria
- Event ordering preserved per key
- Replay produces zero duplicate payments

## Abort condition
Do not replay if offsets cannot be verified; escalate to Database Architect.

## Rollback
- Reset consumer group to last verified offset.

## Escalation
- SRE on-call -> SRE Lead -> CTO

## Evidence to capture
- Partition/ISR snapshot
- Offset translation report
- Replay count and dedupe stats

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
