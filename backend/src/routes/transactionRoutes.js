import { Router } from "express";
import { listTransactions, createSimulatedPayment, reconcileUncertain } from "../controllers/transactionController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = Router();
router.use(authenticate);
router.get("/", listTransactions);
router.post("/simulate", authorize("admin", "sre", "dba"), validateRequest({
  merchantId: { type: "string", required: true, maxLength: 40 },
  amountInr: { type: "number", required: true, min: 1, max: 10_000_000 },
  method: { type: "string", required: true, enum: ["UPI", "CARD", "NETBANKING", "WALLET"] },
  idempotencyKey: { type: "string", maxLength: 80 }
}), createSimulatedPayment);
router.post("/reconcile", authorize("admin", "sre", "dba"), reconcileUncertain);
export default router;
