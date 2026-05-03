import { Router } from "express";
import { syncController } from "../controllers/sync.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  announceSchema,
  issueUploadSchema,
  issueDownloadSchema,
  ackSchema,
} from "../validators/sync.validator.js";

const router = Router();
router.use(requireAuth);

router.post("/announce", validate(announceSchema), syncController.announce);
router.post(
  "/relay/upload-url",
  validate(issueUploadSchema),
  syncController.issueUpload
);
router.post(
  "/relay/download-url",
  validate(issueDownloadSchema),
  syncController.issueDownload
);
router.post("/relay/ack", validate(ackSchema), syncController.ack);

export default router;
