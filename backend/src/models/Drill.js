import mongoose from "mongoose";

const drillSchema = new mongoose.Schema(
  {
    runbookNumber: { type: Number, required: true, min: 1, max: 99, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    type: { type: String, enum: ["tabletop", "simulation", "game-day"], default: "simulation" },
    startedAt: { type: Date, required: true },
    restoredAt: { type: Date, required: true },
    measuredRtoSeconds: { type: Number, required: true, min: 0 },
    measuredRpoSeconds: { type: Number, required: true, min: 0 },
    transactions: {
      successful: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      duplicated: { type: Number, default: 0 },
      uncertain: { type: Number, default: 0 }
    },
    outcome: { type: String, enum: ["pass", "partial", "fail"], required: true },
    approver: { type: String, default: "" },
    notes: { type: String, default: "", maxlength: 2000 },
    limitations: { type: String, default: "Local simulation; not production evidence." },
    conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("Drill", drillSchema);
