import { ArrowRightLeft, MapPin } from "lucide-react";
import StatusBadge from "../common/StatusBadge.jsx";

export default function RegionHealth({ regions }) {
  return (
    <section className="grid two">
      {regions.map((r) => (
        <article key={r.regionCode} className={`card region region-${r.role}`}>
          <header className="card-head">
            <h3><MapPin size={16} /> {r.name} <small>({r.regionCode})</small></h3>
            <div className="row">
              <StatusBadge value={r.role} />
              <StatusBadge value={r.status} />
            </div>
          </header>
          <dl className="kv">
            <div><dt>Writer</dt><dd>{r.writerEnabled ? "Enabled" : "Fenced / disabled"}</dd></div>
            <div><dt>Traffic weight</dt><dd>{r.trafficWeight}%</dd></div>
            <div><dt>Capacity</dt><dd>{r.capacityPercent}% of peak</dd></div>
            <div><dt>AZs</dt><dd>{r.activeAzs}/{r.totalAzs} active</dd></div>
          </dl>
          <ul className="service-list">
            {(r.services || []).map((s) => (
              <li key={s._id}>
                <span>{s.service}</span>
                <span className="muted">{s.latencyMs}ms · lag {s.replicationLagSeconds}s</span>
                <StatusBadge value={s.status} />
              </li>
            ))}
          </ul>
        </article>
      ))}
      <p className="hint"><ArrowRightLeft size={14} /> Only one region may be the writer at any time.</p>
    </section>
  );
}
