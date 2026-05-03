import { Router } from "express";
import { deviceController } from "../controllers/device.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerDeviceSchema } from "../validators/device.validator.js";

const router = Router();
router.use(requireAuth);

router.post("/", validate(registerDeviceSchema), deviceController.register);
router.get("/", deviceController.list);
router.delete("/:id", deviceController.revoke);

export default router;
