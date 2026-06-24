import { Request, Response, NextFunction } from "express";
import { db } from "../db/db";
import bcrypt from "bcryptjs";

export class DoctorController {
  static async listDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query.status ? { status: req.query.status as "active" | "inactive" } : {};
      const doctors = await db.doctors.find(query);
      const appointments = await db.appointments.find();

      const statsMap: Record<string, any> = {};
      appointments.forEach(apt => {
        if (!statsMap[apt.primaryPhysician]) {
          statsMap[apt.primaryPhysician] = { total: 0, pending: 0, scheduled: 0, completed: 0, cancelled: 0 };
        }
        statsMap[apt.primaryPhysician].total++;
        if (apt.status === "pending") statsMap[apt.primaryPhysician].pending++;
        else if (apt.status === "scheduled") statsMap[apt.primaryPhysician].scheduled++;
        else if (apt.status === "completed") statsMap[apt.primaryPhysician].completed++;
        else if (apt.status === "cancelled") statsMap[apt.primaryPhysician].cancelled++;
      });

      const doctorsWithStats = doctors.map(doc => ({
        ...doc,
        stats: statsMap[doc.name] || { total: 0, pending: 0, scheduled: 0, completed: 0, cancelled: 0 }
      }));

      res.status(200).json({ success: true, doctors: doctorsWithStats });
    } catch (err) {
      next(err);
    }
  }

  static async addDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, specialty, phone, qualification, experience, consultationFee } = req.body;

      const existingUser = await db.users.findOne({ email });
      if (existingUser) {
        res.status(400).json({ error: "Doctor account already exists with this email." });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await db.users.create({
        email,
        password: hashedPassword,
        role: "doctor"
      });

      const doctor = await db.doctors.create({
        name,
        email,
        specialty,
        phone,
        qualification,
        experience,
        consultationFee,
        status: "active"
      });

      res.status(201).json({ success: true, doctor });
    } catch (err) {
      next(err);
    }
  }
  static async updateStatus(req: any, res: Response, next: NextFunction): Promise<void> {
    console.log("REQ.USER =", req.user);
    try {
      // Admin check
      if (req.user?.role !== "admin") {
        res.status(403).json({ error: "Forbidden: Only administrators can modify doctor status." });
        return;
      }

      const { id } = req.params;
      const { status } = req.body;

      if (status !== "active" && status !== "inactive") {
        res.status(400).json({ error: "Invalid status value." });
        return;
      }

      const doctor = await db.doctors.findById(id);
      if (!doctor) {
        res.status(404).json({ error: "Doctor not found." });
        return;
      }

      // Prevent deactivating last active doctor
      if (status === "inactive" && doctor.status === "active") {
        const activeDoctors = await db.doctors.find({ status: "active" });
        if (activeDoctors.length <= 1) {
          res.status(400).json({ error: "At least one active doctor must remain in the system." });
          return;
        }
      }

      const updated = await db.doctors.findByIdAndUpdate(id, { status });
      res.status(200).json({ success: true, doctor: updated });
    } catch (err) {
      next(err);
    }
  }

  static async updateDoctor(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== "admin") {
        res.status(403).json({ error: "Forbidden: Only administrators can modify doctor profiles." });
        return;
      }

      const { id } = req.params;
      const { name, specialty, phone, qualification, experience, consultationFee, status } = req.body;

      const doctor = await db.doctors.findById(id);
      if (!doctor) {
        res.status(404).json({ error: "Doctor not found." });
        return;
      }

      if (status === "inactive" && doctor.status === "active") {
        const activeDoctors = await db.doctors.find({ status: "active" });
        if (activeDoctors.length <= 1) {
          res.status(400).json({ error: "At least one active doctor must remain in the system." });
          return;
        }
      }

      const updated = await db.doctors.findByIdAndUpdate(id, {
        name, specialty, phone, qualification, experience, consultationFee, status
      });
      res.status(200).json({ success: true, doctor: updated });
    } catch (err) {
      next(err);
    }
  }
}
export default DoctorController;
