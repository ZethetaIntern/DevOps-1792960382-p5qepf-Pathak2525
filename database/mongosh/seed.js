// Usage:  mongosh "mongodb://127.0.0.1:27017/paysecure_dr" --file database/mongosh/seed.js
// Minimal manual seed for regions + service health (SIMULATION DATA). Full seed: `npm run seed` in backend/.
use("paysecure_dr");

["regions", "servicehealths", "transactions", "runbooks", "drills", "auditlogs"].forEach((name) => {
  if (!db.getCollectionNames().includes(name)) db.createCollection(name);
});

db.regions.deleteMany({});
db.regions.insertMany([
  { name: "Mumbai", regionCode: "ap-south-1", role: "primary", status: "healthy", writerEnabled: true, trafficWeight: 100, simulation: true, createdAt: new Date(), updatedAt: new Date() },
  { name: "Hyderabad", regionCode: "ap-south-2", role: "standby", status: "healthy", writerEnabled: false, trafficWeight: 0, simulation: true, createdAt: new Date(), updatedAt: new Date() }
]);

db.transactions.createIndex({ idempotencyKey: 1 }, { unique: true });
db.transactions.createIndex({ createdAt: -1 });
db.auditlogs.createIndex({ seq: 1 }, { unique: true });

print("Seeded regions (simulation data, not evidence of real AWS health).");
printjson(db.regions.find({}, { _id: 0, name: 1, role: 1, status: 1 }).toArray());
