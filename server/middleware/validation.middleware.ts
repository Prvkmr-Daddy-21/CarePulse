import { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";

export const validateRequest = (schema: ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors
      });
    }
  };
};
