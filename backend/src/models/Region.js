import mongoose from "mongoose";

const regionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    regionCode: { type: String, required: true, unique: true },
    role: { type: String, enum: ["primary", "standby", "fenced", "recovering"], required: true },
    status: { type: String, enum: ["healthy", "degraded", "down"], default: "healthy" },
    writerEnabled: { type: Boolean, default: false },
    trafficWeight: { type: Number, min: 0, max: 100, default: 0 },
    capacityPercent: { type: Number, min: 0, max: 200, default: 100 },
    activeAzs: { type: Number, default: 3 },
    totalAzs: { type: Number, default: 3 },
    simulation: { type: Boolean, default: true },
    lastHealthCheckAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("Region", regionSchema);
