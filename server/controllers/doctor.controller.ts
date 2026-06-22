import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
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

  static async addDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, phone, specialty, qualification, experience, status } = req.body;
      
      const existingUser = await db.users.findOne({ email });
      if (existingUser) {
        res.status(409).json({ success: false, message: "Doctor account already exists with this email." });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      await db.users.create({
        email,
        password: hashedPassword,
        role: "doctor"
      });

      const newDoctor = await db.doctors.create({
        name,
        email,
        specialty,
        phone,
        status: status || "active",
        qualification,
        experience: Number(experience) || 0
      });

      res.status(201).json({ success: true, doctor: newDoctor });
    } catch (err) {
      next(err);
    }
  }

  static async getDoctorsStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctors = await db.doctors.find();
      const appointments = await db.appointments.find();

      const doctorsWithStats = doctors.map(doctor => {
        const doctorAppointments = appointments.filter(
          a => a.primaryPhysician === doctor.name || a.doctorId === doctor._id
        );

        return {
          ...doctor,
          stats: {
            total: doctorAppointments.length,
            pending: doctorAppointments.filter(a => a.status === "pending").length,
            scheduled: doctorAppointments.filter(a => a.status === "scheduled").length,
            completed: doctorAppointments.filter(a => a.status === "completed").length,
            cancelled: doctorAppointments.filter(a => a.status === "cancelled").length,
          }
        };
      });

      res.status(200).json({ success: true, doctors: doctorsWithStats });
    } catch (err) {
      next(err);
    }
  }
}
export default DoctorController;
