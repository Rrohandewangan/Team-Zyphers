import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { DB_NAME } from "../constants.js";
import { ensureIndexes } from "./indexes.js";
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

mongoose.set("strictQuery", true);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(`${env.mongoUri}/${DB_NAME}`, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5_000,
      retryWrites: true,
    });
    logger.info("[mongo] connected", {
      host: conn.connection.host,
      db: DB_NAME,
    });
    await ensureIndexes();
  } catch (err) {
    logger.error("[mongo] connection failed", { error: err.message });
    throw err;
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  logger.info("[mongo] disconnected");
};

export default connectDB;
