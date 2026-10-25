import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ReplicationLag({ series, rpoTarget }) {
  const data = series.map((p) => ({ ...p, time: new Date(p.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }));
  return (
    <div className="card">
      <header className="card-head"><h3>Replication lag (seconds)</h3><small className="muted">Simulated series</small></header>
      <div className="chart">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={24} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, Math.max(rpoTarget, 10)]} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={rpoTarget} stroke="#ef4444" strokeDasharray="6 4" label={{ value: "RPO target", fontSize: 11, fill: "#ef4444" }} />
            <Line type="monotone" dataKey="aurora" stroke="#2563eb" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="dynamodb" stroke="#16a34a" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="kafka" stroke="#d97706" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
