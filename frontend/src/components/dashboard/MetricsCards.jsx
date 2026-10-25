import { Clock, Database, Gauge, Percent, Timer, Wallet } from "lucide-react";

function Card({ icon: Icon, label, value, hint, tone = "" }) {
  return (
    <div className={`card metric ${tone}`}>
      <div className="metric-icon"><Icon size={20} /></div>
      <div>
        <p className="metric-label">{label}</p>
        <p className="metric-value">{value}</p>
        {hint && <p className="metric-hint">{hint}</p>}
      </div>
    </div>
  );
}

const fmtSec = (s) => (s === null || s === undefined ? "—" : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

export default function MetricsCards({ metrics }) {
  const { workload, targets, transactions, replication, recovery } = metrics;
  return (
    <section className="grid metrics-grid">
      <Card icon={Gauge} label="Avg throughput" value={`${workload.avgTps} TPS`} hint={`Peak planning: ${workload.peakTpsAt5x}–${workload.peakTpsAt10x} TPS (5–10×)`} />
      <Card icon={Wallet} label="Avg ticket size" value={`₹${workload.avgTicketInr.toLocaleString("en-IN")}`} hint="₹500 crore ÷ 3.2M tx/day" />
      <Card icon={Percent} label="Payment success rate" value={`${transactions.successRate}%`} hint="Simulated sample" tone={transactions.successRate >= 95 ? "good" : "warn"} />
      <Card icon={Database} label="Worst replication lag" value={`${replication.worstLagSeconds}s`} hint={`RPO target ${targets.rpoSeconds}s`} tone={replication.rpoMet ? "good" : "bad"} />
      <Card icon={Timer} label="Last measured RTO" value={fmtSec(recovery.lastMeasuredRtoSeconds)} hint={`Target ${fmtSec(targets.rtoSeconds)}`} tone={recovery.rtoMet === false ? "bad" : recovery.rtoMet ? "good" : ""} />
      <Card icon={Clock} label="Allowed downtime" value={`${workload.allowedDowntimeMinutesPerYear} min/yr`} hint={`${targets.availability}% availability SLO`} />
    </section>
  );
}
