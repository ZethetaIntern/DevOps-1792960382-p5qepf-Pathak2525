# Compliance matrix (mapping — NOT a certification claim)

Each requirement links to a design decision, implementation control, test evidence and owner. Obtain a qualified compliance review before relying on this.

| ID | Framework | Requirement | Design decision | Implementation control | Evidence | Owner |
|---|---|---|---|---|---|---|
| RBI-PA-01 | RBI Payment Aggregator Directions | Business continuity / DR plan tested periodically | Mumbai–Hyderabad warm standby, 12 runbooks | `runbooks/`, drill records | Drill history, approved plan | Business/Risk Head |
| RBI-PA-02 | RBI PA | Auditability | Hash-chained audit log | `auditService.js` | `/api/audit-logs/verify` output | Security Officer |
| RBI-PA-03 | RBI PA | Security & access governance | RBAC, two-person approval | `authorize.js`, failover workflow | Access review, test report | Security Officer |
| RBI-LOC-01 | RBI payment data localisation | Payment data stored in India | Both regions Indian | Terraform region validation, SCP | Region config, data-flow inventory | Security Officer |
| RBI-LOC-02 | RBI localisation | Backups/DR copies in India | Cross-region copies only Mumbai↔Hyderabad | Backup vault config | Backup location inventory | Database Architect |
| PCI-01 | PCI DSS v4.0.1 Req 3 | Protect stored account data | Tokenisation, KMS per region | KMS in Terraform; no PAN in dashboard | Scope assessment | Security Officer |
| PCI-02 | PCI DSS Req 7/8 | Access by need-to-know, strong auth | RBAC, MFA in prod | IAM roles, access reviews | Quarterly review | Security Officer |
| PCI-03 | PCI DSS Req 10 | Logging and monitoring | CloudWatch/CloudTrail retention | monitoring module, audit chain | Log retention config | SRE Lead |
| PCI-04 | PCI DSS Req 11/12.10 | Testing and incident response | Quarterly drills, runbook 11 | Drill records | Drill evidence | Security Officer |
| NPCI-01 | NPCI UPI circulars | Follow applicable technical/operating requirements | Isolated UPI integration layer | Validate vs current circulars | Certification evidence | Business/Risk Head |
| NPCI-02 | NPCI UPI | Integrity, duplicates, reconciliation | Idempotency + reconciliation | Unique idempotencyKey, reconcile API | Reconciliation reports | Database Architect |

## Sources to consult (verify current versions)
- RBI Master Direction on Regulation of Payment Aggregators (2025)
- RBI circular: Storage of Payment System Data
- PCI Security Standards Council: PCI DSS v4.0.1
- NPCI UPI official circulars and technical specifications (do not rely on an old implementation guide)

## Data classification caveat
Data localisation does not automatically give every operational tool or log identical legal treatment. Classify data, identify what each service stores, verify backup and telemetry locations, and obtain legal/compliance review.
