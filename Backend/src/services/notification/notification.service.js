import { logger } from "../../config/logger.js";

export class NotificationService {
  constructor({ providers = [] } = {}) {
    this.providers = providers;
  }

  async push({ device, title, body, data }) {
    if (!this.providers.length) {
      logger.info("[notify] (noop) push", { deviceId: device?._id, title });
      return { delivered: false, reason: "no-provider" };
    }
    for (const p of this.providers) {
      try {
        return await p.send({ device, title, body, data });
      } catch (err) {
        logger.warn("[notify] provider failed", { error: err.message });
      }
    }
    return { delivered: false };
  }
}

export const notificationService = new NotificationService();
