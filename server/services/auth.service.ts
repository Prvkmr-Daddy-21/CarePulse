import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/db";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../middleware/auth.middleware";
import { IUser } from "../models/types";

export class AuthService {
  static async register(inputData: any): Promise<{ user: Omit<IUser, "password">; token: string; refreshToken: string }> {
    const validatedData = registerSchema.parse(inputData);

    const existingUser = await db.users.findOne({ email: validatedData.email });
    if (existingUser) {
      throw { status: 409, message: "Email is already registered" };
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const newUser = await db.users.create({
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role,
    });

    const token = this.generateAccessToken(newUser);
    const refreshToken = this.generateRefreshToken(newUser);

    // Remove password before returning
    const { password, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      token,
      refreshToken,
    };
  }

  static async login(inputData: any): Promise<{ user: Omit<IUser, "password">; token: string; refreshToken: string }> {
    console.log("\n🔑 [TIMING] Login request received");
    const tStart = performance.now();
    const validatedData = loginSchema.parse(inputData);

    console.log("🔍 [TIMING] User lookup started");
    const tLookupStart = performance.now();
    const user = await db.users.findOne({ email: validatedData.email });
    const tLookupEnd = performance.now();
    console.log(`🔍 [TIMING] User lookup completed in ${(tLookupEnd - tLookupStart).toFixed(2)}ms`);

    if (!user || !user.password) {
      throw { status: 401, message: "Invalid email or password" };
    }

    console.log("🔐 [TIMING] Password verification started");
    const tVerifyStart = performance.now();
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    const tVerifyEnd = performance.now();
    console.log(`🔐 [TIMING] Password verification completed in ${(tVerifyEnd - tVerifyStart).toFixed(2)}ms`);

    if (!isValidPassword) {
      throw { status: 401, message: "Invalid email or password" };
    }

    console.log("🎟️ [TIMING] JWT generation started");
    const tJwtStart = performance.now();
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const tJwtEnd = performance.now();
    console.log(`🎟️ [TIMING] JWT generation completed in ${(tJwtEnd - tJwtStart).toFixed(2)}ms`);

    const { password, ...userWithoutPassword } = user;
    const tTotal = performance.now() - tStart;
    console.log(`🚀 [TIMING] Response sent. Total login workflow completed in ${tTotal.toFixed(2)}ms\n`);

    return {
      user: userWithoutPassword,
      token,
      refreshToken,
    };
  }

  static async getUserProfile(userId: string): Promise<Omit<IUser, "password">> {
    const user = await db.users.findById(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static generateAccessToken(user: IUser): string {
    return jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" } // Increase in AI Studio to avoid token issues during dev play
    );
  }

  static generateRefreshToken(user: IUser): string {
    return jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
  }

  static async refresh(token: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as {
        userId: string;
        role: "admin" | "patient" | "doctor";
        email: string;
      };

      const user = await db.users.findById(decoded.userId);
      if (!user) {
        throw { status: 404, message: "Associated user not found" };
      }

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      throw { status: 401, message: "Invalid or expired refresh token." };
    }
  }
}
export default AuthService;
