import { ApiError } from "../utils/ApiError.js";
import { tokenService } from "../services/auth/token.service.js";
import { als } from "../config/logger.js";

export const requireAuth = (req, _res, next) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing bearer token"));
  }
  try {
    const payload = tokenService.verifyAccess(header.slice(7));
    req.user = {
      id: payload.sub,
      deviceId: payload.deviceId,
      scope: payload.scope,
    };

    const deviceHeader = req.header("x-device-id");
    if (deviceHeader && deviceHeader !== payload.deviceId) {
      return next(new ApiError(401, "Device binding mismatch"));
    }

    const store = als.getStore();
    if (store) store.userId = payload.sub;

    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
};
