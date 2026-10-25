import StatusBadge from "../common/StatusBadge.jsx";

export default function DrillHistory({ drills }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Date</th><th>Runbook</th><th>Type</th><th>RTO</th><th>RPO</th><th>Transactions (ok/fail/dup/unc)</th><th>Outcome</th><th>Approver</th></tr>
        </thead>
        <tbody>
          {drills.length === 0 && <tr><td colSpan="8" className="muted">No drills recorded.</td></tr>}
          {drills.map((d) => (
            <tr key={d._id}>
              <td>{new Date(d.startedAt).toLocaleDateString()}</td>
              <td>#{d.runbookNumber} {d.title}</td>
              <td>{d.type}</td>
              <td>{d.measuredRtoSeconds}s <StatusBadge value={d.rtoMet ? "pass" : "fail"}>{d.rtoMet ? "met" : "missed"}</StatusBadge></td>
              <td>{d.measuredRpoSeconds}s <StatusBadge value={d.rpoMet ? "pass" : "fail"}>{d.rpoMet ? "met" : "missed"}</StatusBadge></td>
              <td>{d.transactions.successful}/{d.transactions.failed}/{d.transactions.duplicated}/{d.transactions.uncertain}</td>
              <td><StatusBadge value={d.outcome} /></td>
              <td>{d.approver || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
