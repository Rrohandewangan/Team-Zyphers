import { SessionModel } from "../models/Session.model.js";

function buildUpdate(patch, id, userId) {
  const update = { $setOnInsert: { _id: id, userId } };
  const setFields = {};
  for (const [k, v] of Object.entries(patch || {})) {
    if (k.startsWith("$")) {
      update[k] = { ...(update[k] || {}), ...v };
    } else if (v !== undefined) {
      setFields[k] = v;
    }
  }
  if (Object.keys(setFields).length) update.$set = setFields;
  return update;
}

export const sessionRepo = {
  upsert: (id, userId, patch) =>
    SessionModel.findOneAndUpdate(
      { _id: id, userId },
      buildUpdate(patch, id, userId),
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
  listByUser: (userId, { limit = 50, cursor } = {}) => {
    const q = { userId };
    if (cursor) q.lastActiveAt = { $lt: new Date(cursor) };
    return SessionModel.find(q).sort({ lastActiveAt: -1 }).limit(limit).lean();
  },
  findById: (id, userId) => SessionModel.findOne({ _id: id, userId }),
  patchWithVersion: (id, userId, expectedVersion, patch) =>
    SessionModel.findOneAndUpdate(
      { _id: id, userId, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { new: true }
    ),
  remove: (id, userId) => SessionModel.deleteOne({ _id: id, userId }),
};
