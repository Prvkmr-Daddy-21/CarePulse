import { db } from "../db/db";
import { appointmentSchema } from "../schemas/appointment.schema";
import { NotificationService } from "./notification.service";
import { IAppointment } from "../models/types";

export interface IAppointmentFilters {
  search?: string;
  status?: string;
  doctor?: string;
}

export class AppointmentService {
  static async bookAppointment(inputData: any): Promise<IAppointment> {
    const validatedData = appointmentSchema.parse(inputData);

    const appointmentDate = new Date(validatedData.schedule);
    const now = new Date();

    if (appointmentDate < now) {
      throw {
        status: 400,
        message: "Appointment date cannot be in the past",
      };
    }

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);

    if (appointmentDate > maxDate) {
      throw {
        status: 400,
        message: "Appointments can only be booked within 6 months",
      };
    }

    const patient = await db.patients.findById(validatedData.patientId);
    if (!patient) {
      throw { status: 404, message: "Patient profile not found for booking" };
    }

    const appointment = await db.appointments.create({
      patientId: validatedData.patientId,
      patientName: patient.name,
      patientPhone: patient.phone,
      primaryPhysician: validatedData.primaryPhysician,
      schedule: validatedData.schedule,
      reason: validatedData.reason,
      status: validatedData.status || "pending",
      note: validatedData.note || "",
      cancellationReason: "",
    });

    // Send email alert asynchronously
    try {
      await NotificationService.sendAppointmentEmail({
        email: patient.email,
        patientName: patient.name,
        doctorName: validatedData.primaryPhysician,
        schedule: validatedData.schedule,
        type: "booked",
      });
    } catch (err) {
      console.error("Failed to trigger email notification", err);
    }

    return appointment;
  }

  static async getAppointments(filters: IAppointmentFilters = {}): Promise<IAppointment[]> {
    let list = await db.appointments.find();

    // Filtering logic (fully type-safe and case-insensitive)
    if (filters.status && filters.status !== "all") {
      list = list.filter(a => a.status === filters.status);
    }

    if (filters.doctor && filters.doctor !== "all") {
      list = list.filter(a => a.primaryPhysician.toLowerCase().includes(filters.doctor!.toLowerCase()));
    }

    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(a =>
        a.patientName.toLowerCase().includes(s) ||
        a.patientPhone.includes(s) ||
        a.reason.toLowerCase().includes(s) ||
        (a.note && a.note.toLowerCase().includes(s))
      );
    }

    return list;
  }

  static async updateAppointmentStatus(
    id: string,
    action: "schedule" | "cancel",
    data: { note?: string; cancellationReason?: string }
  ): Promise<IAppointment> {
    const appointment = await db.appointments.findById(id);
    if (!appointment) {
      throw { status: 404, message: "Appointment record not found" };
    }

    const updatePayload: Partial<IAppointment> = {};
    let notificationType: "confirmed" | "cancelled";

    if (action === "schedule") {
      updatePayload.status = "scheduled";
      updatePayload.note = data.note || "";
      updatePayload.cancellationReason = "";
      notificationType = "confirmed";
    } else {
      updatePayload.status = "cancelled";
      updatePayload.cancellationReason = data.cancellationReason || "No rationale provided by hospital management.";
      notificationType = "cancelled";
    }

    const updated = await db.appointments.findByIdAndUpdate(id, updatePayload);
    if (!updated) {
      throw { status: 404, message: "Appointment update error" };
    }

    // Trigger email alert asynchronously
    const patientProfile = await db.patients.findById(updated.patientId);
    if (patientProfile) {
      try {
        await NotificationService.sendAppointmentEmail({
          email: patientProfile.email,
          patientName: patientProfile.name,
          doctorName: updated.primaryPhysician,
          schedule: updated.schedule,
          type: notificationType,
          note: updatePayload.note,
          cancellationReason: updatePayload.cancellationReason,
        });
      } catch (err) {
        console.error("Failed to trigger status update email notification", err);
      }
    }

    return updated;
  }

  static async getPatientAppointments(patientId: string): Promise<IAppointment[]> {
    return await db.appointments.find({ patientId });
  }

  static async rescheduleAppointment(
    id: string,
    data: { schedule: Date; note?: string }
  ): Promise<IAppointment> {

    const appointmentDate = new Date(data.schedule);

    if (appointmentDate < new Date()) {
      throw {
        status: 400,
        message: "Cannot reschedule appointment to a past date",
      };
    }

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);

    if (appointmentDate > maxDate) {
      throw {
        status: 400,
        message: "Appointments can only be rescheduled within 6 months",
      };
    }

    const appointment = await db.appointments.findById(id);
    if (!appointment) {
      throw { status: 404, message: "Appointment record not found" };
    }

    const updatePayload: Partial<IAppointment> = {
      schedule: data.schedule,
      status: "scheduled",
    };
    if (data.note !== undefined) {
      updatePayload.note = data.note;
    }

    const updated = await db.appointments.findByIdAndUpdate(id, updatePayload);
    if (!updated) {
      throw { status: 404, message: "Appointment reschedule error" };
    }

    // Trigger email alert asynchronously
    const patientProfile = await db.patients.findById(updated.patientId);
    if (patientProfile) {
      try {
        await NotificationService.sendAppointmentEmail({
          email: patientProfile.email,
          patientName: patientProfile.name,
          doctorName: updated.primaryPhysician,
          schedule: data.schedule,
          type: "rescheduled",
          note: data.note,
        });
      } catch (err) {
        console.error("Failed to trigger reschedule email notification", err);
      }
    }

    return updated;
  }
}
export default AppointmentService;
