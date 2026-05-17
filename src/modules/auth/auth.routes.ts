import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "@middlewares/auth.middleware";

const router = Router();

router.post("/register", AuthController.register as any);
router.post("/login", AuthController.login as any);
router.post("/logout", AuthController.logout as any);

// Protected route
router.get("/profile", authMiddleware, AuthController.getProfile as any);

export default router;
