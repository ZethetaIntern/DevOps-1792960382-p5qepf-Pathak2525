import mongoose from "mongoose";

const serviceHealthSchema = new mongoose.Schema(
  {
    service: { type: String, enum: ["aurora", "dynamodb", "redis", "kafka", "api", "mongodb"], required: true },
    regionCode: { type: String, required: true },
    status: { type: String, enum: ["healthy", "degraded", "down"], default: "healthy" },
    replicationLagSeconds: { type: Number, default: 0, min: 0 },
    latencyMs: { type: Number, default: 0, min: 0 },
    errorRatePercent: { type: Number, default: 0, min: 0 },
    detail: { type: String, default: "" },
    simulation: { type: Boolean, default: true },
    checkedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

serviceHealthSchema.index({ service: 1, regionCode: 1 }, { unique: true });

export default mongoose.model("ServiceHealth", serviceHealthSchema);
