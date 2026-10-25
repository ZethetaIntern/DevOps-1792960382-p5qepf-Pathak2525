import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    seq: { type: Number, required: true, unique: true },
    actorId: { type: String, default: "system" },
    actorEmail: { type: String, default: "system" },
    actorRole: { type: String, default: "system" },
    action: { type: String, required: true, index: true },
    resource: { type: String, default: "" },
    resourceId: { type: String, default: "" },
    ip: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    prevHash: { type: String, required: true },
    hash: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Audit records are append-only: block updates and deletes at the ODM layer.
for (const hook of ["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete"]) {
  auditLogSchema.pre(hook, function () {
    throw new Error("Audit logs are append-only");
  });
}

export default mongoose.model("AuditLog", auditLogSchema);
