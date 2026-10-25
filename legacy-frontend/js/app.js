// Plain JavaScript demo client. Run the backend first (http://localhost:5000).
const API = window.PAYSECURE_API || "http://localhost:5000/api";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let token = sessionStorage.getItem("ps_token");

async function request(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `HTTP ${res.status}`);
  return body;
}

function card(label, value) {
  return `<div class="bg-white rounded-xl p-4 shadow"><p class="text-xs text-slate-500">${esc(label)}</p><p class="text-2xl font-bold">${esc(value)}</p></div>`;
}

async function loadDashboard() {
  const [{ data: m }, { data: regions }, { data: runbooks }] = await Promise.all([
    request("/dashboard/metrics"), request("/regions"), request("/runbooks")
  ]);
  $("cards").innerHTML = [
    card("Avg throughput", `${m.workload.avgTps} TPS`),
    card("Success rate", `${m.transactions.successRate}%`),
    card("Worst replication lag", `${m.replication.worstLagSeconds}s`),
    card("Last RTO", m.recovery.lastMeasuredRtoSeconds == null ? "—" : `${m.recovery.lastMeasuredRtoSeconds}s`)
  ].join("");
  $("regions").innerHTML = regions.map((r) => `
    <div class="bg-white rounded-xl p-4 shadow">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-semibold">${esc(r.name)} <span class="text-slate-400 text-xs">${esc(r.regionCode)}</span></h3>
        <span><span class="badge ${esc(r.role)}">${esc(r.role)}</span> <span class="badge ${esc(r.status)}">${esc(r.status)}</span></span>
      </div>
      <p class="text-sm text-slate-600">Writer: ${r.writerEnabled ? "enabled" : "disabled"} · Traffic: ${r.trafficWeight}%</p>
    </div>`).join("");
  $("runbooks").innerHTML = runbooks.map((r) => `<li class="py-2 flex justify-between"><span>#${r.number} ${esc(r.title)}</span><span class="text-slate-500">${esc(r.severity)}</span></li>`).join("");
}

function showApp(user) {
  $("login").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("logout").classList.remove("hidden");
  $("whoami").textContent = `${user.name} (${user.role})`;
  loadDashboard().catch((e) => alert(e.message));
}

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("login-error").textContent = "";
  try {
    const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ email: $("email").value, password: $("password").value }) });
    token = data.token;
    sessionStorage.setItem("ps_token", token);
    showApp(data.user);
  } catch (err) { $("login-error").textContent = err.message; }
});

$("logout").addEventListener("click", () => { sessionStorage.removeItem("ps_token"); location.reload(); });

if (token) request("/auth/me").then((d) => showApp(d.user)).catch(() => sessionStorage.removeItem("ps_token"));
