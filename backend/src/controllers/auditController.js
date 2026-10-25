import AuditLog from "../models/AuditLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyStoredChain } from "../services/auditService.js";

export const listAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const filter = req.query.action ? { action: new RegExp(`^${String(req.query.action).replace(/[^a-zA-Z0-9._-]/g, "")}`) } : {};
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ seq: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter)
  ]);
  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const verifyAuditChain = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await verifyStoredChain() });
});
