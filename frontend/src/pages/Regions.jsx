import usePolling from "../hooks/usePolling.js";
import { FailoverAPI, RegionAPI } from "../services/api";
import RegionHealth from "../components/dashboard/RegionHealth.jsx";
import FailoverPanel from "../components/dr/FailoverPanel.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Regions() {
  const { hasRole } = useAuth();
  const regions = usePolling(RegionAPI.list, 10000);
  const runs = usePolling(FailoverAPI.list, 10000);

  const reloadAll = async () => { await Promise.all([regions.reload(), runs.reload()]); };

  return (
    <>
      <div className="page-head"><h2>Regions & Failover</h2></div>
      {regions.loading ? <LoadingSpinner /> : regions.data && <RegionHealth regions={regions.data} />}
      {hasRole("admin", "sre") && regions.data && (
        <div className="card">
          <header className="card-head"><h3>Fault injection (simulation)</h3></header>
          <div className="row wrap">
            {regions.data.map((r) => (
              <div key={r.regionCode} className="row">
                <strong>{r.name}</strong>
                {["healthy", "degraded", "down"].map((s) => (
                  <button key={s} className="btn btn-sm btn-ghost" onClick={async () => { await RegionAPI.inject(r.regionCode, s); reloadAll(); }}>{s}</button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {runs.error && <p className="alert alert-bad">{runs.error}</p>}
      <FailoverPanel runs={runs.data || []} onChange={reloadAll} />
    </>
  );
}
