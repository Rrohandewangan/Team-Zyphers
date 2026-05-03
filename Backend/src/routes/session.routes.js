import { Router } from "express";
import { sessionController } from "../controllers/session.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createSessionSchema,
  listSessionsSchema,
  patchSessionSchema,
} from "../validators/session.validator.js";

const router = Router();
router.use(requireAuth);

router.post("/", validate(createSessionSchema), sessionController.create);
router.get("/", validate(listSessionsSchema, "query"), sessionController.list);
router.get("/:id", sessionController.get);
router.get("/:id/messages", sessionController.messages);
router.patch("/:id", validate(patchSessionSchema), sessionController.patch);
router.delete("/:id", sessionController.remove);

export default router;
