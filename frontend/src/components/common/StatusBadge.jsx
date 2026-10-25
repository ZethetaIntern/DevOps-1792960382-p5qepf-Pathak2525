const TONES = {
  healthy: "ok", success: "ok", pass: "ok", completed: "ok", implemented: "ok", "evidence-ready": "ok", primary: "info", approved: "info",
  degraded: "warn", partial: "warn", pending: "warn", pending_approval: "warn", "in-progress": "warn", standby: "muted", running: "info", uncertain: "warn",
  down: "bad", failed: "bad", fail: "bad", aborted: "bad", rejected: "bad", fenced: "bad", duplicate: "bad", critical: "bad", high: "warn", medium: "info", "not-started": "muted"
};

export default function StatusBadge({ value, children }) {
  const tone = TONES[value] || "muted";
  return <span className={`badge badge-${tone}`}>{children || String(value).replace(/_/g, " ")}</span>;
}
