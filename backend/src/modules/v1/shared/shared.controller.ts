import { Request, Response } from "express";
import { z } from "zod";
import { ShareService } from "./shared.services";
import { asyncHandler } from "../../../middleware";

const shareSchema = z.object({
  fileId: z.string(),
  recipientEmail: z.string().email(),
  encryptedKeyForRecipient: z.string().min(10),
});

export class ShareController {
  constructor(private service = new ShareService()) {}

  share = asyncHandler(async (req: Request, res: Response) => {
    const parsed = shareSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    const user = (req as any).user;
    const result = await this.service.shareFile(user.id, parsed.data);
    res.status(201).json(result);
  });

  listShared = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const files = await this.service.getSharedFiles(user.id);
    res.status(200).json(files);
  });
}
