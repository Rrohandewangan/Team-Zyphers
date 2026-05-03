import { asyncHandler } from "../utils/asyncHandler.js";
import { deviceRepo } from "../repositories/device.repo.js";
import { ok } from "../middleware/error.middleware.js";

export const deviceController = {
  register: asyncHandler(async (req, res) => {
    const device = await deviceRepo.create({
      userId: req.user.id,
      ...req.body,
    });
    ok(
      res,
      { device: { id: device._id, platform: device.platform } },
      "Device registered",
      201
    );
  }),

  list: asyncHandler(async (req, res) => {
    const devices = await deviceRepo.findActiveByUser(req.user.id);
    ok(res, {
      devices: devices.map((d) => ({
        id: d._id,
        platform: d.platform,
        name: d.name,
        lastSeenAt: d.lastSeenAt,
      })),
    });
  }),

  revoke: asyncHandler(async (req, res) => {
    await deviceRepo.revoke(req.params.id, req.user.id);
    ok(res, null, "Device revoked");
  }),
};
