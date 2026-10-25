import { config, assertProductionConfig } from "./config/env.js";
import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { refreshSimulatedHealth } from "./services/healthService.js";

let timer;

try {
  assertProductionConfig();
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
  });

  timer = setInterval(() => refreshSimulatedHealth().catch((e) => console.error("health tick failed:", e.message)), 30_000);

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    clearInterval(timer);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
} catch (error) {
  console.error("Startup failed:", error.message);
  process.exit(1);
}
