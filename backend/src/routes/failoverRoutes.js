import { Router } from "express";
import * as ctrl from "../controllers/failoverController.js";
import { authenticate } from "../middleware/auth.js";
import { can } from "../middleware/authorize.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = Router();
router.use(authenticate);
router.get("/", ctrl.listRuns);
router.get("/:id", ctrl.getRun);
router.post("/simulate", can("failover:request"), validateRequest({
  scenario: { type: "string", required: true, enum: ["region-failure", "aurora-failure", "peak-load", "network-isolation", "drill"] },
  reason: { type: "string", required: true, maxLength: 500 },
  direction: { type: "string", enum: ["failover", "failback"] }
}), ctrl.requestSimulation);
router.post("/reset", can("failover:reset"), ctrl.resetLab);
router.post("/:id/approve", can("failover:approve"), ctrl.approve);
router.post("/:id/reject", can("failover:approve"), ctrl.reject);
router.post("/:id/execute", can("failover:execute"), ctrl.execute);
router.post("/:id/abort", can("failover:execute"), ctrl.abort);
export default router;
