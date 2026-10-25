import { config } from "../config/env.js";

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || "Internal server error";
  if (err.name === "ValidationError") status = 400;
  if (err.name === "CastError") { status = 400; message = "Invalid identifier"; }
  if (err.code === 11000) { status = 409; message = "Duplicate value"; }
  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    message: status >= 500 && config.env === "production" ? "Internal server error" : message,
    details: err.details
  });
}
