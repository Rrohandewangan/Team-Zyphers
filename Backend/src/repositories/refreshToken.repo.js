import { RefreshTokenModel } from "../models/refreshToken.model.js";

export const refreshTokenRepo = {
  create: (doc) => RefreshTokenModel.create(doc),
  findByHash: (tokenHash) => RefreshTokenModel.findOne({ tokenHash }),
  revokeFamily: (familyId) =>
    RefreshTokenModel.updateMany(
      { familyId, revokedAt: null },
      { revokedAt: new Date() }
    ),
  markReplaced: (id, replacedBy) =>
    RefreshTokenModel.updateOne(
      { _id: id },
      { revokedAt: new Date(), replacedBy }
    ),
};
