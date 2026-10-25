import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import { ComplianceAPI, errorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext.jsx";

export default function EvidenceList({ control, onAdded }) {
  const { hasRole } = useAuth();
  const [title, setTitle] = useState("");
  const [ref, setRef] = useState("");
  const [status, setStatus] = useState("evidence-ready");
  const [error, setError] = useState("");

  if (!control) return <div className="card"><p className="muted">Select a control to view or add evidence.</p></div>;

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await ComplianceAPI.addEvidence(control.controlId, { title, ref, status });
      setTitle(""); setRef("");
      onAdded();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="card">
      <header className="card-head"><h3>Evidence — {control.controlId}</h3></header>
      <ul className="evidence">
        {control.evidence.length === 0 && <li className="muted">No evidence recorded yet.</li>}
        {control.evidence.map((ev, i) => (
          <li key={i}><strong>{ev.title}</strong><br /><small className="muted">{ev.ref} · {new Date(ev.collectedAt).toLocaleDateString()}</small></li>
        ))}
      </ul>
      {hasRole("admin", "security") && (
        <form className="form-row" onSubmit={submit}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Evidence title" required />
          <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Reference (URL, doc, ticket)" required />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>in-progress</option><option>implemented</option><option>evidence-ready</option>
          </select>
          <button className="btn"><FilePlus2 size={14} /> Add</button>
        </form>
      )}
      {error && <p className="alert alert-bad">{error}</p>}
    </div>
  );
}
