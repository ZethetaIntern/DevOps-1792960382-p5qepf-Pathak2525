// Single source of truth for the 12 DR runbooks. Markdown files in /runbooks are generated from this.
export const RUNBOOKS = [
  {
    number: 1, slug: "region-failure", title: "Complete region failure", severity: "critical", owner: "SRE / DevOps Lead",
    trigger: "Mumbai (ap-south-1) unavailable: multiple independent signals (Route 53 health checks, CloudWatch synthetic canaries, AWS Health) confirm outage for > 3 minutes.",
    summary: "Detect Mumbai outage, verify independent signals, fence the old writer, verify Hyderabad replication state, promote the secondary, route traffic and validate payment reconciliation.",
    prerequisites: ["Hyderabad standby capacity validated in last 7 days", "Aurora Global Database secondary healthy", "Break-glass IAM roles tested", "Merchant communication templates approved"],
    steps: [
      "Incident Commander declares SEV-1 and opens the war-room bridge.",
      "Confirm outage with at least two independent signals (Route 53, canary, AWS Health Dashboard).",
      "Fence the Mumbai writer: block writes via SCP/security group and set app maintenance flag.",
      "Check Aurora global replication lag and DynamoDB replication metrics; record RPO.",
      "Obtain two-person approval (DBA + Risk Head) to promote Hyderabad.",
      "Promote Aurora secondary cluster; verify it accepts writes and old writer is detached.",
      "Scale Hyderabad compute to peak capacity; warm Redis and verify Kafka consumer offsets.",
      "Shift Route 53 weights to Hyderabad gradually (10% -> 50% -> 100%) while watching error rate.",
      "Reconcile uncertain transactions against the processor/bank using idempotency keys.",
      "Publish merchant status update and start evidence capture."
    ],
    validation: ["Payment success rate >= pre-incident baseline minus 0.5%", "p99 latency within SLO", "No duplicate settlements after reconciliation"],
    successCriteria: ["Service restored within 5 minutes (RTO)", "Acknowledged-transaction loss within 60 seconds (RPO)", "Zero duplicate charges"],
    abortCondition: "Abort and keep writes stopped if replication consistency cannot be proven or a second writer is detected.",
    rollback: ["Re-enable Mumbai only after fencing is lifted by Incident Commander and replication is re-established (see runbook 12)."],
    escalation: ["Incident Commander -> CTO -> Business/Risk Head", "Notify RBI/NPCI contacts per regulatory timelines via Compliance Officer"],
    evidence: ["Timestamps: detect, decide, promote, restore", "Replication lag at incident and recovery", "Transaction counts: successful/failed/duplicated/uncertain", "Approver names and decision log"]
  },
  {
    number: 2, slug: "aurora-failover", title: "Aurora PostgreSQL failure", severity: "critical", owner: "Database Architect",
    trigger: "Aurora writer unavailable, sustained connection failures, or replication lag above RPO target.",
    summary: "Check cluster health and replication lag, establish writer ownership, promote the global secondary when approved, validate ledger consistency and reconnect clients.",
    prerequisites: ["Aurora Global Database configured Mumbai -> Hyderabad", "Connection strings via Secrets Manager with regional endpoints", "Ledger reconciliation queries tested"],
    steps: [
      "Check cluster events, writer status and in-region failover first (multi-AZ) before cross-region action.",
      "Record global replication lag (AuroraGlobalDBReplicationLag).",
      "Stop application writes (maintenance flag) to prevent split-brain.",
      "Approve promotion (DBA + Risk Head).",
      "Run managed global-cluster failover/promote of the Hyderabad secondary.",
      "Update application writer endpoint and restart connection pools.",
      "Run ledger consistency checks: sum of debits = sum of credits, no orphan settlements.",
      "Resume writes gradually and monitor error rate."
    ],
    validation: ["Writer endpoint accepts INSERT/UPDATE", "Ledger totals reconcile", "Replication from new writer re-established"],
    successCriteria: ["Writes restored within RTO", "No acknowledged transaction missing from ledger"],
    abortCondition: "Abort promotion if lag exceeds RPO and business has not accepted the data loss in writing.",
    rollback: ["Do not auto-failback; use runbook 12 after Mumbai is rebuilt."],
    escalation: ["DBA on-call -> Database Architect -> CTO"],
    evidence: ["Lag graph before/after", "Promotion command log", "Ledger reconciliation output"]
  },
  {
    number: 3, slug: "database-split-brain", title: "Database split-brain", severity: "critical", owner: "Database Architect",
    trigger: "Two regions accept writes for the same ledger partition or conflicting transaction states detected.",
    summary: "Stop conflicting writes, fence the former primary, identify authoritative transactions, resolve conflicts using ledger evidence and reconcile before resuming processing.",
    prerequisites: ["Writer fencing mechanism (SG/SCP/feature flag) tested", "Idempotency keys stored with every payment", "Conflict resolution policy approved"],
    steps: [
      "Freeze all payment writes globally (maintenance mode).",
      "Fence the non-authoritative region immediately.",
      "Snapshot both databases for forensics.",
      "Identify the authoritative writer using the last confirmed promotion record.",
      "Diff transactions by idempotency key; classify as same, conflicting or unique.",
      "Resolve conflicts with ledger evidence and processor/bank confirmations.",
      "Apply corrections via audited compensating entries (never manual deletes).",
      "Resume writes only after Database Architect and Risk Head sign off."
    ],
    validation: ["Single writer confirmed", "Zero conflicting idempotency keys", "Ledger balanced"],
    successCriteria: ["No customer double-charged", "All conflicts documented and resolved"],
    abortCondition: "Keep writes frozen until conflicts are fully classified.",
    rollback: ["Restore from pre-incident snapshot to isolated environment if corruption suspected."],
    escalation: ["CTO + Business/Risk Head immediately", "Compliance Officer for regulatory notification"],
    evidence: ["Both-side transaction diff", "Compensating entry list", "Sign-off record"]
  },
  {
    number: 4, slug: "kafka-partition", title: "Kafka partition or replication failure", severity: "high", owner: "SRE / DevOps Lead",
    trigger: "Under-replicated partitions, leader unavailable, or MirrorMaker 2 replication lag growing.",
    summary: "Inspect brokers, partition leaders, ISR and replication lag; restore healthy leaders, pause unsafe consumers, verify offsets and replay idempotently.",
    prerequisites: ["MirrorMaker 2 offset sync enabled", "Idempotent consumers with dedupe table", "Topic retention >= 7 days"],
    steps: [
      "Inspect broker health, partition leaders, ISR and under-replicated partitions.",
      "Pause consumers whose processing is not idempotent.",
      "Restore healthy leaders (preferred leader election) and replace failed brokers.",
      "Check MirrorMaker 2 lag and translated consumer offsets.",
      "Resume consumers from verified offsets.",
      "Replay events idempotently; confirm dedupe table hit-rate.",
      "Compare produced vs consumed counts per topic."
    ],
    validation: ["ISR complete for all payment topics", "Consumer lag < 30s", "No duplicate side effects"],
    successCriteria: ["Event ordering preserved per key", "Replay produces zero duplicate payments"],
    abortCondition: "Do not replay if offsets cannot be verified; escalate to Database Architect.",
    rollback: ["Reset consumer group to last verified offset."],
    escalation: ["SRE on-call -> SRE Lead -> CTO"],
    evidence: ["Partition/ISR snapshot", "Offset translation report", "Replay count and dedupe stats"]
  },
  {
    number: 5, slug: "redis-failure", title: "Redis outage", severity: "high", owner: "SRE / DevOps Lead",
    trigger: "ElastiCache primary unavailable, eviction storm, or cache hit-rate collapse.",
    summary: "Protect the database from cache stampedes, rebuild or restore cache, expire stale sessions safely and apply rate limits.",
    prerequisites: ["Cache treated as non-authoritative", "Circuit breakers and request coalescing enabled", "Snapshot schedule verified"],
    steps: [
      "Enable load shedding and per-merchant rate limits.",
      "Turn on cache-bypass with request coalescing to avoid stampede on Aurora.",
      "Fail over replica in-region, or restore from latest snapshot / rebuild empty cluster.",
      "Invalidate sessions that cannot be trusted and force re-authentication.",
      "Warm critical keys (merchant config, rate-limit counters) gradually.",
      "Watch Aurora CPU/connections while hit-rate recovers."
    ],
    validation: ["Hit-rate recovering", "Aurora connections stable", "No stale session accepted"],
    successCriteria: ["Payments continue with degraded latency only", "No data-loss in system of record"],
    abortCondition: "If DB saturation exceeds 80%, increase shedding rather than risk database failure.",
    rollback: ["Remove bypass flags after hit-rate > 90%."],
    escalation: ["SRE on-call -> SRE Lead"],
    evidence: ["Hit-rate and latency graphs", "Shedding policy used"]
  },
  {
    number: 6, slug: "dynamodb-replication", title: "DynamoDB replication issue", severity: "high", owner: "Database Architect",
    trigger: "ReplicationLatency alarm, throttled writes, or conflicting item versions across global-table replicas.",
    summary: "Inspect replication and throttling, determine conflict behavior, reconcile multi-region updates and verify the required recovery data is present.",
    prerequisites: ["Single-region write ownership for critical items", "Version attributes on items", "Capacity alarms configured"],
    steps: [
      "Check ReplicationLatency and throttle metrics per replica.",
      "Increase capacity or switch to on-demand if throttling.",
      "Identify items written in both regions during the window.",
      "Apply last-writer-wins awareness: compare version attributes and ledger evidence.",
      "Reconcile conflicting items through an audited script.",
      "Verify required session/idempotency data exists in the recovery region."
    ],
    validation: ["Replication latency normal", "Zero unresolved conflicting items"],
    successCriteria: ["Recovery data complete in Hyderabad", "No lost idempotency keys"],
    abortCondition: "Pause cross-region writes if conflicts cannot be classified.",
    rollback: ["Restore table from point-in-time recovery into an isolated table."],
    escalation: ["DBA on-call -> Database Architect"],
    evidence: ["Latency metrics", "Conflict list and resolution script output"]
  },
  {
    number: 7, slug: "peak-load-failover", title: "Peak-load failover", severity: "high", owner: "SRE / DevOps Lead",
    trigger: "Failover required during peak traffic (festive sales, salary day) or standby capacity unproven.",
    summary: "Validate standby capacity, autoscaling limits, connection pools, downstream rate limits and payment processor quotas before shifting traffic.",
    prerequisites: ["Documented peak multiplier (e.g. 5x-10x of ~37 TPS average)", "Pre-warmed compute in Hyderabad", "Processor quota confirmed for recovery region"],
    steps: [
      "Compare current TPS to Hyderabad provisioned capacity.",
      "Raise ASG/ECS desired capacity and confirm quota headroom.",
      "Verify Aurora connection pool limits and proxy capacity.",
      "Confirm downstream bank/processor rate limits for the new region IPs.",
      "Shift traffic in stages (10/25/50/100%) with automatic rollback on error-rate breach.",
      "Enable queue-based back-pressure for non-critical flows."
    ],
    validation: ["Error rate < 0.5% at each stage", "CPU < 70%", "Latency within SLO"],
    successCriteria: ["Full traffic served without throttling"],
    abortCondition: "Return traffic to previous stage if error rate breaches threshold twice.",
    rollback: ["Reverse the staged weight shift."],
    escalation: ["SRE Lead -> CTO"],
    evidence: ["Load test report", "Stage-by-stage metrics"]
  },
  {
    number: 8, slug: "network-connectivity", title: "Inter-region network failure", severity: "high", owner: "SRE / DevOps Lead",
    trigger: "Mumbai<->Hyderabad private connectivity lost while both regions may still be serving users.",
    summary: "Distinguish network isolation from region failure, prevent dual writers and validate private connectivity and DNS behavior.",
    prerequisites: ["Transit Gateway inter-region peering monitored", "Quorum/witness signals defined"],
    steps: [
      "Check if each region is healthy from external vantage points.",
      "If both are healthy but isolated, keep the existing primary as the only writer.",
      "Block promotion of the standby while isolation persists.",
      "Troubleshoot peering, routes, security groups and DNS resolution.",
      "After recovery, confirm replication catches up before lifting restrictions."
    ],
    validation: ["Single writer", "Replication lag returns to normal"],
    successCriteria: ["No split-brain occurred"],
    abortCondition: "Never promote standby on isolation alone.",
    rollback: ["Restore previous route tables from IaC state."],
    escalation: ["Network on-call -> SRE Lead"],
    evidence: ["Connectivity tests", "Route table diff"]
  },
  {
    number: 9, slug: "availability-zone-failure", title: "Availability Zone failure", severity: "medium", owner: "SRE / DevOps Lead",
    trigger: "One AZ in Mumbai degraded or unavailable.",
    summary: "Verify multi-AZ resilience, service health, capacity and database failover without unnecessarily switching the whole region.",
    prerequisites: ["Workloads spread across >= 3 AZs", "Aurora Multi-AZ replicas", "ALB cross-zone enabled"],
    steps: [
      "Confirm scope: single AZ vs region.",
      "Drain the affected AZ from load balancers.",
      "Verify Aurora promoted an in-region replica if writer was in the AZ.",
      "Check capacity in remaining AZs and scale out.",
      "Monitor until AWS declares recovery; rebalance."
    ],
    validation: ["Error rate normal", "Capacity >= peak requirement with N-1 AZs"],
    successCriteria: ["No cross-region failover required"],
    abortCondition: "Escalate to runbook 1 if more than one AZ is impaired.",
    rollback: ["Re-add AZ to load balancers after health checks pass."],
    escalation: ["SRE on-call"],
    evidence: ["AZ health timeline", "Capacity graphs"]
  },
  {
    number: 10, slug: "data-corruption", title: "Data corruption or accidental deletion", severity: "critical", owner: "Database Architect",
    trigger: "Bad deployment, faulty migration or operator error corrupts or deletes payment data.",
    summary: "Contain bad writes, identify a clean recovery point, restore to an isolated environment and reconcile valid transactions before recovery.",
    prerequisites: ["Aurora backtrack/PITR enabled", "Immutable backups with cross-region copy", "Change-freeze process"],
    steps: [
      "Stop the faulty writer/deployment and freeze writes.",
      "Identify the corruption start time from audit logs and metrics.",
      "Select a clean recovery point (PITR timestamp).",
      "Restore to an isolated cluster; do not overwrite production.",
      "Diff restored data against production; list valid post-recovery-point transactions.",
      "Replay valid transactions idempotently into the restored dataset.",
      "Cut over after DBA, Security and Risk approval."
    ],
    validation: ["Checksums match", "Ledger balanced", "Sampled records verified by Finance"],
    successCriteria: ["Corrupted data removed, valid transactions retained"],
    abortCondition: "Stop if recovery point cannot be proven clean.",
    rollback: ["Keep corrupted cluster read-only for forensics."],
    escalation: ["CTO + Compliance Officer"],
    evidence: ["Corruption timeline", "Restore logs", "Reconciliation report"]
  },
  {
    number: 11, slug: "security-incident", title: "Security incident", severity: "critical", owner: "Security & Compliance Officer",
    trigger: "Credential compromise, unauthorized access, suspected exfiltration or ransomware indicators.",
    summary: "Contain compromised credentials, preserve forensic evidence, revoke access and recover using trusted infrastructure and clean secrets.",
    prerequisites: ["CloudTrail and VPC flow logs retained in India regions", "Break-glass accounts", "Secret rotation automation"],
    steps: [
      "Declare security incident and restrict communications to the response channel.",
      "Contain: disable compromised users/keys, isolate affected instances.",
      "Preserve evidence: snapshots, logs, memory images where applicable.",
      "Rotate all secrets and certificates from a trusted workstation.",
      "Rebuild affected workloads from known-good IaC and images.",
      "Assess cardholder-data and payment-data exposure.",
      "Notify regulators and card networks per mandated timelines through Compliance."
    ],
    validation: ["No unauthorized sessions", "All secrets rotated", "Integrity checks pass"],
    successCriteria: ["Threat contained and evidence preserved"],
    abortCondition: "Do not fail over into an environment that shares compromised credentials.",
    rollback: ["Re-enable access only after Security Officer approval."],
    escalation: ["Security Officer -> CTO -> Legal"],
    evidence: ["Forensic images", "Access revocation log", "Notification record"]
  },
  {
    number: 12, slug: "failback-and-reconciliation", title: "Failback and reconciliation", severity: "high", owner: "SRE / DevOps Lead",
    trigger: "Mumbai restored and stable; business approves returning to normal topology.",
    summary: "Rebuild Mumbai, resynchronize data, verify consistency, obtain approval, transfer writer ownership safely and return traffic gradually.",
    prerequisites: ["Mumbai stable for agreed soak period", "Reverse replication Hyderabad -> Mumbai caught up", "Change window approved"],
    steps: [
      "Rebuild or validate Mumbai infrastructure from IaC.",
      "Establish reverse replication and wait for lag ~0.",
      "Run data consistency comparison between regions.",
      "Obtain formal approval (CTO, DBA, Risk).",
      "Freeze writes briefly, fence Hyderabad writer, promote Mumbai.",
      "Shift traffic gradually back to Mumbai.",
      "Run full reconciliation of transactions across the incident window.",
      "Restore Hyderabad as warm standby."
    ],
    validation: ["Single writer (Mumbai)", "Reconciliation shows zero unresolved differences"],
    successCriteria: ["Normal topology restored with no customer impact"],
    abortCondition: "Abort and remain on Hyderabad if consistency checks fail.",
    rollback: ["Fail forward to Hyderabad using runbook 1."],
    escalation: ["SRE Lead -> CTO"],
    evidence: ["Consistency report", "Approval record", "Traffic shift timeline"]
  }
];
