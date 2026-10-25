import { Router } from "express";
import { listRegions, listServices, injectFault } from "../controllers/regionController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = Router();
router.use(authenticate);
router.get("/regions", listRegions);
router.get("/services", listServices);
router.post("/regions/fault", authorize("admin", "sre"), validateRequest({ regionCode: { type: "string", required: true }, status: { type: "string", required: true, enum: ["healthy", "degraded", "down"] } }), injectFault);
export default router;
