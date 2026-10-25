// import "dotenv/config";

// function num(value, fallback) {
//   const parsed = Number(value);
//   return Number.isFinite(parsed) ? parsed : fallback;
// }

// export const config = {
//   env: process.env.NODE_ENV || "development",
//   port: num(process.env.PORT, 5000),
//   frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
//   mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/paysecure_dr",
//   jwtSecret: process.env.JWT_SECRET || "dev-only-insecure-secret-change-me-please-32",
//   jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
//   allowRealFailover: process.env.ALLOW_REAL_FAILOVER === "true",
//   workload: {
//     dailyTransactions: num(process.env.DAILY_TRANSACTIONS, 3_200_000),
//     dailyValueInr: num(process.env.DAILY_VALUE_INR, 5_000_000_000),
//     sloAvailability: num(process.env.SLO_AVAILABILITY, 99.99),
//     rtoTargetSeconds: num(process.env.RTO_TARGET_SECONDS, 300),
//     rpoTargetSeconds: num(process.env.RPO_TARGET_SECONDS, 60)
//   }
// };

// export function assertProductionConfig() {
//   if (config.env === "production") {
//     if (config.jwtSecret.length < 32 || config.jwtSecret.includes("dev-only")) {
//       throw new Error("JWT_SECRET must be a strong secret (>=32 chars) in production");
//     }
//     if (config.allowRealFailover) {
//       throw new Error("ALLOW_REAL_FAILOVER must remain false: this app only simulates failover");
//     }
//   }
// }



import "dotenv/config";

const required = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is missing in .env`);
  }

  return value;
};

export const config = {
  port: Number(process.env.PORT || 5000),
  env: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  allowRealFailover: process.env.ALLOW_REAL_FAILOVER === "true",
  dailyTransactions: Number(process.env.DAILY_TRANSACTIONS || 3200000),
  dailyValueInr: Number(process.env.DAILY_VALUE_INR || 5000000000),
  sloAvailability: Number(process.env.SLO_AVAILABILITY || 99.99),
  rtoTargetSeconds: Number(process.env.RTO_TARGET_SECONDS || 300),
  rpoTargetSeconds: Number(process.env.RPO_TARGET_SECONDS || 60),
};

export function assertProductionConfig() {
  if (config.env !== "production") return;

  required("MONGODB_URI");

  const secret = required("JWT_SECRET");

  if (
    secret.length < 32 ||
    secret === "replace_with_a_long_random_development_secret_min_32_chars"
  ) {
    throw new Error("Use a strong JWT_SECRET of at least 32 characters");
  }

  if (config.allowRealFailover) {
    throw new Error("Real failover is disabled by project safety policy");
  }
}

