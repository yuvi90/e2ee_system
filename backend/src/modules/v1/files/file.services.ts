import fs from "fs";
import path from "path";
import { prisma } from "../../../db/prismaClient";
import {
  IFileUploadRequest,
  IFileUploadResponse,
  IFileMetadata,
  IUploadConfig,
} from "./file.types";
import { logger } from "../../../config";

const UPLOAD_ROOT = path.join(__dirname, "../../../../uploads");

export class FileService {
  private ensureUploadDirectory() {
    if (!fs.existsSync(UPLOAD_ROOT)) {
      fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
    }
    return UPLOAD_ROOT;
  }

  private ensureUserFolder(userId: number) {
    const userDir = path.join(UPLOAD_ROOT, `user_${userId}`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
  }

  async uploadFile(
    ownerId: number,
    encryptedFile: Buffer,
    metadata: IFileUploadRequest,
    mimeType?: string
  ): Promise<IFileUploadResponse> {
    try {
      const userDir = this.ensureUserFolder(ownerId);

      // Create safe filename for encrypted file
      const safeName = metadata.filename.replace(/[^\w.-]/g, "_");
      const timestamp = Date.now();
      const encryptedFileName = `${timestamp}_${safeName}.enc`;
      const filePath = path.join(userDir, encryptedFileName);

      // Write encrypted file to disk
      fs.writeFileSync(filePath, encryptedFile);

      // Save metadata to database
      const file = await prisma.file.create({
        data: {
          ownerId,
          filename: metadata.filename,
          originalSize: metadata.originalSize,
          encryptedFilePath: filePath,
          encryptedKeyForOwner: metadata.encryptedKeyForOwner,
          iv: metadata.iv,
          integrityHash: metadata.integrityHash,
          mimeType: mimeType || null,
        },
      });

      logger.info(
        `File uploaded successfully: ${file.id} - ${metadata.filename}`
      );

      return {
        success: true,
        message: "File uploaded successfully",
        data: {
          fileId: file.id,
          filename: file.filename,
          uploadedAt: file.createdAt.toISOString(),
        },
      };
    } catch (error) {
      logger.error("File upload error:", error);
      throw new Error("Failed to upload file");
    }
  }

  async listUserFiles(ownerId: number) {
    return prisma.file.findMany({
      where: { ownerId },
      select: {
        id: true,
        filename: true,
        originalSize: true,
        mimeType: true,
        createdAt: true,
        integrityHash: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getFile(fileId: string, userId: number) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { owner: { select: { id: true, email: true } } },
    });

    if (!file) {
      throw { status: 404, message: "File not found" };
    }

    if (file.ownerId !== userId) {
      throw { status: 403, message: "Access denied" };
    }

    return file;
  }

  async getFileMetadata(
    fileId: string,
    userId: number
  ): Promise<IFileMetadata> {
    const file = await this.getFile(fileId, userId);

    return {
      id: file.id,
      filename: file.filename,
      originalSize: file.originalSize,
      uploadedAt: file.createdAt.toISOString(),
      integrityHash: file.integrityHash,
      mimeType: file.mimeType || undefined,
    };
  }

  async downloadFile(fileId: string, userId: number) {
    const file = await this.getFile(fileId, userId);

    if (!fs.existsSync(file.encryptedFilePath)) {
      throw { status: 404, message: "File not found on disk" };
    }

    return {
      stream: fs.createReadStream(file.encryptedFilePath),
      metadata: {
        filename: file.filename,
        iv: file.iv,
        encryptedKeyForOwner: file.encryptedKeyForOwner,
        integrityHash: file.integrityHash,
      },
    };
  }

  async deleteFile(fileId: string, userId: number) {
    const file = await this.getFile(fileId, userId);

    // Delete file from disk
    if (fs.existsSync(file.encryptedFilePath)) {
      fs.unlinkSync(file.encryptedFilePath);
    }

    // Delete from database
    await prisma.file.delete({ where: { id: fileId } });

    logger.info(`Deleted file ${fileId} - ${file.filename}`);
    return { success: true, message: "File deleted successfully" };
  }

  getUploadConfig(): IUploadConfig {
    return {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 1, // Single file upload
      supportedTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    };
  }
}
