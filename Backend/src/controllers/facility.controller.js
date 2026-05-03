import { asyncHandler } from "../utils/asyncHandler.js";
import { buildContainer } from "../config/container.js";
import { ok } from "../middleware/error.middleware.js";

export const facilityController = {
  nearby: asyncHandler(async (req, res) => {
    const { facilityService } = buildContainer();
    const items = await facilityService.nearby(req.query);
    ok(res, { items });
  }),
};
