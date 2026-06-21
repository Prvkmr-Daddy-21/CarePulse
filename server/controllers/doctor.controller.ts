import { Request, Response, NextFunction } from "express";
import { db } from "../db/db";

export class DoctorController {
  static async listDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await db.doctors.find({ status: "active" });
      res.status(200).json({ success: true, doctors: list });
    } catch (err) {
      next(err);
    }
  }
}
export default DoctorController;
