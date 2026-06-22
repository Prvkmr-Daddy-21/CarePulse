import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many authentication attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

const router = Router();

router.post("/register", authLimiter, AuthController.register);
router.post("/check-email", authLimiter, AuthController.checkEmail);
router.post("/login", authLimiter, AuthController.login);
router.post("/refresh", authLimiter, AuthController.refresh);
router.get("/me", authMiddleware, AuthController.getMe);
router.post("/forgot-password", authLimiter, AuthController.forgotPassword);
router.post("/reset-password/:token", authLimiter, AuthController.resetPassword);

export default router;
