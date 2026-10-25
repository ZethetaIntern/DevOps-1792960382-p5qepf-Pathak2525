import { RefreshCw } from "lucide-react";
import usePolling from "../hooks/usePolling.js";
import { DashboardAPI, RegionAPI } from "../services/api";
import MetricsCards from "../components/dashboard/MetricsCards.jsx";
import RegionHealth from "../components/dashboard/RegionHealth.jsx";
import ReplicationLag from "../components/dashboard/ReplicationLag.jsx";
import TransactionChart from "../components/dashboard/TransactionChart.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { hasRole } = useAuth();
  const metrics = usePolling(DashboardAPI.metrics, 15000);
  const lag = usePolling(DashboardAPI.lag, 60000);
  const regions = usePolling(RegionAPI.list, 15000);

  if (metrics.loading || regions.loading) return <LoadingSpinner label="Loading command center..." />;
  if (metrics.error) return <p className="alert alert-bad" role="alert">{metrics.error}</p>;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>PaySecure DR Command Center</h2>
          <p className="muted">3.2M transactions/day · ₹500 crore/day · 45,000 merchants · 99.99% availability · RTO ≤ 5 min</p>
        </div>
        {hasRole("admin", "sre") && (
          <button className="btn btn-ghost" onClick={async () => { await DashboardAPI.refresh(); metrics.reload(); regions.reload(); }}>
            <RefreshCw size={14} /> Refresh simulated health
          </button>
        )}
      </div>
      <MetricsCards metrics={metrics.data} />
      {regions.data && <RegionHealth regions={regions.data} />}
      <section className="grid two">
        {lag.data && <ReplicationLag series={lag.data} rpoTarget={metrics.data.targets.rpoSeconds} />}
        <TransactionChart hourly={metrics.data.transactions.hourly} counts={metrics.data.transactions.counts} />
      </section>
    </>
  );
}
