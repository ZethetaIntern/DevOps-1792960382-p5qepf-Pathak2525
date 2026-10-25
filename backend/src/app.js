import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config/env.js";
import { databaseState } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import regionRoutes from "./routes/regionRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import failoverRoutes from "./routes/failoverRoutes.js";
import { runbookRouter, drillRouter } from "./routes/runbookRoutes.js";
import { complianceRouter, auditRouter } from "./routes/complianceRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: config.frontendUrl.split(","), credentials: true }));
app.use(express.json({ limit: "100kb" }));
if (config.env !== "test") app.use(morgan(config.env === "production" ? "combined" : "dev"));
app.use("/api", rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    service: "PaySecure DR API",
    environment: config.env,
    database: databaseState(),
    simulationOnly: !config.allowRealFailover,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", regionRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/failover", failoverRoutes);
app.use("/api/runbooks", runbookRouter);
app.use("/api/drills", drillRouter);
app.use("/api/compliance", complianceRouter);
app.use("/api/audit-logs", auditRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
