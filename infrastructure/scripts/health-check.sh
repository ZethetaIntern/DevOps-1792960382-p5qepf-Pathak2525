#!/usr/bin/env bash
# Simple health probe for the DR control-plane API.
set -euo pipefail
API="${API_URL:-http://localhost:5000/api}"

echo "Checking $API/health ..."
resp="$(curl -fsS --max-time 5 "$API/health")"
echo "$resp"
echo "$resp" | grep -q '"success":true' && echo "OK: API healthy" || { echo "FAIL: API unhealthy"; exit 1; }
echo "$resp" | grep -q '"database":"connected"' && echo "OK: database connected" || { echo "WARN: database not connected"; exit 2; }
