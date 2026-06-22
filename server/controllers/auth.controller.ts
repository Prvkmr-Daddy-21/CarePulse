import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ error: "Refresh token is required" });
        return;
      }
      const result = await AuthService.refresh(refreshToken);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const profile = await AuthService.getUserProfile(req.user.userId);
      res.status(200).json({ user: profile });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const host = req.get("host") || "localhost:3000";
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      await AuthService.sendForgotPasswordLink(email, protocol, host);
      res.status(200).json({ success: true, message: "If an account exists, a reset link has been sent." });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      await AuthService.resetPassword(token, req.body);
      res.status(200).json({ success: true, message: "Password reset successful." });
    } catch (err) {
      next(err);
    }
  }
}
export default AuthController;
