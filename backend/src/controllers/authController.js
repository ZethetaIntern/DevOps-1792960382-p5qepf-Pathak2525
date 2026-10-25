import User from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { recordAudit } from "../services/auditService.js";
import { asyncHandler, HttpError } from "../utils/asyncHandler.js";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+passwordHash");
  if (!user || !user.active) throw new HttpError(401, "Invalid credentials");
  if (user.isLocked()) throw new HttpError(423, "Account temporarily locked. Try again later.");

  const ok = await user.verifyPassword(password);
  if (!ok) {
    user.failedLogins += 1;
    if (user.failedLogins >= MAX_FAILED) {
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
      user.failedLogins = 0;
    }
    await user.save();
    await recordAudit({ user, action: "auth.login.failed", resource: "user", resourceId: user._id, ip: req.ip });
    throw new HttpError(401, "Invalid credentials");
  }

  user.failedLogins = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();
  await recordAudit({ user, action: "auth.login", resource: "user", resourceId: user._id, ip: req.ip });
  res.json({ success: true, token: signToken(user), user: user.toSafeJSON() });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});
