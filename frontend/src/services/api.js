import axios from "axios";

const TOKEN_KEY = "paysecure_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 8000,
  headers: { "Content-Type": "application/json" }
});

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes("/auth/login")) {
      tokenStore.clear();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (error) =>
  error.response?.data?.details?.join?.(", ") || error.response?.data?.message || error.message || "Request failed";

export const AuthAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data)
};
export const DashboardAPI = {
  metrics: () => api.get("/dashboard/metrics").then((r) => r.data.data),
  lag: () => api.get("/dashboard/replication-lag").then((r) => r.data.data),
  refresh: () => api.post("/dashboard/refresh").then((r) => r.data)
};
export const RegionAPI = {
  list: () => api.get("/regions").then((r) => r.data.data),
  services: (params) => api.get("/services", { params }).then((r) => r.data.data),
  inject: (regionCode, status) => api.post("/regions/fault", { regionCode, status }).then((r) => r.data)
};
export const TransactionAPI = {
  list: (params) => api.get("/transactions", { params }).then((r) => r.data),
  simulate: (body) => api.post("/transactions/simulate", body).then((r) => r.data),
  reconcile: () => api.post("/transactions/reconcile").then((r) => r.data)
};
export const FailoverAPI = {
  list: () => api.get("/failover").then((r) => r.data.data),
  request: (body) => api.post("/failover/simulate", body).then((r) => r.data.data),
  approve: (id) => api.post(`/failover/${id}/approve`).then((r) => r.data.data),
  reject: (id, reason) => api.post(`/failover/${id}/reject`, { reason }).then((r) => r.data.data),
  execute: (id) => api.post(`/failover/${id}/execute`).then((r) => r.data.data),
  abort: (id, reason) => api.post(`/failover/${id}/abort`, { reason }).then((r) => r.data.data),
  reset: () => api.post("/failover/reset").then((r) => r.data)
};
export const RunbookAPI = {
  list: () => api.get("/runbooks").then((r) => r.data.data),
  get: (id) => api.get(`/runbooks/${id}`).then((r) => r.data.data)
};
export const DrillAPI = {
  list: () => api.get("/drills").then((r) => r.data.data),
  create: (body) => api.post("/drills", body).then((r) => r.data.data)
};
export const ComplianceAPI = {
  list: (framework) => api.get("/compliance", { params: framework ? { framework } : {} }).then((r) => r.data),
  addEvidence: (controlId, body) => api.post(`/compliance/${controlId}/evidence`, body).then((r) => r.data.data)
};
export const AuditAPI = {
  list: (params) => api.get("/audit-logs", { params }).then((r) => r.data),
  verify: () => api.get("/audit-logs/verify").then((r) => r.data.data)
};

export default api;
