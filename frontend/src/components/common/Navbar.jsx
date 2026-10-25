import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import StatusBadge from "./StatusBadge.jsx";

export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Toggle menu">
        <Menu size={20} />
      </button>
      <h1 className="navbar-title">DR Command Center</h1>
      <div className="navbar-right">
        <StatusBadge value="medium">SIMULATION MODE</StatusBadge>
        <div className="user-chip">
          <span>{user.name}</span>
          <small>{user.role}</small>
        </div>
        <button className="icon-btn" onClick={handleLogout} aria-label="Log out" title="Log out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
