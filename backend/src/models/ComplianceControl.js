import mongoose from "mongoose";

const controlSchema = new mongoose.Schema(
  {
    controlId: { type: String, required: true, unique: true },
    framework: { type: String, enum: ["RBI-PA", "RBI-Localisation", "PCI-DSS-4.0.1", "NPCI-UPI"], required: true, index: true },
    requirement: { type: String, required: true },
    designDecision: { type: String, required: true },
    implementationControl: { type: String, required: true },
    owner: { type: String, required: true },
    status: { type: String, enum: ["not-started", "in-progress", "implemented", "evidence-ready"], default: "in-progress" },
    evidence: [{ title: String, ref: String, collectedAt: Date }],
    note: { type: String, default: "Mapping only. Not a claim of certification." }
  },
  { timestamps: true }
);

export default mongoose.model("ComplianceControl", controlSchema);
