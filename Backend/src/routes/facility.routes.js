import { Router } from "express";
import { facilityController } from "../controllers/facility.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { facilityNearbySchema } from "../validators/facility.validator.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/nearby",
  validate(facilityNearbySchema, "query"),
  facilityController.nearby
);

export default router;
