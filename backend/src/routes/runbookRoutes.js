import { Router } from "express";
import { listRunbooks, getRunbook } from "../controllers/runbookController.js";
import { listDrills, createDrill } from "../controllers/drillController.js";
import { authenticate } from "../middleware/auth.js";
import { can } from "../middleware/authorize.js";
import { validateRequest } from "../middleware/validateRequest.js";

export const runbookRouter = Router();
runbookRouter.use(authenticate);
runbookRouter.get("/", listRunbooks);
runbookRouter.get("/:id", getRunbook);

export const drillRouter = Router();
drillRouter.use(authenticate);
drillRouter.get("/", listDrills);
drillRouter.post("/", can("drill:write"), validateRequest({
  runbookNumber: { type: "number", required: true, min: 1, max: 12 },
  title: { type: "string", required: true, maxLength: 160 },
  startedAt: { type: "date", required: true },
  restoredAt: { type: "date", required: true },
  measuredRpoSeconds: { type: "number", required: true, min: 0 },
  outcome: { type: "string", required: true, enum: ["pass", "partial", "fail"] },
  type: { type: "string", enum: ["tabletop", "simulation", "game-day"] },
  notes: { type: "string", maxLength: 2000 }
}), createDrill);
