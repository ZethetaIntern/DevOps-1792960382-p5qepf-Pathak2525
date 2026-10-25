import { useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Sidebar from "./components/common/Sidebar.jsx";
import Navbar from "./components/common/Navbar.jsx";
import LoadingSpinner from "./components/common/LoadingSpinner.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Regions from "./pages/Regions.jsx";
import Services from "./pages/Services.jsx";
import Transactions from "./pages/Transactions.jsx";
import Runbooks from "./pages/Runbooks.jsx";
import DrDrills from "./pages/DrDrills.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import Compliance from "./pages/Compliance.jsx";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  if (loading) return <LoadingSpinner label="Checking session..." />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <div className="app-main">
        <Navbar onMenu={() => setMenuOpen((v) => !v)} />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/regions" element={<Regions />} />
        <Route path="/services" element={<Services />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/runbooks" element={<Runbooks />} />
        <Route path="/drills" element={<DrDrills />} />
        <Route path="/audit" element={<AuditLogs />} />
        <Route path="/compliance" element={<Compliance />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
