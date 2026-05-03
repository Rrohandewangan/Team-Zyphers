import mongoose from "mongoose";
import { logger } from "../config/logger.js";

export async function ensureIndexes() {
  try {
    await Promise.all(
      Object.values(mongoose.models).map((m) => m.syncIndexes())
    );
    logger.info("[mongo] indexes synced");
  } catch (err) {
    logger.warn("[mongo] index sync failed", { error: err.message });
  }
}
