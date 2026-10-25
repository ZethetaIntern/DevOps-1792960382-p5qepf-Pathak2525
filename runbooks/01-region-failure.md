# Runbook 01: Complete region failure

| Field | Value |
|---|---|
| Severity | CRITICAL |
| Owner | SRE / DevOps Lead |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
Detect Mumbai outage, verify independent signals, fence the old writer, verify Hyderabad replication state, promote the secondary, route traffic and validate payment reconciliation.

## Trigger
Mumbai (ap-south-1) unavailable: multiple independent signals (Route 53 health checks, CloudWatch synthetic canaries, AWS Health) confirm outage for > 3 minutes.

## Prerequisites
- Hyderabad standby capacity validated in last 7 days
- Aurora Global Database secondary healthy
- Break-glass IAM roles tested
- Merchant communication templates approved

## Procedure
1. Incident Commander declares SEV-1 and opens the war-room bridge.
2. Confirm outage with at least two independent signals (Route 53, canary, AWS Health Dashboard).
3. Fence the Mumbai writer: block writes via SCP/security group and set app maintenance flag.
4. Check Aurora global replication lag and DynamoDB replication metrics; record RPO.
5. Obtain two-person approval (DBA + Risk Head) to promote Hyderabad.
6. Promote Aurora secondary cluster; verify it accepts writes and old writer is detached.
7. Scale Hyderabad compute to peak capacity; warm Redis and verify Kafka consumer offsets.
8. Shift Route 53 weights to Hyderabad gradually (10% -> 50% -> 100%) while watching error rate.
9. Reconcile uncertain transactions against the processor/bank using idempotency keys.
10. Publish merchant status update and start evidence capture.

## Validation
- Payment success rate >= pre-incident baseline minus 0.5%
- p99 latency within SLO
- No duplicate settlements after reconciliation

## Measurable success criteria
- Service restored within 5 minutes (RTO)
- Acknowledged-transaction loss within 60 seconds (RPO)
- Zero duplicate charges

## Abort condition
Abort and keep writes stopped if replication consistency cannot be proven or a second writer is detected.

## Rollback
- Re-enable Mumbai only after fencing is lifted by Incident Commander and replication is re-established (see runbook 12).

## Escalation
- Incident Commander -> CTO -> Business/Risk Head
- Notify RBI/NPCI contacts per regulatory timelines via Compliance Officer

## Evidence to capture
- Timestamps: detect, decide, promote, restore
- Replication lag at incident and recovery
- Transaction counts: successful/failed/duplicated/uncertain
- Approver names and decision log

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
