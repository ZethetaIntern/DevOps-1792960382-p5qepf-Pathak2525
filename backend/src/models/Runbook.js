import mongoose from "mongoose";

const runbookSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true, min: 1, max: 99 },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    severity: { type: String, enum: ["critical", "high", "medium"], required: true },
    owner: { type: String, required: true },
    summary: { type: String, required: true },
    steps: [{ type: String }],
    successCriteria: [{ type: String }],
    abortCondition: { type: String, default: "" },
    lastTestedAt: { type: Date, default: null },
    content: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Runbook", runbookSchema);
