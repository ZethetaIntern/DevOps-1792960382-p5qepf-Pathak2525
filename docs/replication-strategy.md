# Replication strategy per data store

| Store | Design | Failure behaviour | Key risks / controls |
|---|---|---|---|
| Aurora PostgreSQL | Aurora Global Database Mumbai → Hyderabad; secondary promoted on regional disaster | Managed promotion of secondary; clients switch writer endpoint | Replication lag = potential data loss (RPO); fence old writer; ledger reconciliation after promotion |
| DynamoDB | Global table (idempotency keys, sessions) | Replicas accept writes in either region | Last-writer-wins conflicts; keep critical items single-writer, version attribute, reconcile (runbook 06) |
| ElastiCache Redis | Region-local, snapshots only | Rebuild/restore; not replicated cross-region | Never source of truth; protect DB from stampede; expire stale sessions (runbook 05) |
| Kafka (MSK) | MirrorMaker 2 or MSK Replicator with offset translation | Consumers resume from translated offsets | Duplicates, ordering, replay; idempotent consumers + dedupe table (runbook 04) |
| MongoDB (dashboard) | Regional backups (mongodump / managed backups) | Restore dashboard metadata + audit history | Not the payment ledger; protect audit chain |

## RPO definition
RPO is the maximum acceptable loss of **acknowledged, durable transactions**. Enabling replication does not guarantee sub-minute RPO; prove it with measured lag (CloudWatch `AuroraGlobalDBReplicationLag`, DynamoDB `ReplicationLatency`) under peak load and with disaster tests.

## Failover preconditions (enforced in simulation by `failoverService.evaluatePreflight`)
- Source is the current primary; target is not primary (prevents split-brain).
- Target region and all its dependencies are not down.
- Worst replication lag ≤ RPO target.
- Two-person approval; requester ≠ approver.
- Real (non-simulation) mode is always refused.

## Reconciliation
Uncertain transactions are matched by idempotency key against the authoritative processor/bank record before any retry. Unresolved items stay `uncertain` and block closure of the incident.
