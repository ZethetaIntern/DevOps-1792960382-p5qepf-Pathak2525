import crypto from "node:crypto";
import AuditLog from "../models/AuditLog.js";

const GENESIS = "0".repeat(64);

export function computeHash(entry) {
  const payload = JSON.stringify({
    seq: entry.seq, actorId: entry.actorId, actorEmail: entry.actorEmail, action: entry.action,
    resource: entry.resource, resourceId: entry.resourceId, metadata: entry.metadata, prevHash: entry.prevHash
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/** Pure check used by tests and the verify endpoint. */
export function verifyChain(entries) {
  let prev = GENESIS;
  for (const entry of entries) {
    if (entry.prevHash !== prev) return { valid: false, brokenAtSeq: entry.seq, reason: "prevHash mismatch" };
    if (computeHash(entry) !== entry.hash) return { valid: false, brokenAtSeq: entry.seq, reason: "hash mismatch" };
    prev = entry.hash;
  }
  return { valid: true, checked: entries.length };
}

let writeQueue = Promise.resolve();

/** Hash-chained, append-only audit record. Serialised to keep the chain ordered. */
export function recordAudit({ user, action, resource = "", resourceId = "", ip = "", metadata = {} }) {
  writeQueue = writeQueue.then(async () => {
    try {
      const last = await AuditLog.findOne().sort({ seq: -1 }).lean();
      const entry = {
        seq: last ? last.seq + 1 : 1,
        actorId: user ? String(user._id) : "system",
        actorEmail: user?.email || "system",
        actorRole: user?.role || "system",
        action, resource, resourceId: String(resourceId || ""), ip, metadata,
        prevHash: last ? last.hash : GENESIS
      };
      entry.hash = computeHash(entry);
      await AuditLog.create(entry);
    } catch (error) {
      console.error("Audit write failed:", error.message);
    }
  });
  return writeQueue;
}

export async function verifyStoredChain() {
  const entries = await AuditLog.find().sort({ seq: 1 }).lean();
  return verifyChain(entries);
}
