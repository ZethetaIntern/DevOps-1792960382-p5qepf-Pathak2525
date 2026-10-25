import mongoose from "mongoose";

export const TX_STATUSES = ["success", "failed", "pending", "uncertain", "duplicate"];

const transactionSchema = new mongoose.Schema(
  {
    idempotencyKey: { type: String, required: true, unique: true },
    merchantId: { type: String, required: true, index: true },
    amountInr: { type: Number, required: true, min: 1 },
    method: { type: String, enum: ["UPI", "CARD", "NETBANKING", "WALLET"], required: true },
    status: { type: String, enum: TX_STATUSES, default: "pending", index: true },
    regionCode: { type: String, required: true, index: true },
    reconciled: { type: Boolean, default: false },
    simulation: { type: Boolean, default: true }
  },
  { timestamps: true }
);

transactionSchema.index({ createdAt: -1 });

export default mongoose.model("Transaction", transactionSchema);
