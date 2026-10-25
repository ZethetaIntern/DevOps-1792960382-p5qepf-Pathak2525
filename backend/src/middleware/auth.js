import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import User from "../models/User.js";
import { HttpError } from "../utils/asyncHandler.js";

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) throw new HttpError(401, "Authentication required");
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new HttpError(401, "Invalid or expired token");
    }
    const user = await User.findById(payload.sub);
    if (!user || !user.active) throw new HttpError(401, "User not found or disabled");
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
