import { Router } from "express";
import authRoutes from "./auth.routes.js";
import deviceRoutes from "./device.routes.js";
import sessionRoutes from "./session.routes.js";
import aiRoutes from "./ai.routes.js";
import facilityRoutes from "./facility.routes.js";
import syncRoutes from "./sync.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/devices", deviceRoutes);
router.use("/sessions", sessionRoutes);
router.use("/ai", aiRoutes);
router.use("/facility", facilityRoutes);
router.use("/sync", syncRoutes);

export default router;
