import mongoose from "mongoose";

export const FAILOVER_STATUSES = ["pending_approval", "approved", "running", "completed", "aborted", "rejected"];

const stepSchema = new mongoose.Schema(
  {
    key: String,
    label: String,
    status: { type: String, enum: ["pending", "running", "passed", "failed", "skipped"], default: "pending" },
    startedAt: Date,
    finishedAt: Date,
    detail: String
  },
  { _id: false }
);

const failoverRunSchema = new mongoose.Schema(
  {
    scenario: { type: String, enum: ["region-failure", "aurora-failure", "peak-load", "network-isolation", "drill"], required: true },
    mode: { type: String, enum: ["simulation"], default: "simulation" },
    direction: { type: String, enum: ["failover", "failback"], default: "failover" },
    fromRegion: { type: String, required: true },
    toRegion: { type: String, required: true },
    reason: { type: String, required: true, maxlength: 500 },
    status: { type: String, enum: FAILOVER_STATUSES, default: "pending_approval", index: true },
    requestedBy: { type: String, required: true },
    approvedBy: { type: String, default: "" },
    approvedAt: Date,
    startedAt: Date,
    completedAt: Date,
    measuredRtoSeconds: Number,
    measuredRpoSeconds: Number,
    preflight: { type: mongoose.Schema.Types.Mixed, default: {} },
    steps: [stepSchema],
    abortReason: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("FailoverRun", failoverRunSchema);
