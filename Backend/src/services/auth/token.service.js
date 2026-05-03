import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { env } from "../../config/env.js";
import { sha256, randomToken } from "../../utils/crypto.util.js";
import { refreshTokenRepo } from "../../repositories/refreshToken.repo.js";
import { ApiError } from "../../utils/ApiError.js";

const refreshExpiry = () =>
  new Date(Date.now() + env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000);

export const tokenService = {
  signAccess({ userId, deviceId, scope = "user" }) {
    return jwt.sign({ sub: userId, deviceId, scope }, env.jwt.accessSecret, {
      algorithm: "HS256",
      expiresIn: env.jwt.accessTtl,
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
      jwtid: uuid(),
    });
  },

  verifyAccess(token) {
    return jwt.verify(token, env.jwt.accessSecret, {
      algorithms: ["HS256"],
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    });
  },

  async issueRefresh({ userId, deviceId, familyId = uuid() }) {
    const raw = randomToken(48);
    await refreshTokenRepo.create({
      userId,
      deviceId,
      familyId,
      tokenHash: sha256(raw),
      expiresAt: refreshExpiry(),
    });
    return { raw, familyId };
  },

  async rotateRefresh(rawToken) {
    const tokenHash = sha256(rawToken);
    const record = await refreshTokenRepo.findByHash(tokenHash);
    if (!record) throw new ApiError(401, "Invalid refresh token");

    if (record.revokedAt) {
      await refreshTokenRepo.revokeFamily(record.familyId);
      throw new ApiError(401, "Refresh token reuse detected");
    }
    if (record.expiresAt < new Date())
      throw new ApiError(401, "Refresh token expired");

    const next = await tokenService.issueRefresh({
      userId: record.userId,
      deviceId: record.deviceId,
      familyId: record.familyId,
    });
    await refreshTokenRepo.markReplaced(record._id, sha256(next.raw));

    return {
      userId: record.userId,
      deviceId: record.deviceId,
      refreshToken: next.raw,
    };
  },

  async revokeRefresh(rawToken) {
    const record = await refreshTokenRepo.findByHash(sha256(rawToken));
    if (record) await refreshTokenRepo.revokeFamily(record.familyId);
  },
};
