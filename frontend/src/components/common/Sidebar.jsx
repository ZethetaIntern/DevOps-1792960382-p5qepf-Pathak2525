import { NavLink } from "react-router-dom";
import { Activity, BookOpenCheck, FileLock2, Globe2, LayoutDashboard, Server, ShieldCheck, Wallet } from "lucide-react";

const LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/regions", label: "Regions & Failover", icon: Globe2 },
  { to: "/services", label: "Services", icon: Server },
  { to: "/transactions", label: "Transactions", icon: Wallet },
  { to: "/runbooks", label: "Runbooks", icon: BookOpenCheck },
  { to: "/drills", label: "DR Drills", icon: Activity },
  { to: "/audit", label: "Audit Logs", icon: FileLock2 },
  { to: "/compliance", label: "Compliance", icon: ShieldCheck }
];

export default function Sidebar({ open, onNavigate }) {
  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand">
        <ShieldCheck size={26} />
        <div>
          <strong>PaySecure DR</strong>
          <small>Mumbai ⇄ Hyderabad</small>
        </div>
      </div>
      <nav>
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <p className="sidebar-note">Simulation environment. Not evidence of real AWS health.</p>
    </aside>
  );
}
