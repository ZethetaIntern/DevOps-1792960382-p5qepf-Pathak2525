// Usage:  mongosh "mongodb://127.0.0.1:27017/paysecure_dr" --file database/mongosh/verify.js
use("paysecure_dr");

const primaries = db.regions.countDocuments({ role: "primary", writerEnabled: true });
print(`Writers enabled: ${primaries} ${primaries === 1 ? "OK (single writer)" : "ALERT: split-brain risk or no writer"}`);

const dupKeys = db.transactions.aggregate([
  { $group: { _id: "$idempotencyKey", n: { $sum: 1 } } },
  { $match: { n: { $gt: 1 } } }
]).toArray();
print(`Duplicate idempotency keys: ${dupKeys.length}`);

print("Transactions by status:");
printjson(db.transactions.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).toArray());

print("Runbooks stored: " + db.runbooks.countDocuments());
print("Audit log entries: " + db.auditlogs.countDocuments());

const chain = db.auditlogs.find().sort({ seq: 1 }).toArray();
let broken = null;
for (let i = 1; i < chain.length; i++) if (chain[i].prevHash !== chain[i - 1].hash) { broken = chain[i].seq; break; }
print(broken ? `Audit chain BROKEN at seq ${broken}` : "Audit chain linkage OK (full hash recompute: GET /api/audit-logs/verify)");
