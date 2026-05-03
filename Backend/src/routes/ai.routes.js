import { Router } from "express";
import { aiController } from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { aiLimiter } from "../middleware/rateLimit.middleware.js";
import { triageSchema } from "../validators/ai.validator.js";

const router = Router();
router.use(requireAuth);

router.post("/triage", aiLimiter, validate(triageSchema), aiController.triage);
router.post(
  "/triage/stream",
  aiLimiter,
  validate(triageSchema),
  aiController.triageStream
);

export default router;
