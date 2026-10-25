# Threat model (STRIDE, summarised)

| Threat | Example | Mitigation in this project |
|---|---|---|
| Spoofing | Stolen operator credentials trigger failover | JWT auth, bcrypt (cost 12), lockout after 5 failures, MFA at IdP in production |
| Tampering | Audit history altered after an incident | Append-only model hooks + SHA-256 hash chain, `/api/audit-logs/verify` |
| Repudiation | Operator denies approving a failover | Every privileged action recorded with actor, role, IP, resource |
| Information disclosure | PAN or secrets in dashboard data | Dashboard stores no card data; secrets via env/Secrets Manager; helmet, CORS allow-list |
| Denial of service | Login brute-force / API flooding | express-rate-limit (global + login), body size limit |
| Elevation of privilege | Viewer triggers failover | RBAC permission map (`authorize.js`), two-person rule, `ALLOW_REAL_FAILOVER=false` |
| Split-brain | Both regions accept writes | Preflight blocks target-already-primary; fence-before-promote; runbook 03 |
| Duplicate charging | Retry after failover | Idempotency keys, unique index, reconcile-before-retry |
| Insider / supply chain | Malicious dependency | Pinned versions, lockfile, CI; review before production |
| Regional data egress | Replica outside India | Terraform region allow-list validation; SCP recommended |

Residual gaps: no MFA built into this demo app, no WAF, no secrets-manager integration in the local stack, simulation data only.
