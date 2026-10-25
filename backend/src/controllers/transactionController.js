import crypto from "node:crypto";
import Transaction, { TX_STATUSES } from "../models/Transaction.js";
import { asyncHandler, HttpError } from "../utils/asyncHandler.js";

export const listTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const filter = {};
  if (req.query.status) {
    if (!TX_STATUSES.includes(req.query.status)) throw new HttpError(400, "Invalid status filter");
    filter.status = req.query.status;
  }
  if (req.query.region) filter.regionCode = String(req.query.region);
  if (req.query.merchantId) filter.merchantId = String(req.query.merchantId);

  const [items, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Transaction.countDocuments(filter)
  ]);
  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

/** Idempotent simulated payment: the same key never creates a second record. */
export const createSimulatedPayment = asyncHandler(async (req, res) => {
  const { merchantId, amountInr, method, idempotencyKey = crypto.randomUUID(), regionCode = "ap-south-1" } = req.body;
  const existing = await Transaction.findOne({ idempotencyKey });
  if (existing) return res.status(200).json({ success: true, data: existing, idempotentReplay: true });
  const tx = await Transaction.create({ idempotencyKey, merchantId, amountInr, method, regionCode, status: "success" });
  res.status(201).json({ success: true, data: tx, idempotentReplay: false });
});

export const reconcileUncertain = asyncHandler(async (_req, res) => {
  // Simulation: processor lookup resolves uncertain -> success/failed.
  const uncertain = await Transaction.find({ status: "uncertain" });
  let resolved = 0;
  for (const tx of uncertain) {
    tx.status = tx.amountInr % 2 === 0 ? "success" : "failed";
    tx.reconciled = true;
    await tx.save();
    resolved += 1;
  }
  res.json({ success: true, resolved });
});
