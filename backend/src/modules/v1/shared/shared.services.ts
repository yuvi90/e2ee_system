import { prisma } from "../../../db/prismaClient";
import { ShareFileInput } from "./shared.types";

export class ShareService {
  async shareFile(senderId: number, data: ShareFileInput) {
    const file = await prisma.file.findUnique({ where: { id: data.fileId } });
    if (!file || file.ownerId !== senderId)
      throw { status: 403, message: "Not authorized to share this file" };

    const recipient = await prisma.user.findUnique({
      where: { email: data.recipientEmail },
    });
    if (!recipient) throw { status: 404, message: "Recipient not found" };

    await prisma.fileAccess.create({
      data: {
        fileId: file.id,
        sharedWithId: recipient.id,
        encryptedKey: data.encryptedKeyForRecipient,
      },
    });

    return { message: "File shared successfully" };
  }

  async getSharedFiles(userId: number) {
    return prisma.fileAccess.findMany({
      where: { sharedWithId: userId },
      include: {
        file: {
          select: { id: true, filename: true, ownerId: true, createdAt: true },
        },
      },
    });
  }
}
