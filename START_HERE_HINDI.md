# PaySecure-DR — Setup Guide (Hindi / Windows + Server)

## Pehle samjhein
Yeh full-stack **DR simulation project** hai: React/Vite frontend, Node.js/Express backend, MongoDB/Mongoose data store, `mongosh` scripts, 12 runbooks, tests, Docker aur reference Terraform. Dashboard ke health/replication numbers simulated hain. Real AWS failover enable nahi hai aur production payment traffic par is project ko use na karein.

## A. Windows / VS Code par local setup

### 1. Required software
1. Node.js 20 LTS install karein.
2. MongoDB Community Server install/start karein.
3. MongoDB Shell (`mongosh`) install karein. Server aur shell alag packages ho sakte hain.
4. Git + VS Code install karein.
5. Optional: Docker Desktop install karein agar Docker se sab services run karni hain.

PowerShell mein versions check:
```powershell
node --version
npm --version
mongosh --version
git --version
```

### 2. ZIP extract karein
ZIP extract karke VS Code mein `PaySecure-DR` root folder open karein. Commands root folder ke relative hain.

### 3. MongoDB start aur test karein
Windows Services app mein MongoDB Server service ko Start karein, agar installer ne service install ki thi. Phir:
```powershell
mongosh "mongodb://127.0.0.1:27017/paysecure_dr"
```
Shell ke andar:
```javascript
db.runCommand({ ping: 1 })
exit
```
Ping response mein `ok: 1` aana chahiye. Agar connection refused aaye to MongoDB Server service start karein; sirf `mongosh` install karna enough nahi hai.

### 4. Backend packages aur environment
Naya PowerShell terminal:
```powershell
cd backend
npm install
Copy-Item .env.example .env
```
`backend/.env` kholein aur `JWT_SECRET` ko apne random secret se replace karein. Local default Mongo URI:
```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/paysecure_dr
```
Local demo ke liye yeh theek hai jab MongoDB authentication configure nahi kiya gaya ho. Production mein authenticated/private database URI use karein.

### 5. Database seed karein
`backend` folder ke andar hi:
```powershell
npm run seed
```
Yeh demo users, regions, service-health rows, simulated transactions, runbooks, drills aur compliance controls create karta hai. Seed command demo collections ko reset/repopulate karta hai; ise baar-baar chalane par local demo data reset hoga.

Default demo password sab demo users ke liye `PaySecure@123` hai. Sirf local demo ke liye use karein. Apna password seed karne ke liye `backend/.env` mein seed chalane se pehle `SEED_PASSWORD=YourLongUniquePassword` add karein. Demo accounts public repo mein rakhne ke liye nahi hain.

### 6. Backend run karein
```powershell
npm run dev
```
Expected API:
- `http://localhost:5000/api/health`

Backend ko chalne dein. Stop karne ke liye `Ctrl+C`.

### 7. Frontend packages aur run
Doosra PowerShell terminal kholein:
```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```
Browser mein Vite jo URL dikhaye (usually `http://localhost:5173`) open karein. Login:
- `admin@paysecure.local`
- password: `PaySecure@123` (agar default seed password use hua hai)

Role demo accounts: `sre@paysecure.local`, `dba@paysecure.local`, `risk@paysecure.local`, `security@paysecure.local`, `cto@paysecure.local`, `viewer@paysecure.local`. Inka password seed ke waqt set kiya gaya `SEED_PASSWORD` hai.

### 8. mongosh verification
Ek aur terminal mein project root par:
```powershell
mongosh "mongodb://127.0.0.1:27017/paysecure_dr" --file database/mongosh/verify.js
```
Ya interactive shell:
```powershell
mongosh "mongodb://127.0.0.1:27017/paysecure_dr"
```
Then:
```javascript
show collections
db.regions.find().pretty()
db.servicehealths.find().pretty()
db.transactions.countDocuments()
db.runbooks.countDocuments()
db.auditlogs.countDocuments()
exit
```
Mongoose model `ServiceHealth` collection ka default naam `servicehealths` hota hai. Full seed ke liye `npm run seed` use karein; `database/mongosh/seed.js` sirf minimal regions seed hai.

