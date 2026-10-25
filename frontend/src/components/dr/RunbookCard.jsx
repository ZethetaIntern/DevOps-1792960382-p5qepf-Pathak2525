import { ChevronRight, UserCheck } from "lucide-react";
import StatusBadge from "../common/StatusBadge.jsx";

export default function RunbookCard({ runbook, active, onSelect }) {
  return (
    <button className={`card runbook-card ${active ? "active" : ""}`} onClick={() => onSelect(runbook.number)}>
      <div className="runbook-num">{String(runbook.number).padStart(2, "0")}</div>
      <div className="runbook-body">
        <strong>{runbook.title}</strong>
        <small className="muted"><UserCheck size={12} /> {runbook.owner}</small>
        <small className="muted">Last tested: {runbook.lastTestedAt ? new Date(runbook.lastTestedAt).toLocaleDateString() : "never"}</small>
      </div>
      <StatusBadge value={runbook.severity} />
      <ChevronRight size={16} />
    </button>
  );
}
