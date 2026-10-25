import { useState } from "react";
import usePolling from "../hooks/usePolling.js";
import { RegionAPI } from "../services/api";
import StatusBadge from "../components/common/StatusBadge.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

const STRATEGY = {
  aurora: "Aurora Global Database; promote secondary on regional disaster",
  dynamodb: "Global tables with defined conflict handling",
  redis: "Region-local; rebuild/restore, not source of truth",
  kafka: "MirrorMaker 2 replication, offset translation, idempotent replay",
  api: "Stateless fleet, warm standby capacity",
  mongodb: "Regional backups for dashboard metadata and audit"
};

export default function Services() {
  const [region, setRegion] = useState("");
  const { data, loading, error } = usePolling(() => RegionAPI.services(region ? { region } : {}), 10000, [region]);

  return (
    <>
      <div className="page-head">
        <h2>Service replication health</h2>
        <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region filter">
          <option value="">All regions</option>
          <option value="ap-south-1">Mumbai (ap-south-1)</option>
          <option value="ap-south-2">Hyderabad (ap-south-2)</option>
        </select>
      </div>
      {loading && <LoadingSpinner />}
      {error && <p className="alert alert-bad">{error}</p>}
      {data && (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Service</th><th>Region</th><th>Status</th><th>Latency</th><th>Error rate</th><th>Replication lag</th><th>DR strategy</th></tr></thead>
            <tbody>
              {data.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.service}</strong></td><td>{s.regionCode}</td><td><StatusBadge value={s.status} /></td>
                  <td>{s.latencyMs} ms</td><td>{s.errorRatePercent}%</td><td>{s.replicationLagSeconds}s</td>
                  <td className="muted">{STRATEGY[s.service]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
