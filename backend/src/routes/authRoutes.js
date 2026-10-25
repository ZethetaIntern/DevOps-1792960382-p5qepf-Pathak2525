import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, me } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

router.post("/login", loginLimiter, validateRequest({ email: { type: "string", required: true, maxLength: 120 }, password: { type: "string", required: true, maxLength: 200 } }), login);
router.get("/me", authenticate, me);

export default router;
