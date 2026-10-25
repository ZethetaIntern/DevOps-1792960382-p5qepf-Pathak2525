import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function TransactionChart({ hourly, counts }) {
  const data = hourly.map((h) => ({ hour: h.hour, ok: h.total - h.failed, failed: h.failed }));
  return (
    <div className="card">
      <header className="card-head">
        <h3>Transactions by hour</h3>
        <small className="muted">
          {Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(" · ")}
        </small>
      </header>
      <div className="chart">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="ok" stackId="a" fill="#22c55e" name="Successful / other" />
            <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed + uncertain" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
