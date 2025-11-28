import { Router } from "express";
import { FileController } from "./file.controller";
import { requireAuth } from "../../../middleware";
import { rateLimit } from "express-rate-limit";

const router = Router();
const fileController = new FileController();

// Rate limiting for file operations
const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: {
    error: "Too many upload attempts. Please try again in an hour.",
    status: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const downloadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // 200 downloads per hour
  message: {
    error: "Too many download attempts. Please try again in an hour.",
    status: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes require authentication
router.use(requireAuth);

// GET /api/v1/files/config - Get upload configuration
router.get("/config", fileController.getUploadConfig);

// POST /api/v1/files/upload - Upload encrypted file
router.post(
  "/upload",
  uploadRateLimit,
  fileController.uploadMiddleware,
  fileController.upload
);

// GET /api/v1/files/my-files - List user's files
router.get("/my-files", fileController.list);

// GET /api/v1/files/:id/metadata - Get file metadata
router.get("/:id/metadata", fileController.getMetadata);

// GET /api/v1/files/:id/download - Download encrypted file
router.get("/:id/download", downloadRateLimit, fileController.download);

// POST /api/v1/files/:id/share - Share file with another user
router.post("/:id/share", fileController.share);

// GET /api/v1/files/shared-with-me - Get files shared with current user
router.get("/shared-with-me", fileController.getSharedFiles);

// DELETE /api/v1/files/:id - Delete file
router.delete("/:id", fileController.delete);

export default router;
