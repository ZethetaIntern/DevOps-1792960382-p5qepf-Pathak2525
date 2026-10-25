# Recovery test plan

## Objectives
Measure (not assume) RTO ≤ 5 min, RPO ≤ 60 s, zero duplicate charges, and 99.99% availability design.

## Scenarios
| # | Scenario | Runbook | Method |
|---|---|---|---|
| T1 | Region failure | 01 | Dashboard simulation → staging game day |
| T2 | Aurora promotion | 02 | Staging global DB failover |
| T3 | Split-brain prevention | 03 | Inject dual-writer attempt; expect block |
| T4 | Kafka partition | 04 | Kill broker; verify ISR/offsets/replay |
| T5 | Redis outage | 05 | Stop cache; verify load shedding |
| T6 | DynamoDB conflict | 06 | Concurrent writes; verify reconciliation |
| T7 | Peak-load failover | 07 | Load test at 5× and 10× |
| T8 | Network isolation | 08 | Block inter-region route; expect no promotion |
| T9 | AZ failure | 09 | Drain one AZ |
| T10 | Data corruption | 10 | Restore PITR to isolated cluster |
| T11 | Security incident | 11 | Credential-revocation tabletop |
| T12 | Failback | 12 | Controlled return to Mumbai |

## Workload parameters
Average 37 TPS; test at documented peak multiplier (5×/10×), realistic ticket sizes (~₹1,562 average).

## Local automated tests
`cd backend && npm test` — failover safety gates, two-person rule, state machine, RTO of simulation, RBAC, JWT, audit chain tampering, workload maths.

## Evidence required per drill
Failover start and restoration timestamps · replication lag at incident and recovery · counts of successful/failed/duplicated/uncertain transactions · reconciliation results · throughput and error rate before/after · approver · known limitations.

Do not run destructive recovery actions against real payment infrastructure without formal authorization.
