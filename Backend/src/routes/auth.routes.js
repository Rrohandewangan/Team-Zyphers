import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register
);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", validate(logoutSchema), authController.logout);
router.get("/me", requireAuth, authController.me);
router.put("/profile", requireAuth, authController.updateProfile);

export default router;
