# Business Continuity Review Board — presentation pack

## Board roles and questions
| Role | Main question | Where answered |
|---|---|---|
| CTO | Can the architecture meet the availability goal without excessive complexity? | architecture.md |
| SRE / DevOps Lead | Can recovery finish in 5 minutes repeatably? | recovery-test-plan.md, drills |
| Database Architect | Are acknowledged transactions protected; is split-brain prevented? | replication-strategy.md |
| Security & Compliance Officer | Are data, access, audit and regulations covered? | threat-model.md, compliance-matrix.md |
| Business / Risk Head | Financial impact, merchant comms, abort criteria? | runbooks, section below |

## Slide outline (10)
1. Business problem and payment workload (3.2M tx/day, ₹500 crore/day, 45,000 merchants)
2. Current single-region risks
3. Proposed Mumbai–Hyderabad architecture
4. Active-active vs active-passive decision (choose active-passive first)
5. Aurora, DynamoDB, Redis, Kafka replication strategies
6. Security and data localisation
7. RTO/RPO validation methodology
8. The 12 DR runbooks
9. Cost, operational risks and residual gaps
10. Board decision and production-readiness checklist

## Business impact framing
- Average ₹500 crore/day ≈ ₹20.8 crore/hour. A 5-minute outage at average load touches ≈ ₹1.7 crore of payment value (≈ 11,000 transactions). Peak hours are higher.
- Allowed downtime at 99.99%: ≈ 52.6 min/year.
- Merchant communication: status page + proactive notification within 15 minutes of SEV-1 declaration.
- Abort criteria: consistency not provable, second writer detected, or reconciliation cannot be completed.

## Production-readiness checklist
- [ ] Measured RTO ≤ 5 min and RPO ≤ 60 s in staging drills (multiple runs)
- [ ] Zero duplicate charges in reconciliation across all drills
- [ ] Writer fencing tested; split-brain test blocked
- [ ] All 12 runbooks have owner, last-tested date, success criteria, abort condition
- [ ] Compliance matrix reviewed by qualified reviewer
- [ ] Processor/bank quotas confirmed for recovery region
- [ ] Cost model approved; standby capacity sized for peak
- [ ] Residual gaps accepted in writing by Risk Head

## Known limitations of this repository
Simulation data only; Terraform not applied to a live account; MFA, WAF and secrets-manager integration are production work items.
