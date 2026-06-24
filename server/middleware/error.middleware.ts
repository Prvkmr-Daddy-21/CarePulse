import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export interface CustomError extends Error {
  status?: number;
}

export function errorMiddleware(
  err: CustomError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  console.error("💥 Error Caught in Middleware:", err);

  // 1. Zod Validation Error Handler
  if (err instanceof ZodError) {
    console.error("💥 Zod validation error details:", JSON.stringify(err.flatten().fieldErrors, null, 2));
    res.status(400).json({
      error: "Validation error",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // 2. Mongoose Duplicate Key Error
  if ((err as any).code === 11000) {
    res.status(409).json({
      error: "A record with this identifier already exists in our records."
    });
    return;
  }

  // 3. Fallback standard error
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || "An unexpected system discrepancy has occurred. Please contact MediConnect administration."
  });
}
