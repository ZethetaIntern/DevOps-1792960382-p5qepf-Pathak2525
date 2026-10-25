# PaySecure-DR — Multi-Region Disaster Recovery Control Center

**New:** Windows/VS Code, `mongosh`, Docker Compose, and Ubuntu server setup steps are in [`START_HERE_HINDI.md`](START_HERE_HINDI.md).

Mumbai (ap-south-1, primary) ⇄ Hyderabad (ap-south-2, warm standby) for a payment gateway doing
**3.2M tx/day · ₹500 crore/day · 45,000 merchants · 99.99% availability · RTO ≤ 5 min**.

Full-stack project: **React dashboard + Express API + MongoDB**, 12 DR runbooks, Terraform for AWS, compliance matrix, tests.

> ⚠️ Yeh ek **simulation** hai. Failover sirf local data me hota hai; backend real failover refuse karta hai
> (`ALLOW_REAL_FAILOVER=false`). Seed data real AWS health ka proof nahi hai.

## Features
- JWT login, 7 roles (RBAC), account lockout, rate limiting, helmet, CORS allow-list
- Dashboard: TPS, ticket size, success rate, replication lag chart, RTO/RPO tracking
- Guarded failover workflow: **request → second person approves → execute** (two-person rule), preflight safety gates (lag ≤ RPO, no split-brain, target healthy), abort, failback, lab reset
- Fault injection (healthy/degraded/down) for drills
- Idempotent simulated payments + reconciliation of uncertain transactions
- 12 runbooks (markdown + DB), drill recording with auto RTO calculation
- Hash-chained append-only audit log + chain verification endpoint
- Compliance matrix (RBI PA, RBI localisation, PCI DSS 4.0.1, NPCI UPI) with evidence tracking
- Terraform: networking, compute (ECS+ALB), Aurora Global DB, DynamoDB global table, Redis, Kafka (MSK), CloudWatch alarms, Route 53 failover
- Docker + docker-compose, GitHub Actions CI, mongosh seed/verify scripts, optional plain HTML/CSS/JS + Tailwind demo

## Step-by-step setup (Windows / VS Code)

### 1. Tools install karo
Node.js 20 LTS, MongoDB Community Server + mongosh, Git, VS Code, Postman.

### 2. Backend
```powershell
cd PaySecure-DR\backend
npm install
copy .env.example .env      # JWT_SECRET change karo
npm run seed                # users, regions, 600 txns, 12 runbooks, drills, compliance
npm run dev                 # http://localhost:5000/api/health
```
Seed ke baad demo users (password: `PaySecure@123`):

| Email | Role | Kya kar sakta hai |
|---|---|---|
| admin@paysecure.local | admin | sab kuch, lab reset |
| sre@paysecure.local | sre | failover request/execute, fault inject |
| dba@paysecure.local | dba | approve, drills |
| risk@paysecure.local | risk | approve, audit |
| security@paysecure.local | security | audit, compliance evidence |
| cto@paysecure.local | cto | approve, audit |
| viewer@paysecure.local | viewer | read-only |

### 3. Frontend
```powershell
cd PaySecure-DR\frontend
npm install
copy .env.example .env
npm run dev                 # http://localhost:5173
```

### 4. Failover demo (2 users chahiye)
1. `sre@paysecure.local` se login → **Regions & Failover** → scenario `region-failure` + reason → **Request**
2. Logout → `dba@paysecure.local` (ya risk/cto) se login → **Approve** (requester khud approve nahi kar sakta)
3. Wapas `sre` → **Execute** → Hyderabad primary, Mumbai fenced, RTO/RPO measured
4. `admin` → **Reset lab** se Mumbai primary wapas
5. Fault inject karke (Hyderabad `down`) failover request try karo → preflight block karega

### 5. mongosh
```powershell
mongosh "mongodb://127.0.0.1:27017/paysecure_dr" --file database/mongosh/verify.js
```
`seed.js` sirf minimal regions seed karta hai; full seed ke liye `npm run seed` use karo.

### 6. Tests
```powershell
cd backend
npm test
```
Failover gates, two-person rule, state machine, RBAC, JWT, audit-chain tamper detection, workload maths.

### 7. Docker (sab ek saath)
```powershell
docker compose up --build
# frontend http://localhost:8080 , API http://localhost:5000
docker compose exec backend node src/seed/seed.js
```

### 8. Server par deploy (outline)
1. VM (Ubuntu) par Node 20, MongoDB (ya Atlas/DocumentDB-compatible alternative), nginx install karo.
2. Backend: `NODE_ENV=production`, strong `JWT_SECRET` (>=32 chars), `FRONTEND_URL=https://your-domain`; `pm2 start src/server.js`.
3. Frontend: `VITE_API_URL=https://your-domain/api npm run build`; `dist/` nginx se serve karo, `/api` ko backend par proxy karo.
4. HTTPS (Let's Encrypt) lagao; MongoDB ko public internet par expose mat karo.
5. Default demo passwords seed ke baad turant badlo (`SEED_PASSWORD=... npm run seed`).

### 9. AWS / Terraform (optional, baad me)
`infrastructure/terraform/README.md` dekho. Sandbox account me hi chalao, cost check karo.

## API summary
| Method | Endpoint | Role |
|---|---|---|
| POST | /api/auth/login | public |
| GET | /api/health | public |
| GET | /api/dashboard/metrics, /replication-lag | any |
| GET | /api/regions, /api/services | any |
| POST | /api/regions/fault | admin, sre |
| GET/POST | /api/transactions, /simulate, /reconcile | any / admin,sre,dba |
| GET | /api/failover, /api/failover/:id | any |
| POST | /api/failover/simulate | admin, sre |
| POST | /api/failover/:id/approve, /reject | admin, cto, dba, risk |
| POST | /api/failover/:id/execute, /abort | admin, sre |
| POST | /api/failover/reset | admin |
| GET | /api/runbooks, /api/runbooks/:id | any |
| GET/POST | /api/drills | any / admin,sre,dba |
| GET/POST | /api/compliance, /:id/evidence | any / admin,security |
| GET | /api/audit-logs, /verify | admin, security, risk, cto |

## Repo layout
```
PaySecure-DR/
├── frontend/          React (Vite) dashboard
├── backend/           Express API, Mongoose models, seed, tests
├── legacy-frontend/   Plain HTML/CSS/JS + Tailwind demo
├── infrastructure/    terraform/, docker/, scripts/
├── runbooks/          12 DR runbooks
├── docs/              architecture, replication, threat model, compliance, test plan, board pack
├── database/mongosh/  mongosh seed + verify
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Limitations (honest)
- Simulation only; replication lag and health are generated, not measured from AWS.
- Terraform is a reference implementation, not applied or validated against a live account here.
- No MFA, WAF or Secrets Manager integration in the local stack.
- Compliance matrix is a mapping, not a certification claim.
- Real RTO/RPO must come from staged drills with measured evidence.
