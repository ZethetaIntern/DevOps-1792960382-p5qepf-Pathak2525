import { useState } from "react";
import usePolling from "../hooks/usePolling.js";
import { TransactionAPI, errorMessage } from "../services/api";
import StatusBadge from "../components/common/StatusBadge.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Transactions() {
  const { hasRole } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const { data, loading, error, reload } = usePolling(() => TransactionAPI.list({ page, limit: 15, ...(status ? { status } : {}) }), 0, [page, status]);

  async function reconcile() {
    try {
      const r = await TransactionAPI.reconcile();
      setNote(`Reconciled ${r.resolved} uncertain transaction(s) (simulation).`);
      reload();
    } catch (e) { setNote(errorMessage(e)); }
  }

  return (
    <>
      <div className="page-head">
        <h2>Simulated transactions</h2>
        <div className="row">
          <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} aria-label="Status filter">
            <option value="">All statuses</option>
            {["success", "failed", "pending", "uncertain", "duplicate"].map((s) => <option key={s}>{s}</option>)}
          </select>
          {hasRole("admin", "sre", "dba") && <button className="btn" onClick={reconcile}>Reconcile uncertain</button>}
        </div>
      </div>
      {note && <p className="alert alert-ok">{note}</p>}
      {loading && <LoadingSpinner />}
      {error && <p className="alert alert-bad">{error}</p>}
      {data && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Time</th><th>Merchant</th><th>Amount</th><th>Method</th><th>Region</th><th>Status</th><th>Reconciled</th><th>Idempotency key</th></tr></thead>
              <tbody>
                {data.data.map((t) => (
                  <tr key={t._id}>
                    <td>{new Date(t.createdAt).toLocaleString()}</td><td>{t.merchantId}</td>
                    <td>₹{t.amountInr.toLocaleString("en-IN")}</td><td>{t.method}</td><td>{t.regionCode}</td>
                    <td><StatusBadge value={t.status} /></td><td>{t.reconciled ? "Yes" : "No"}</td>
                    <td><code>{t.idempotencyKey.slice(0, 8)}…</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>Page {data.pagination.page} of {data.pagination.pages || 1} · {data.pagination.total} records</span>
            <button className="btn btn-sm btn-ghost" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </>
  );
}
