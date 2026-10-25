// import mongoose from "mongoose";
// import { config } from "./env.js";

// mongoose.set("strictQuery", true);

// export async function connectDatabase(uri = config.mongoUri) {
//   if (!uri) throw new Error("MONGODB_URI is missing");
//   await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
//   console.log("MongoDB connected successfully");
//   return mongoose.connection;
// }

// export async function disconnectDatabase() {
//   await mongoose.disconnect();
// }

// export function databaseState() {
//   const map = ["disconnected", "connected", "connecting", "disconnecting"];
//   return map[mongoose.connection.readyState] || "unknown";
// }



import mongoose from "mongoose";
import { config } from "./env.js";

export async function connectDatabase() {
  if (!config.mongodbUri) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(config.mongodbUri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  console.log("MongoDB Atlas connected successfully");
}

export function databaseState() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    status: states[mongoose.connection.readyState] ?? "unknown",
    connected: mongoose.connection.readyState === 1,
    database: mongoose.connection.name || null,
  };
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}
