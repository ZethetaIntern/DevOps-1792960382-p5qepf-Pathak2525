import { HttpError } from "../utils/asyncHandler.js";

/**
 * Tiny schema validator. rules: { field: { type, required, min, max, enum, maxLength, pattern } }
 */
export function validateValue(value, rule, field) {
  if (value === undefined || value === null || value === "") {
    return rule.required ? `${field} is required` : null;
  }
  if (rule.type === "string" && typeof value !== "string") return `${field} must be a string`;
  if (rule.type === "number" && (typeof value !== "number" || Number.isNaN(value))) return `${field} must be a number`;
  if (rule.type === "date" && Number.isNaN(Date.parse(value))) return `${field} must be a valid date`;
  if (rule.enum && !rule.enum.includes(value)) return `${field} must be one of: ${rule.enum.join(", ")}`;
  if (rule.min !== undefined && value < rule.min) return `${field} must be >= ${rule.min}`;
  if (rule.max !== undefined && value > rule.max) return `${field} must be <= ${rule.max}`;
  if (rule.maxLength && String(value).length > rule.maxLength) return `${field} exceeds ${rule.maxLength} characters`;
  if (rule.pattern && !rule.pattern.test(String(value))) return `${field} has invalid format`;
  return null;
}

export function validateRequest(rules, source = "body") {
  return (req, _res, next) => {
    const errors = [];
    for (const [field, rule] of Object.entries(rules)) {
      const err = validateValue(req[source]?.[field], rule, field);
      if (err) errors.push(err);
    }
    if (errors.length) return next(new HttpError(400, "Validation failed", errors));
    next();
  };
}
