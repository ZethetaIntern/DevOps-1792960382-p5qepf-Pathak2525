import { HttpError } from "../utils/asyncHandler.js";

export const PERMISSIONS = {
  "failover:request": ["admin", "sre"],
  "failover:approve": ["admin", "cto", "dba", "risk"],
  "failover:execute": ["admin", "sre"],
  "failover:reset": ["admin"],
  "drill:write": ["admin", "sre", "dba"],
  "audit:read": ["admin", "security", "risk", "cto"],
  "compliance:write": ["admin", "security"]
};

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "Insufficient permissions"));
    next();
  };
}

export const can = (permission) => authorize(...(PERMISSIONS[permission] || []));
