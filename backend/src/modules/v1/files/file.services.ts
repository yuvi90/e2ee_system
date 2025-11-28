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

  async uploadFile(
    ownerId: number,
    encryptedFile: Buffer,
    metadata: IFileUploadRequest,
    mimeType?: string
  ): Promise<IFileUploadResponse> {
    try {
      this.ensureUploadDirectory();

      // Create unique filename for encrypted file
      const safeName = metadata.filename.replace(/[^\w.-]/g, "_");
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const encryptedFileName = `${timestamp}_${randomId}_${safeName}.enc`;
      const filePath = path.join(UPLOAD_ROOT, encryptedFileName);

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
        encryptedKeyForOwner: true, // Include encrypted key for sharing
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getFile(fileId: string, userId: number) {
    logger.info(`Getting file: ${fileId} for user: ${userId}`);

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { owner: { select: { id: true, email: true } } },
    });

    if (!file) {
      logger.warn(`File not found in database: ${fileId}`);
      throw { status: 404, message: `File with ID ${fileId} not found` };
    }

    if (file.ownerId !== userId) {
      logger.warn(
        `Access denied for user ${userId} to file ${fileId}, owner: ${file.ownerId}`
      );
      throw { status: 403, message: "Access denied - you don't own this file" };
    }

    return file;
  }

  async getFileWithAccess(fileId: string, userId: number) {
    logger.info(
      `Getting file with access check: ${fileId} for user: ${userId}`
    );

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { owner: { select: { id: true, email: true } } },
    });

    if (!file) {
      logger.warn(`File not found in database: ${fileId}`);
      throw { status: 404, message: `File with ID ${fileId} not found` };
    }

    // Check if user owns the file
    if (file.ownerId === userId) {
      logger.info(
        `User ${userId} owns file ${fileId}, using owner's encrypted key`
      );
      return {
        file,
        encryptedKey: file.encryptedKeyForOwner,
        isOwner: true,
      };
    }

    // Check if file is shared with user
    const fileAccess = await prisma.fileAccess.findUnique({
      where: {
        fileId_sharedWithId: {
          fileId: fileId,
          sharedWithId: userId,
        },
      },
    });

    if (!fileAccess) {
      logger.warn(
        `Access denied for user ${userId} to file ${fileId}, not owner and not shared`
      );
      throw {
        status: 403,
        message: "Access denied - you don't have access to this file",
      };
    }

    logger.info(
      `User ${userId} has shared access to file ${fileId}, using recipient's encrypted key`
    );
    return {
      file,
      encryptedKey: fileAccess.encryptedKey,
      isOwner: false,
    };
  }

  async getFileMetadata(
    fileId: string,
    userId: number
  ): Promise<IFileMetadata> {
    const { file } = await this.getFileWithAccess(fileId, userId);

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
    const { file, encryptedKey } = await this.getFileWithAccess(fileId, userId);

    if (!fs.existsSync(file.encryptedFilePath)) {
      throw { status: 404, message: "File not found on disk" };
    }

    return {
      stream: fs.createReadStream(file.encryptedFilePath),
      metadata: {
        filename: file.filename,
        iv: file.iv,
        encryptedKeyForOwner: encryptedKey,
        integrityHash: file.integrityHash,
      },
    };
  }

  async shareFile(
    fileId: string,
    ownerId: number,
    recipientEmail: string,
    encryptedKeyForRecipient: string
  ) {
    // Verify file ownership
    const file = await this.getFile(fileId, ownerId);

    // Find recipient user
    const recipient = await prisma.user.findUnique({
      where: { email: recipientEmail },
      select: { id: true, email: true, publicKey: true },
    });

    if (!recipient) {
      throw { status: 404, message: "Recipient user not found" };
    }

    if (!recipient.publicKey) {
      throw {
        status: 400,
        message: "Recipient doesn't have encryption keys set up",
      };
    }

    if (recipient.id === ownerId) {
      throw { status: 400, message: "Cannot share file with yourself" };
    }

    // Check if already shared
    const existingAccess = await prisma.fileAccess.findUnique({
      where: {
        fileId_sharedWithId: {
          fileId,
          sharedWithId: recipient.id,
        },
      },
    });

    if (existingAccess) {
      throw { status: 409, message: "File already shared with this user" };
    }

    // Create file access record
    await prisma.fileAccess.create({
      data: {
        fileId,
        sharedWithId: recipient.id,
        encryptedKey: encryptedKeyForRecipient,
      },
    });

    logger.info(`File ${fileId} shared with user ${recipient.email}`);

    return {
      success: true,
      message: `File shared successfully with ${recipient.email}`,
      data: {
        recipientEmail: recipient.email,
        sharedAt: new Date().toISOString(),
      },
    };
  }

  async getSharedFiles(userId: number) {
    const sharedFiles = await prisma.fileAccess.findMany({
      where: { sharedWithId: userId },
      include: {
        file: {
          select: {
            id: true,
            filename: true,
            originalSize: true,
            mimeType: true,
            createdAt: true,
            integrityHash: true,
            owner: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sharedFiles.map((access) => ({
      ...access.file,
      encryptedKeyForRecipient: access.encryptedKey,
      sharedBy: access.file.owner,
      sharedAt: access.createdAt,
    }));
  }

  async deleteFile(fileId: string, userId: number) {
    try {
      logger.info(`Attempting to delete file: ${fileId} for user: ${userId}`);

      const file = await this.getFile(fileId, userId);
      logger.info(
        `File found: ${file.filename}, path: ${file.encryptedFilePath}`
      );

      // Delete file from filesystem
      if (fs.existsSync(file.encryptedFilePath)) {
        fs.unlinkSync(file.encryptedFilePath);
        logger.info(`File deleted from filesystem: ${file.encryptedFilePath}`);
      } else {
        logger.warn(`File not found on filesystem: ${file.encryptedFilePath}`);
      }

      // Delete from database (cascade delete will handle file access records)
      await prisma.file.delete({
        where: { id: fileId },
      });

      logger.info(`File deleted from database: ${fileId}`);
    } catch (error: any) {
      logger.error(`Delete file error: ${error.message}`, error);
      throw error;
    }
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
