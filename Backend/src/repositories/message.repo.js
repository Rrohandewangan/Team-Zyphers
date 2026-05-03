import { MessageModel } from "../models/message.model.js";

export const messageRepo = {
  add: ({ sessionId, userId, role, text, payload }) =>
    MessageModel.create({ sessionId, userId, role, text, payload }),

  listBySession: (sessionId, userId, { limit = 100 } = {}) =>
    MessageModel.find({ sessionId, userId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean(),

  recent: async (sessionId, userId, n = 10) => {
    const docs = await MessageModel.find({ sessionId, userId })
      .sort({ createdAt: -1 })
      .limit(n)
      .lean();
    return docs.reverse();
  },

  deleteBySession: (sessionId, userId) =>
    MessageModel.deleteMany({ sessionId, userId }),
};
