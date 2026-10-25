import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import usePolling from "../hooks/usePolling.js";
import { AuditAPI, errorMessage } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuditLogs() {
  const { hasRole } = useAuth();
  const allowed = hasRole("admin", "security", "risk", "cto");
  const [page, setPage] = useState(1);
  const [verify, setVerify] = useState(null);
  const { data, loading, error } = usePolling(() => (allowed ? AuditAPI.list({ page, limit: 20 }) : Promise.resolve(null)), 0, [page, allowed]);

  if (!allowed) return <p className="alert alert-warn">Audit logs are restricted to admin, security, risk and CTO roles.</p>;

  async function runVerify() {
    try { setVerify(await AuditAPI.verify()); } catch (e) { setVerify({ valid: false, reason: errorMessage(e) }); }
  }

  return (
    <>
      <div className="page-head">
        <h2>Audit logs</h2>
        <button className="btn" onClick={runVerify}><ShieldCheck size={14} /> Verify hash chain</button>
      </div>
      {verify && (
        <p className={`alert ${verify.valid ? "alert-ok" : "alert-bad"}`}>
          {verify.valid ? `Chain intact — ${verify.checked} entries verified.` : `Chain broken at seq ${verify.brokenAtSeq ?? "?"}: ${verify.reason}`}
        </p>
      )}
      {loading && <LoadingSpinner />}
      {error && <p className="alert alert-bad">{error}</p>}
      {data && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Time</th><th>Actor</th><th>Action</th><th>Resource</th><th>Hash</th></tr></thead>
              <tbody>
                {data.data.map((a) => (
                  <tr key={a._id}>
                    <td>{a.seq}</td><td>{new Date(a.createdAt).toLocaleString()}</td>
                    <td>{a.actorEmail}<br /><small className="muted">{a.actorRole}</small></td>
                    <td><StatusBadge value={a.action.includes("failed") ? "failed" : "info"}>{a.action}</StatusBadge></td>
                    <td>{a.resource} {a.resourceId && <small className="muted">{String(a.resourceId).slice(-6)}</small>}</td>
                    <td><code>{a.hash.slice(0, 10)}…</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>Page {data.pagination.page} of {data.pagination.pages || 1}</span>
            <button className="btn btn-sm btn-ghost" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </>
  );
}
