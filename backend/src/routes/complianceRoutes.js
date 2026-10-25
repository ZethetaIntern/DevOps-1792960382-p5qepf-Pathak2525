import { Router } from "express";
import { listControls, addEvidence } from "../controllers/complianceController.js";
import { listAuditLogs, verifyAuditChain } from "../controllers/auditController.js";
import { authenticate } from "../middleware/auth.js";
import { can } from "../middleware/authorize.js";
import { validateRequest } from "../middleware/validateRequest.js";

export const complianceRouter = Router();
complianceRouter.use(authenticate);
complianceRouter.get("/", listControls);
complianceRouter.post("/:controlId/evidence", can("compliance:write"), validateRequest({
  title: { type: "string", required: true, maxLength: 160 },
  ref: { type: "string", required: true, maxLength: 300 },
  status: { type: "string", enum: ["not-started", "in-progress", "implemented", "evidence-ready"] }
}), addEvidence);

export const auditRouter = Router();
auditRouter.use(authenticate, can("audit:read"));
auditRouter.get("/", listAuditLogs);
auditRouter.get("/verify", verifyAuditChain);
