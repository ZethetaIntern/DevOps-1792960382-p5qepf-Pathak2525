import StatusBadge from "../common/StatusBadge.jsx";

export default function ComplianceTable({ controls, onSelect, selectedId }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Framework</th><th>Requirement</th><th>Design decision</th><th>Implementation</th><th>Owner</th><th>Status</th></tr></thead>
        <tbody>
          {controls.map((c) => (
            <tr key={c.controlId} className={`clickable ${selectedId === c.controlId ? "selected" : ""}`} onClick={() => onSelect(c.controlId)}>
              <td><strong>{c.controlId}</strong></td>
              <td>{c.framework}</td>
              <td>{c.requirement}</td>
              <td>{c.designDecision}</td>
              <td>{c.implementationControl}</td>
              <td>{c.owner}</td>
              <td><StatusBadge value={c.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
