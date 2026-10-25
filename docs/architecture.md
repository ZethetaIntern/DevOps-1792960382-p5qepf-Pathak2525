# Architecture — PaySecure Multi-Region DR

## Workload baseline (from the brief)
| Item | Value | Derived |
|---|---|---|
| Transactions/day | 3.2 million | ≈ 37 TPS average |
| Daily value | ₹500 crore (₹5,000,000,000) | ≈ ₹1,562 average ticket (500 crore ÷ 3.2M) |
| Merchants | 45,000 | — |
| Availability | 99.99% | ≈ 52.6 min downtime / 365-day year |
| RTO / RPO | ≤ 5 min / ≤ 60 s (to be *measured*) | — |

> Correction note: ₹500 crore = 5 × 10⁹. Divided by 3.2 × 10⁶ transactions this is about **₹1,562.5**, not ₹15,625.
> Peak load must be planned with a documented multiplier (5× ≈ 185 TPS, 10× ≈ 370 TPS).

## Topology
```
Merchants / clients
        │
 DNS + Route 53 health checks (failover routing)
        │
 ┌──────┴───────────────┐          ┌─────────────────────────┐
 │ Mumbai  ap-south-1   │  async   │ Hyderabad  ap-south-2   │
 │ PRIMARY (writer)     │ ───────▶ │ WARM STANDBY (fenced)   │
 │ ALB + ECS Fargate    │          │ ALB + ECS Fargate       │
 │ Aurora writer        │ Global DB│ Aurora secondary        │
 │ DynamoDB replica     │ Glob.tbl │ DynamoDB replica        │
 │ Redis (local)        │          │ Redis (local, rebuilt)  │
 │ MSK Kafka            │ MM2/Repl │ MSK Kafka               │
 └──────────────────────┘          └─────────────────────────┘
        Ops & governance: React DR dashboard · Express API · MongoDB · CloudWatch · 12 runbooks
```

## Decision: active-passive warm standby first
| Criterion | Active-passive | Active-active |
|---|---|---|
| Duplicate-payment risk | Low (single writer) | High unless ownership + idempotency proven |
| Complexity | Moderate | High |
| RTO | Minutes (promotion + routing) | Seconds |
| Cost | Reduced standby capacity | Near 2× |

Move to active-active only after demonstrating transaction ownership, cross-region consistency, duplicate prevention and safe reconciliation.

## Control plane (this repository)
- **frontend/** React dashboard (regions, services, failover, runbooks, drills, audit, compliance)
- **backend/** Express REST API + MongoDB (Mongoose). Simulation only; real failover is refused.
- **infrastructure/** Terraform modules for both regions; Docker; read-only validation scripts.

## Payment safety rules
1. Every payment has a stable idempotency key.
2. A timeout or Kafka replay never marks a payment successful.
3. Single-writer ownership for critical payment state; fence the old writer before promotion.
4. Verify replication lag and consistency before enabling writes in the recovery region.
5. Reconcile uncertain transactions with the processor/bank before retrying external payment operations.
6. If safety cannot be established, stop new writes instead of risking double charging.
