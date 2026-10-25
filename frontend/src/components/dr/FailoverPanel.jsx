import { useState } from "react";
import { CheckCircle2, Play, RotateCcw, ShieldAlert, XCircle } from "lucide-react";
import StatusBadge from "../common/StatusBadge.jsx";
import { FailoverAPI, errorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext.jsx";

const SCENARIOS = ["region-failure", "aurora-failure", "peak-load", "network-isolation", "drill"];

export default function FailoverPanel({ runs, onChange }) {
  const { user, hasRole } = useAuth();
  const [scenario, setScenario] = useState("region-failure");
  const [direction, setDirection] = useState("failover");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function act(fn, success) {
    setBusy(true);
    setMessage({ type: "", text: "" });
    try {
      await fn();
      setMessage({ type: "ok", text: success });
      await onChange();
    } catch (e) {
      setMessage({ type: "bad", text: errorMessage(e) });
      await onChange();
    } finally {
      setBusy(false);
    }
  }

  const canRequest = hasRole("admin", "sre");
  const canApprove = hasRole("admin", "cto", "dba", "risk");

  return (
    <section className="card">
      <header className="card-head">
        <h3><ShieldAlert size={16} /> Guarded failover (simulation only)</h3>
        {hasRole("admin") && (
          <button className="btn btn-ghost" disabled={busy} onClick={() => act(() => FailoverAPI.reset(), "Lab reset to Mumbai primary")}>
            <RotateCcw size={14} /> Reset lab
          </button>
        )}
      </header>
      <p className="hint">Request → second person approves → execute. Real payment traffic is never touched; the backend refuses non-simulation mode.</p>

      {canRequest ? (
        <form className="form-row" onSubmit={(e) => { e.preventDefault(); act(() => FailoverAPI.request({ scenario, reason, direction }), "Failover request created"); setReason(""); }}>
          <select value={scenario} onChange={(e) => setScenario(e.target.value)} aria-label="Scenario">
            {SCENARIOS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={direction} onChange={(e) => setDirection(e.target.value)} aria-label="Direction">
            <option value="failover">failover</option>
            <option value="failback">failback</option>
          </select>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason / incident ticket" required maxLength={500} />
          <button className="btn" disabled={busy}>Request</button>
        </form>
      ) : (
        <p className="hint">Your role ({user.role}) can view runs but not request them.</p>
      )}

      {message.text && <p className={`alert alert-${message.type}`} role="alert">{message.text}</p>}

      <div className="table-wrap">
        <table>
          <thead><tr><th>When</th><th>Scenario</th><th>Route</th><th>Status</th><th>RTO / RPO</th><th>Actions</th></tr></thead>
          <tbody>
            {runs.length === 0 && <tr><td colSpan="6" className="muted">No runs yet.</td></tr>}
            {runs.map((r) => (
              <tr key={r._id}>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>{r.scenario}<br /><small className="muted">{r.direction} · by {r.requestedBy}</small></td>
                <td>{r.fromRegion} → {r.toRegion}</td>
                <td>
                  <StatusBadge value={r.status} />
                  {r.abortReason && <small className="muted block">{r.abortReason}</small>}
                  {r.preflight?.blockers?.length > 0 && <small className="muted block">{r.preflight.blockers.join("; ")}</small>}
                </td>
                <td>{r.measuredRtoSeconds != null ? `${r.measuredRtoSeconds}s / ${r.measuredRpoSeconds}s` : "—"}</td>
                <td className="actions">
                  {r.status === "pending_approval" && canApprove && r.requestedBy !== user.email && (
                    <>
                      <button className="btn btn-sm" disabled={busy} onClick={() => act(() => FailoverAPI.approve(r._id), "Approved")}><CheckCircle2 size={14} /> Approve</button>
                      <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => act(() => FailoverAPI.reject(r._id, "Rejected in UI"), "Rejected")}><XCircle size={14} /> Reject</button>
                    </>
                  )}
                  {r.status === "pending_approval" && r.requestedBy === user.email && <small className="muted">Needs a different approver</small>}
                  {r.status === "approved" && canRequest && (
                    <button className="btn btn-sm" disabled={busy} onClick={() => act(() => FailoverAPI.execute(r._id), "Simulation executed")}><Play size={14} /> Execute</button>
                  )}
                  {["pending_approval", "approved"].includes(r.status) && canRequest && (
                    <button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => act(() => FailoverAPI.abort(r._id, "Aborted in UI"), "Aborted")}>Abort</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
