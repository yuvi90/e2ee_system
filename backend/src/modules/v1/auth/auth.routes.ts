import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();
const controller = new AuthController();

router.post("/check-email", controller.checkEmail);
router.post("/check-user-exists", controller.checkUserExists);
router.get("/user/:email/public-key", controller.getUserPublicKey);
router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/refresh-token", controller.refreshToken);
router.post("/logout", controller.logout);

export default router;
