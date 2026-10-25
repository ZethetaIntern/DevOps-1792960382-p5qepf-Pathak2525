import ComplianceControl from "../models/ComplianceControl.js";
import { asyncHandler, HttpError } from "../utils/asyncHandler.js";
import { recordAudit } from "../services/auditService.js";

export function summarize(controls) {
  const byFramework = {};
  for (const c of controls) {
    byFramework[c.framework] ||= { total: 0, "evidence-ready": 0, implemented: 0, "in-progress": 0, "not-started": 0 };
    byFramework[c.framework].total += 1;
    byFramework[c.framework][c.status] += 1;
  }
  const done = controls.filter((c) => ["implemented", "evidence-ready"].includes(c.status)).length;
  return { total: controls.length, completionPercent: controls.length ? Math.round((done / controls.length) * 100) : 0, byFramework };
}

export const listControls = asyncHandler(async (req, res) => {
  const filter = req.query.framework ? { framework: String(req.query.framework) } : {};
  const controls = await ComplianceControl.find(filter).sort({ controlId: 1 }).lean();
  res.json({ success: true, data: controls, summary: summarize(controls), disclaimer: "Regulatory mapping only; this is not a certification claim. Obtain a qualified compliance review." });
});

export const addEvidence = asyncHandler(async (req, res) => {
  const control = await ComplianceControl.findOne({ controlId: req.params.controlId });
  if (!control) throw new HttpError(404, "Control not found");
  control.evidence.push({ title: req.body.title, ref: req.body.ref, collectedAt: new Date() });
  if (req.body.status) control.status = req.body.status;
  await control.save();
  await recordAudit({ user: req.user, action: "compliance.evidence.add", resource: "control", resourceId: control.controlId, ip: req.ip });
  res.status(201).json({ success: true, data: control });
});
