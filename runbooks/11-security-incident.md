# Runbook 11: Security incident

| Field | Value |
|---|---|
| Severity | CRITICAL |
| Owner | Security & Compliance Officer |
| Incident Commander | On-call SRE Lead (rotates weekly) |
| Last tested | _Record in DR Drills page_ |
| RTO / RPO target | 5 minutes / 60 seconds |

## Purpose
Contain compromised credentials, preserve forensic evidence, revoke access and recover using trusted infrastructure and clean secrets.

## Trigger
Credential compromise, unauthorized access, suspected exfiltration or ransomware indicators.

## Prerequisites
- CloudTrail and VPC flow logs retained in India regions
- Break-glass accounts
- Secret rotation automation

## Procedure
1. Declare security incident and restrict communications to the response channel.
2. Contain: disable compromised users/keys, isolate affected instances.
3. Preserve evidence: snapshots, logs, memory images where applicable.
4. Rotate all secrets and certificates from a trusted workstation.
5. Rebuild affected workloads from known-good IaC and images.
6. Assess cardholder-data and payment-data exposure.
7. Notify regulators and card networks per mandated timelines through Compliance.

## Validation
- No unauthorized sessions
- All secrets rotated
- Integrity checks pass

## Measurable success criteria
- Threat contained and evidence preserved

## Abort condition
Do not fail over into an environment that shares compromised credentials.

## Rollback
- Re-enable access only after Security Officer approval.

## Escalation
- Security Officer -> CTO -> Legal

## Evidence to capture
- Forensic images
- Access revocation log
- Notification record

> Do not execute destructive recovery actions against real payment infrastructure without formal authorization. This runbook is a design artifact; validate in a non-production environment first.
