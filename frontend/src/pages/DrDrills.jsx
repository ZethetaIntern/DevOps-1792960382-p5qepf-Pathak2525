import { useState } from "react";
import usePolling from "../hooks/usePolling.js";
import { DrillAPI, errorMessage } from "../services/api";
import DrillHistory from "../components/dr/DrillHistory.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const toLocalInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function DrDrills() {
  const { hasRole } = useAuth();
  const { data, loading, error, reload } = usePolling(DrillAPI.list, 0);
  const now = new Date();
  const [form, setForm] = useState({ runbookNumber: 1, title: "", type: "simulation", startedAt: toLocalInput(new Date(now - 4 * 60000)), restoredAt: toLocalInput(now), measuredRpoSeconds: 10, outcome: "pass", approver: "", notes: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    try {
      await DrillAPI.create({ ...form, runbookNumber: Number(form.runbookNumber), measuredRpoSeconds: Number(form.measuredRpoSeconds), startedAt: new Date(form.startedAt).toISOString(), restoredAt: new Date(form.restoredAt).toISOString() });
      setMsg({ type: "ok", text: "Drill recorded. RTO calculated from timestamps." });
      reload();
    } catch (err) { setMsg({ type: "bad", text: errorMessage(err) }); }
  }

  return (
    <>
      <div className="page-head"><h2>DR drill history</h2></div>
      {hasRole("admin", "sre", "dba") && (
        <form className="card form-grid" onSubmit={submit}>
          <h3>Record a drill</h3>
          <label>Runbook #<input type="number" min="1" max="12" value={form.runbookNumber} onChange={set("runbookNumber")} required /></label>
          <label>Title<input value={form.title} onChange={set("title")} required maxLength={160} /></label>
          <label>Type<select value={form.type} onChange={set("type")}><option>simulation</option><option>tabletop</option><option>game-day</option></select></label>
          <label>Failover start<input type="datetime-local" value={form.startedAt} onChange={set("startedAt")} required /></label>
          <label>Service restored<input type="datetime-local" value={form.restoredAt} onChange={set("restoredAt")} required /></label>
          <label>Measured RPO (s)<input type="number" min="0" value={form.measuredRpoSeconds} onChange={set("measuredRpoSeconds")} required /></label>
          <label>Outcome<select value={form.outcome} onChange={set("outcome")}><option>pass</option><option>partial</option><option>fail</option></select></label>
          <label>Approver<input value={form.approver} onChange={set("approver")} /></label>
          <label className="span-2">Notes<input value={form.notes} onChange={set("notes")} maxLength={2000} /></label>
          <button className="btn">Save drill</button>
          {msg.text && <p className={`alert alert-${msg.type} span-2`}>{msg.text}</p>}
        </form>
      )}
      {loading && <LoadingSpinner />}
      {error && <p className="alert alert-bad">{error}</p>}
      {data && <div className="card"><DrillHistory drills={data} /></div>}
    </>
  );
}
