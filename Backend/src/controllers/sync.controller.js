import { asyncHandler } from "../utils/asyncHandler.js";
import { buildContainer } from "../config/container.js";
import { ok } from "../middleware/error.middleware.js";

export const syncController = {
  announce: asyncHandler(async (req, res) => {
    const { syncService } = buildContainer();
    const data = await syncService.announce({
      userId: req.user.id,
      deviceId: req.user.deviceId,
    });
    ok(res, data);
  }),

  issueUpload: asyncHandler(async (req, res) => {
    const { syncService } = buildContainer();
    const data = await syncService.issueUpload({
      userId: req.user.id,
      fromDevice: req.user.deviceId,
      toDevice: req.body.toDevice,
      sha256: req.body.sha256,
      sizeBytes: req.body.sizeBytes,
    });
    ok(res, data);
  }),

  issueDownload: asyncHandler(async (req, res) => {
    const { syncService } = buildContainer();
    const data = await syncService.issueDownload({
      userId: req.user.id,
      deviceId: req.user.deviceId,
      envelopeId: req.body.envelopeId,
    });
    ok(res, data);
  }),

  ack: asyncHandler(async (req, res) => {
    const { syncService } = buildContainer();
    await syncService.ack({
      userId: req.user.id,
      envelopeId: req.body.envelopeId,
    });
    ok(res, null, "Acknowledged");
  }),
};