### 9. Tests aur production build
```powershell
cd backend
npm test
cd ..\frontend
npm run build
```
Tests/build se pehle har folder mein `npm install` run hona chahiye. Test results ko actual production DR proof na samjhein; live AWS replication/failover test is repository se automatically nahi hota.

## B. Easiest option — Docker Compose

Prerequisite: Docker Desktop installed and running. Project root (`PaySecure-DR`) mein:
```powershell
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```
Open:
- Frontend: `http://localhost:8080`
- API: `http://localhost:5000/api/health`

Demo data seed karne ke liye separate terminal:
```powershell
docker compose exec backend node src/seed/seed.js
```
Logs follow karna band: `Ctrl+C` (containers chalte rahenge). Stop:
```powershell
docker compose down
```
MongoDB data volume retain rahega. **Data delete karke clean start** karna ho tabhi:
```powershell
docker compose down -v
```
Warning: `-v` MongoDB Docker volume ka data delete karta hai.

## C. Ubuntu server par deploy (basic demo only)

Real internet-facing payment production ke liye is guide ko seedha production recipe na samjhein. Pehle private staging VM par test karein.

1. Ubuntu LTS server banayein. Firewall/security group mein sirf SSH aur HTTPS expose karein; MongoDB port `27017` ko public internet par expose na karein.
2. Node.js 20 LTS, Git, Nginx aur MongoDB (same server par sirf small demo ke liye, preferably private managed DB for staging) install karein.
3. Repository/ZIP ko server par copy karke `PaySecure-DR` root open karein.
4. Backend:
```bash
cd PaySecure-DR/backend
npm install
cp .env.example .env
nano .env
```
Set a unique `JWT_SECRET` (32+ random characters), `NODE_ENV=production`, correct `MONGODB_URI`, and `FRONTEND_URL=https://YOUR_DOMAIN`. Keep `ALLOW_REAL_FAILOVER=false`. Do not commit `.env`.
5. Seed once only, using a unique password. Add `SEED_PASSWORD` temporarily to the environment before running `npm run seed`; remove it afterward. Do not leave demo accounts/passwords on a public server.
6. Run backend with a process manager:
```bash
sudo npm install -g pm2
pm2 start src/server.js --name paysecure-dr-api
pm2 save
pm2 startup
```
Run the command printed by `pm2 startup` to enable restart after reboot. Check:
```bash
pm2 status
pm2 logs paysecure-dr-api
curl http://127.0.0.1:5000/api/health
```
7. Build frontend. In `frontend/.env`, set `VITE_API_URL=https://YOUR_DOMAIN/api` before building:
```bash
cd ../frontend
npm install
npm run build
```
Serve `frontend/dist` with Nginx and configure `/api` as a reverse proxy to `http://127.0.0.1:5000`. Add HTTPS with a valid certificate. Configure exact frontend CORS origin and ensure Nginx SPA fallback serves `index.html`.
8. Use a private/authenticated MongoDB deployment, encrypted backups, access control, monitoring, OS patching, TLS, secret rotation and tested restore procedures. Do not use demo credentials.

For a simple VM, Docker Compose may be easier than manually managing both apps. Do not expose Docker MongoDB port on a public host.

## D. AWS / Terraform
`infrastructure/terraform/README.md` padhein. Terraform apply karne se pehle AWS account, region support, quotas, IAM permissions, network access and cost estimate review karein. Terraform files are a reference implementation and have not been validated against your AWS account. Start with a disposable sandbox. The dashboard's simulated region statuses do not represent AWS telemetry.

## Troubleshooting
- `ECONNREFUSED 127.0.0.1:27017`: MongoDB Server is not running or URI/port is wrong.
- `mongosh is not recognized`: install MongoDB Shell and reopen terminal.
- `EADDRINUSE :5000`: another process is using port 5000; stop it or change `PORT`.
- Login fails: run `npm run seed` in `backend` and use the password set at seed time.
- CORS error: `FRONTEND_URL` must match the exact frontend origin. Compose can use a comma-separated allow-list.
- Frontend cannot call API: verify `VITE_API_URL`, backend port, and that the backend is running.
- Do not share `.env`, JWT secrets, database credentials or production logs publicly.
