import { Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import { FileService } from "./file.services";
import { asyncHandler } from "../../../middleware";
import { logger } from "../../../config";

const uploadMetadataSchema = z.object({
  filename: z.string().min(1).max(255),
  iv: z.string().min(1),
  integrityHash: z.string().min(1),
  encryptedKeyForOwner: z.string().min(1),
  originalSize: z
    .number()
    .positive()
    .max(10 * 1024 * 1024), // 10MB max
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Single file only
  },
  fileFilter: (req, file, cb) => {
    // Accept all files since they're encrypted
    cb(null, true);
  },
});

export class FileController {
  constructor(private service = new FileService()) {}

  // Multer middleware for file upload
  uploadMiddleware = upload.single("file");

  getUploadConfig = asyncHandler(async (req: Request, res: Response) => {
    const config = this.service.getUploadConfig();
    res.status(200).json(config);
  });

  upload = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Validate metadata from form data
      const metadata = {
        filename: req.body.filename,
        iv: req.body.iv,
        integrityHash: req.body.integrityHash,
        encryptedKeyForOwner: req.body.encryptedKeyForOwner,
        originalSize: parseInt(req.body.originalSize),
      };

      const parsed = uploadMetadataSchema.safeParse(metadata);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid metadata",
          errors: parsed.error.flatten(),
        });
      }

      const result = await this.service.uploadFile(
        user.id,
        req.file.buffer,
        parsed.data,
        req.file.mimetype
      );

      res.status(201).json(result);
    } catch (error) {
      logger.error("Upload error:", error);
      res.status(500).json({
        success: false,
        message: "Upload failed",
      });
    }
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    console.log("FileController.list called for user:", user.id);

    const files = await this.service.listUserFiles(user.id);
    console.log("FileController.list found files:", files.length, files);

    res.status(200).json({
      success: true,
      data: files,
    });
  });

  getMetadata = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const fileId = req.params.id;

    try {
      const metadata = await this.service.getFileMetadata(fileId, user.id);
      res.status(200).json({
        success: true,
        data: metadata,
      });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        message: error.message || "Failed to get file metadata",
      });
    }
  });

  download = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const fileId = req.params.id;

    try {
      logger.info(
        `Download request - User: ${user.email} (ID: ${user.id}), File: ${fileId}`
      );

      const { stream, metadata } = await this.service.downloadFile(
        fileId,
        user.id
      );

      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${metadata.filename}.enc"`
      );
      res.setHeader(
        "X-File-Metadata",
        JSON.stringify({
          filename: metadata.filename,
          iv: metadata.iv,
          encryptedKeyForOwner: metadata.encryptedKeyForOwner,
          integrityHash: metadata.integrityHash,
        })
      );

      stream.pipe(res);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        message: error.message || "Failed to download file",
      });
    }
  });

  share = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const fileId = req.params.id;
    const { recipientEmail, encryptedKeyForRecipient } = req.body;

    if (!recipientEmail || !encryptedKeyForRecipient) {
      return res.status(400).json({
        success: false,
        message: "Recipient email and encrypted key are required",
      });
    }

    try {
      const result = await this.service.shareFile(
        fileId,
        user.id,
        recipientEmail,
        encryptedKeyForRecipient
      );
      res.status(201).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        message: error.message || "Failed to share file",
      });
    }
  });

  getSharedFiles = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const sharedFiles = await this.service.getSharedFiles(user.id);
    res.status(200).json({
      success: true,
      data: sharedFiles,
    });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const fileId = req.params.id;

    logger.info(
      `DELETE request received - fileId: ${fileId}, userId: ${user?.id}`
    );

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: "File ID is required",
      });
    }

    try {
      await this.service.deleteFile(fileId, user.id);
      res.status(200).json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error: any) {
      const status = error.status || 500;
      logger.error(`Delete file error: ${error.message}`, error);
      res.status(status).json({
        success: false,
        message: error.message || "Failed to delete file",
      });
    }
  });
}
