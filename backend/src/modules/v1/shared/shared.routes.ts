import { Router } from "express";
import { ShareController } from "./shared.controller";
import { requireAuth } from "../../../middleware";

const router = Router();
const controller = new ShareController();

router.post("/", requireAuth, controller.share);
router.get("/", requireAuth, controller.listShared);

export default router;
