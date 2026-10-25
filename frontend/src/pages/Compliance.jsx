import { useState } from "react";
import usePolling from "../hooks/usePolling.js";
import { ComplianceAPI } from "../services/api";
import ComplianceTable from "../components/compliance/ComplianceTable.jsx";
import EvidenceList from "../components/compliance/EvidenceList.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

const FRAMEWORKS = ["", "RBI-PA", "RBI-Localisation", "PCI-DSS-4.0.1", "NPCI-UPI"];

export default function Compliance() {
  const [framework, setFramework] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const { data, loading, error, reload } = usePolling(() => ComplianceAPI.list(framework), 0, [framework]);
  const selected = data?.data.find((c) => c.controlId === selectedId) || null;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Compliance matrix</h2>
          <p className="muted">Mapping, not certification. Obtain a qualified compliance review before relying on this.</p>
        </div>
        <select value={framework} onChange={(e) => setFramework(e.target.value)} aria-label="Framework">
          {FRAMEWORKS.map((f) => <option key={f} value={f}>{f || "All frameworks"}</option>)}
        </select>
      </div>
      {loading && <LoadingSpinner />}
      {error && <p className="alert alert-bad">{error}</p>}
      {data && (
        <>
          <div className="card"><strong>{data.summary.completionPercent}%</strong> of {data.summary.total} controls implemented or evidence-ready</div>
          <div className="card"><ComplianceTable controls={data.data} onSelect={setSelectedId} selectedId={selectedId} /></div>
          <EvidenceList control={selected} onAdded={reload} />
        </>
      )}
    </>
  );
}
