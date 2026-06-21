import { Response, NextFunction } from "express";
import { AppointmentService } from "../services/appointment.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export class AppointmentController {
  static async bookAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await AppointmentService.bookAppointment(req.body);
      res.status(201).json({ success: true, appointment });
    } catch (err) {
      next(err);
    }
  }

  static async getAppointments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status, doctor } = req.query;

      const list = await AppointmentService.getAppointments({
        search: search as string,
        status: status as string,
        doctor: doctor as string,
      });

      res.status(200).json({ success: true, appointments: list });
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

      if (action !== "schedule" && action !== "cancel") {
        res.status(400).json({ error: "Invalid action type. Must be 'schedule' or 'cancel'" });
        return;
      }

      const updated = await AppointmentService.updateAppointmentStatus(id, action, {
        note,
        cancellationReason,
      });

      res.status(200).json({ success: true, appointment: updated });
    } catch (err) {
      next(err);
    }
  }
}
