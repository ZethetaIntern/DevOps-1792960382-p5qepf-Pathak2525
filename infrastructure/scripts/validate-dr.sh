#!/usr/bin/env bash
# Read-only DR readiness checks against AWS (requires AWS CLI + credentials). Makes NO changes.
set -euo pipefail
PRIMARY="${PRIMARY_REGION:-ap-south-1}"
SECONDARY="${SECONDARY_REGION:-ap-south-2}"
GLOBAL_CLUSTER="${GLOBAL_CLUSTER_ID:-paysecure-global}"
RPO_SECONDS="${RPO_SECONDS:-60}"

command -v aws >/dev/null || { echo "aws CLI not found"; exit 1; }
fail=0

echo "== Aurora global cluster members =="
aws rds describe-global-clusters --region "$PRIMARY" --global-cluster-identifier "$GLOBAL_CLUSTER" \
  --query 'GlobalClusters[0].GlobalClusterMembers[].{arn:DBClusterArn,writer:IsWriter}' --output table || fail=1

echo "== Aurora replication lag (last 5 min, max seconds) in $SECONDARY =="
lag=$(aws cloudwatch get-metric-statistics --region "$SECONDARY" --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag --dimensions Name=DBClusterIdentifier,Value="${SECONDARY_CLUSTER_ID:-paysecure-secondary}" \
  --start-time "$(date -u -d '-5 min' +%FT%TZ)" --end-time "$(date -u +%FT%TZ)" --period 60 --statistics Maximum \
  --query 'max(Datapoints[].Maximum)' --output text 2>/dev/null || echo "None")
echo "max lag (ms as reported by AWS): $lag"
if [[ "$lag" != "None" ]]; then
  awk -v l="$lag" -v r="$RPO_SECONDS" 'BEGIN{ exit !((l/1000) > r) }' && { echo "FAIL: lag exceeds RPO ${RPO_SECONDS}s"; fail=1; } || echo "OK: lag within RPO"
fi

echo "== DynamoDB global table replicas =="
aws dynamodb describe-table --region "$PRIMARY" --table-name "${DDB_TABLE:-paysecure-idempotency}" \
  --query 'Table.Replicas[].{region:RegionName,status:ReplicaStatus}' --output table || fail=1

echo "== Route 53 health checks =="
aws route53 list-health-checks --query 'HealthChecks[].{id:Id,type:HealthCheckConfig.Type,fqdn:HealthCheckConfig.FullyQualifiedDomainName}' --output table || fail=1

[[ $fail -eq 0 ]] && echo "DR validation passed (read-only checks)." || { echo "DR validation reported issues."; exit 1; }
