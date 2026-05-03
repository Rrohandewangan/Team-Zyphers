import { userRepo } from "../../repositories/user.repo.js";
import { deviceRepo } from "../../repositories/device.repo.js";
import { passwordService } from "./password.service.js";
import { tokenService } from "./token.service.js";
import { ApiError } from "../../utils/ApiError.js";

export const authService = {
  async register({ email, password, name, phone, locale }) {
    const existing = await userRepo.findByEmail(email);
    if (existing) throw new ApiError(409, "Email already registered");

    const passwordHash = await passwordService.hash(password);
    const user = await userRepo.create({
      email,
      passwordHash,
      name,
      phone,
      locale,
    });
    return user.toJSON();
  },

  async login({ email, password, device }) {
    const user = await userRepo.findByEmail(email);
    if (!user) throw new ApiError(401, "Invalid credentials");

    const ok = await passwordService.verify(password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Invalid credentials");

    const deviceDoc = await deviceRepo.create({
      userId: user._id,
      platform: device.platform,
      name: device.name,
      pushToken: device.pushToken,
      publicKey: device.publicKey,
    });

    const accessToken = tokenService.signAccess({
      userId: user._id,
      deviceId: deviceDoc._id,
    });
    const { raw: refreshToken } = await tokenService.issueRefresh({
      userId: user._id,
      deviceId: deviceDoc._id,
    });

    return {
      user: user.toJSON(),
      device: { id: deviceDoc._id, platform: deviceDoc.platform },
      tokens: { accessToken, refreshToken },
    };
  },

  async refresh(rawRefreshToken) {
    const { userId, deviceId, refreshToken } =
      await tokenService.rotateRefresh(rawRefreshToken);
    const accessToken = tokenService.signAccess({ userId, deviceId });
    return { tokens: { accessToken, refreshToken } };
  },

  async logout(rawRefreshToken) {
    if (rawRefreshToken) await tokenService.revokeRefresh(rawRefreshToken);
  },
};
