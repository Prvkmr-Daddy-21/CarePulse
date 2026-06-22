import { Response, NextFunction } from "express";
import { AppointmentService } from "../services/appointment.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { db } from "../db/db";

export class AppointmentController {
  static async bookAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await AppointmentService.bookAppointment(req.body);
      res.status(201).json({ success: true, appointment });
    } catch (err) {
      next(err);
    }
  }

  static async getAvailableSlots(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctor, date } = req.query;
      if (!doctor || !date) {
        res.status(400).json({ error: "doctor and date parameters are required" });
        return;
      }

      const slots = await AppointmentService.getAvailableSlots(doctor as string, date as string);
      res.status(200).json({ success: true, availableSlots: slots });
    } catch (err) {
      next(err);
    }
  }

  static async getAppointments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status, doctor, page, limit } = req.query;

      let doctorIdFilter: string | undefined = undefined;
      let doctorNameFilter: string | undefined = doctor as string;

      if (req.user?.role === "doctor") {
        const doctorProfile = await db.doctors.findOne({ email: req.user.email });
        if (doctorProfile) {
          doctorIdFilter = doctorProfile._id.toString();
          doctorNameFilter = doctorProfile.name; // Fallback for old records
        } else {
          res.status(403).json({ error: "Doctor profile not found" });
          return;
        }
      }

      const result = await AppointmentService.getAppointments({
        search: search as string,
        status: status as string,
        doctor: doctorNameFilter,
        doctorId: doctorIdFilter,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      res.status(200).json({ 
        success: true, 
        appointments: result.appointments,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        stats: result.stats
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMyAppointments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const list = await AppointmentService.getPatientAppointments(req.params.patientId);
      res.status(200).json({ success: true, appointments: list });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { action } = req.query; // "schedule" or "cancel"
      const { note, cancellationReason } = req.body;

      if (action !== "schedule" && action !== "cancel" && action !== "complete") {
        res.status(400).json({ error: "Invalid action type. Must be 'schedule', 'cancel', or 'complete'" });
        return;
      }

      const updated = await AppointmentService.updateAppointmentStatus(id, action as "schedule" | "cancel" | "complete", {
        note,
        cancellationReason,
      });

      res.status(200).json({ success: true, appointment: updated });
    } catch (err) {
      next(err);
    }
  }

  static async reschedule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { schedule, note } = req.body;
      if (!schedule) {
        res.status(400).json({ error: "Schedule date/time is required" });
        return;
      }
      const updated = await AppointmentService.rescheduleAppointment(id, {
        schedule: new Date(schedule),
        note,
      });
      res.status(200).json({ success: true, appointment: updated });
    } catch (err) {
      next(err);
    }
  }
}
