import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../services/api";

const DEMO = [
  ["admin@paysecure.local", "Admin"], ["sre@paysecure.local", "SRE"], ["dba@paysecure.local", "DBA"],
  ["risk@paysecure.local", "Risk"], ["security@paysecure.local", "Security"], ["cto@paysecure.local", "CTO"]
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@paysecure.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={submit}>
        <div className="login-logo"><ShieldCheck size={36} /></div>
        <h2>PaySecure DR Command Center</h2>
        <p className="muted">Sign in to the disaster-recovery control plane</p>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
        {error && <p className="alert alert-bad" role="alert">{error}</p>}
        <button className="btn btn-block" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        <details className="demo-users">
          <summary>Demo accounts (seeded)</summary>
          <p className="muted">Password: <code>PaySecure@123</code></p>
          <div className="chips">{DEMO.map(([e, l]) => <button type="button" key={e} className="chip" onClick={() => setEmail(e)}>{l}</button>)}</div>
        </details>
      </form>
    </div>
  );
}
