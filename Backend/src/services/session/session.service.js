import { sessionRepo } from "../../repositories/session.repo.js";
import { messageRepo } from "../../repositories/message.repo.js";
import { ApiError } from "../../utils/ApiError.js";

export const sessionService = {
  async createOrUpdate({ sessionId, userId, deviceId, locale }) {
    const session = await sessionRepo.upsert(sessionId, userId, {
      lastActiveAt: new Date(),
    });
    if (deviceId && !session.deviceIds.includes(deviceId)) {
      session.deviceIds.push(deviceId);
      session.metadata = session.metadata || {};
      if (locale) session.metadata.locale = locale;
      await session.save();
    }
    return session.toObject();
  },

  async list({ userId, limit, cursor }) {
    return sessionRepo.listByUser(userId, { limit, cursor });
  },

  async get({ id, userId }) {
    const s = await sessionRepo.findById(id, userId);
    if (!s) throw new ApiError(404, "Session not found");
    return s.toObject();
  },

  async patch({ id, userId, expectedVersion, patch }) {
    const updated = await sessionRepo.patchWithVersion(
      id,
      userId,
      expectedVersion,
      patch
    );
    if (!updated) throw new ApiError(409, "Version mismatch — sync required");
    return updated.toObject();
  },

  async remove({ id, userId }) {
    const r = await sessionRepo.remove(id, userId);
    if (!r.deletedCount) throw new ApiError(404, "Session not found");
    await messageRepo.deleteBySession(id, userId);
    return { deleted: true };
  },

  async listMessages({ id, userId, limit }) {
    const exists = await sessionRepo.findById(id, userId);
    if (!exists) throw new ApiError(404, "Session not found");
    return messageRepo.listBySession(id, userId, { limit });
  },

  async addMessage({ sessionId, userId, role, text, payload }) {
    return messageRepo.add({ sessionId, userId, role, text, payload });
  },

  async recentHistory({ sessionId, userId, limit = 10 }) {
    return messageRepo.recent(sessionId, userId, limit);
  },

  async touchAfterTriage({
    sessionId,
    userId,
    deviceId,
    severity,
    summaryHash,
    modelVersion,
    locale,
  }) {
    const s = await sessionRepo.upsert(sessionId, userId, {
      lastActiveAt: new Date(),
      severity,
      summaryHash,
      "metadata.modelVersion": modelVersion,
      "metadata.locale": locale,
    });
    if (deviceId && !s.deviceIds.includes(deviceId)) {
      s.deviceIds.push(deviceId);
      s.metadata = s.metadata || {};
      s.metadata.msgCount = (s.metadata.msgCount || 0) + 2;
      await s.save();
    } else {
      await sessionRepo.upsert(sessionId, userId, {
        $inc: { "metadata.msgCount": 2 },
      });
    }
  },
};
