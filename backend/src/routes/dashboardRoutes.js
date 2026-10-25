import { Router } from "express";
import { metrics, replicationLag, refreshHealth } from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();
router.use(authenticate);
router.get("/metrics", metrics);
router.get("/replication-lag", replicationLag);
router.post("/refresh", authorize("admin", "sre"), refreshHealth);
export default router;
