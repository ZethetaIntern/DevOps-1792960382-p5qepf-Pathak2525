import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import User from "../models/User.js";
import Region from "../models/Region.js";
import ServiceHealth from "../models/ServiceHealth.js";
import Transaction from "../models/Transaction.js";
import Runbook from "../models/Runbook.js";
import Drill from "../models/Drill.js";
import AuditLog from "../models/AuditLog.js";
import FailoverRun from "../models/FailoverRun.js";
import ComplianceControl from "../models/ComplianceControl.js";
import { RUNBOOKS } from "./runbookData.js";
import { CONTROLS } from "./complianceData.js";
import { RUNBOOK_DIR, fileNameFor, writeAll } from "./generateRunbooks.js";
import { recordAudit } from "../services/auditService.js";

const DEMO_PASSWORD = process.env.SEED_PASSWORD || "PaySecure@123";

const USERS = [
  { name: "Admin", email: "admin@paysecure.local", role: "admin" },
  { name: "CTO", email: "cto@paysecure.local", role: "cto" },
  { name: "SRE Lead", email: "sre@paysecure.local", role: "sre" },
  { name: "Database Architect", email: "dba@paysecure.local", role: "dba" },
  { name: "Security Officer", email: "security@paysecure.local", role: "security" },
  { name: "Risk Head", email: "risk@paysecure.local", role: "risk" },
  { name: "Viewer", email: "viewer@paysecure.local", role: "viewer" }
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedUsers() {
  await User.deleteMany({});
  for (const u of USERS) {
    const user = new User(u);
    await user.setPassword(DEMO_PASSWORD);
    await user.save();
  }
}

async function seedRegions() {
  await Region.deleteMany({});
  await ServiceHealth.deleteMany({});
  await Region.insertMany([
    { name: "Mumbai", regionCode: "ap-south-1", role: "primary", status: "healthy", writerEnabled: true, trafficWeight: 100, capacityPercent: 100 },
    { name: "Hyderabad", regionCode: "ap-south-2", role: "standby", status: "healthy", writerEnabled: false, trafficWeight: 0, capacityPercent: 60 }
  ]);
  const base = [
    ["aurora", "Aurora PostgreSQL global cluster"], ["dynamodb", "DynamoDB global table"],
    ["redis", "ElastiCache Redis (region-local)"], ["kafka", "Kafka / MirrorMaker 2"], ["api", "Payment API fleet"]
  ];
  const docs = [];
  for (const regionCode of ["ap-south-1", "ap-south-2"]) {
    for (const [service, detail] of base) {
      docs.push({ service, regionCode, detail: "", status: "healthy", latencyMs: 10 + Math.round(Math.random() * 30), errorRatePercent: 0.01,
        replicationLagSeconds: service === "redis" || regionCode === "ap-south-1" ? 0 : +(2 + Math.random() * 4).toFixed(2) });
    }
  }
  await ServiceHealth.insertMany(docs);
}

async function seedTransactions(count = 600) {
  await Transaction.deleteMany({});
  const methods = ["UPI", "CARD", "NETBANKING", "WALLET"];
  const docs = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    const status = roll < 0.955 ? "success" : roll < 0.985 ? "failed" : roll < 0.995 ? "uncertain" : "duplicate";
    docs.push({
      idempotencyKey: crypto.randomUUID(),
      merchantId: `M${String(1 + Math.floor(Math.random() * 45000)).padStart(5, "0")}`,
      amountInr: Math.round(50 + Math.random() * 30000),
      method: pick(methods), status, regionCode: "ap-south-1", reconciled: status === "success",
      createdAt: new Date(Date.now() - Math.random() * 24 * 3600 * 1000)
    });
  }
  await Transaction.insertMany(docs);
}

async function seedRunbooks() {
  if (!fs.existsSync(path.join(RUNBOOK_DIR, fileNameFor(RUNBOOKS[0])))) writeAll();
  await Runbook.deleteMany({});
  await Runbook.insertMany(RUNBOOKS.map((rb) => ({
    number: rb.number, slug: rb.slug, title: rb.title, severity: rb.severity, owner: rb.owner, summary: rb.summary,
    steps: rb.steps, successCriteria: rb.successCriteria, abortCondition: rb.abortCondition,
    content: fs.readFileSync(path.join(RUNBOOK_DIR, fileNameFor(rb)), "utf8")
  })));
}

async function seedDrills() {
  await Drill.deleteMany({});
  const now = Date.now();
  const rows = [[1, "Quarterly region-failure simulation", 252, 18, "pass"], [2, "Aurora promotion drill", 205, 12, "pass"], [7, "Peak-load failover (5x)", 318, 41, "partial"], [4, "Kafka partition tabletop", 160, 9, "pass"]];
  await Drill.insertMany(rows.map(([n, title, rto, rpo, outcome], i) => {
    const started = new Date(now - (i + 1) * 14 * 24 * 3600 * 1000);
    return { runbookNumber: n, title, type: i === 3 ? "tabletop" : "simulation", startedAt: started, restoredAt: new Date(started.getTime() + rto * 1000),
      measuredRtoSeconds: rto, measuredRpoSeconds: rpo, outcome, approver: "Risk Head",
      transactions: { successful: 18000 - i * 100, failed: 40 + i * 5, duplicated: 0, uncertain: 12 + i },
      notes: "Simulation data - replace with measured results from real drills." };
  }));
}

async function seedCompliance() {
  await ComplianceControl.deleteMany({});
  await ComplianceControl.insertMany(CONTROLS.map((c) => ({ ...c, evidence: c.status === "evidence-ready" ? [{ title: "Audit chain verification output", ref: "GET /api/audit-logs/verify", collectedAt: new Date() }] : [] })));
}

async function main() {
  await connectDatabase();
  await AuditLog.collection.deleteMany({}); // raw collection: seed-only reset of the append-only log
  await FailoverRun.deleteMany({});
  await seedUsers();
  await seedRegions();
  await seedTransactions();
  await seedRunbooks();
  await seedDrills();
  await seedCompliance();
  await recordAudit({ action: "seed.completed", resource: "system", metadata: { users: USERS.length, runbooks: RUNBOOKS.length } });
  console.log("Seed complete (SIMULATION DATA).");
  console.log(`Demo password for all users: ${DEMO_PASSWORD}`);
  USERS.forEach((u) => console.log(` - ${u.email} (${u.role})`));
  await disconnectDatabase();
}

main().catch(async (e) => { console.error("Seed failed:", e.message); await disconnectDatabase().catch(() => {}); process.exit(1); });
