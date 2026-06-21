import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: "admin" | "patient" | "doctor";
    email: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "healthcare_super_secret_key_change_me_in_production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "healthcare_super_refresh_secret_key_change_me_in_production";

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: "admin" | "patient" | "doctor";
      email: string;
    };
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ error: "TokenExpired", message: "Your access token has expired." });
    } else {
      res.status(403).json({ error: "Invalid or expired token." });
    }
  }
}

export function authorizeRoles(roles: ("admin" | "patient" | "doctor")[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Access forbidden. Insufficient permissions." });
      return;
    }

    next();
  };
}
export { JWT_SECRET, JWT_REFRESH_SECRET };
