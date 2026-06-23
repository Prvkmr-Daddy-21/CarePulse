import { db } from "../db/db";
import { appointmentSchema } from "../schemas/appointment.schema";
import { NotificationService } from "./notification.service";
import { IAppointment } from "../models/types";

export interface IAppointmentFilters {
  search?: string;
  status?: string;
  doctor?: string;
  doctorId?: string;
  page?: number;
  limit?: number;
}

export const APPOINTMENT_SLOT_DURATION = 60;
export const MAX_PATIENTS_PER_SLOT = 5;

export class AppointmentService {
  static async getAvailableSlots(doctor: string, date: string): Promise<string[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const doctorProfile = await db.doctors.findOne({ name: doctor });
    if (doctorProfile && doctorProfile.status !== "active") {
      return [];
    }
    const doctorId = doctorProfile ? doctorProfile._id : undefined;

    const allAppointments = await db.appointments.find();
    const bookedSlotCounts: Record<number, number> = {};

    allAppointments.forEach((a) => {
      const aDate = new Date(a.schedule);
      if (
        (a.status === "pending" || a.status === "scheduled" || a.status === "completed") &&
        aDate.getFullYear() === targetDate.getFullYear() &&
        aDate.getMonth() === targetDate.getMonth() &&
        aDate.getDate() === targetDate.getDate() &&
        (a.primaryPhysician === doctor || (doctorId && a.doctorId === doctorId))
      ) {
        const hour = aDate.getHours();
        bookedSlotCounts[hour] = (bookedSlotCounts[hour] || 0) + 1;
      }
    });

    const availableSlots: string[] = [];
    const now = new Date();

    for (let i = 9; i < 21; i++) {
      // Don't show slots in the past for today
      if (
        targetDate.getFullYear() === now.getFullYear() &&
        targetDate.getMonth() === now.getMonth() &&
        targetDate.getDate() === now.getDate() &&
        i <= now.getHours()
      ) {
        continue;
      }

      const count = bookedSlotCounts[i] || 0;
      if (count < MAX_PATIENTS_PER_SLOT) {
        availableSlots.push(`${i.toString().padStart(2, "0")}:00`);
      }
    }
    return availableSlots;
  }

  static async bookAppointment(inputData: any): Promise<IAppointment> {
    const validatedData = appointmentSchema.parse(inputData);

    const appointmentDate = new Date(validatedData.schedule);
    const now = new Date();
    console.log("RAW SCHEDULE:", validatedData.schedule);
    console.log("PARSED DATE:", appointmentDate);
    console.log("HOUR:", appointmentDate.getHours());
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

    const hour = appointmentDate.getHours();
    if (hour < 9 || hour >= 21) {
      throw {
        status: 400,
        message: "Appointments can only be booked between 9:00 AM and 9:00 PM.",
      };
    }

    const doctorProfile = await db.doctors.findOne({ name: validatedData.primaryPhysician });
    if (doctorProfile && doctorProfile.status !== "active") {
      throw {
        status: 400,
        message: "This doctor is not currently receiving new appointments.",
      };
    }
    const doctorId = doctorProfile ? doctorProfile._id : undefined;

    const existingAppointments = await db.appointments.find();

    const isPatientAlreadyBooked = existingAppointments.some(a =>
      a.patientId === validatedData.patientId &&
      (a.status === "pending" || a.status === "scheduled" || a.status === "completed") &&
      new Date(a.schedule).getTime() === appointmentDate.getTime() &&
      (a.primaryPhysician === validatedData.primaryPhysician || (doctorId && a.doctorId === doctorId))
    );

    if (isPatientAlreadyBooked) {
      throw { status: 400, message: "You already have an appointment with this doctor at this time." };
    }

    const bookedCount = existingAppointments.filter(a =>
      (a.status === "pending" || a.status === "scheduled" || a.status === "completed") &&
      new Date(a.schedule).getTime() === appointmentDate.getTime() &&
      (a.primaryPhysician === validatedData.primaryPhysician || (doctorId && a.doctorId === doctorId))
    ).length;

    if (bookedCount >= MAX_PATIENTS_PER_SLOT) {
      throw { status: 400, message: "This slot is fully booked. Please choose another available slot." };
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
      doctorId: doctorId,
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

  static async getAppointments(filters: IAppointmentFilters = {}): Promise<{ appointments: IAppointment[], total: number, page: number, totalPages: number, stats: any }> {
    let list = await db.appointments.find();

    // Context filter (Doctor or Admin)
    if (filters.doctorId) {
      list = list.filter(a => a.doctorId === filters.doctorId || a.primaryPhysician === filters.doctor);
    } else if (filters.doctor && filters.doctor !== "all") {
      list = list.filter(a => a.primaryPhysician.toLowerCase().includes(filters.doctor!.toLowerCase()));
    }

    // Calculate global stats for this context
    const stats = {
      total: list.length,
      pending: list.filter(a => a.status === "pending").length,
      scheduled: list.filter(a => a.status === "scheduled").length,
      completed: list.filter(a => a.status === "completed").length,
      cancelled: list.filter(a => a.status === "cancelled").length
    };

    // Apply status and search filters
    if (filters.status && filters.status !== "all") {
      list = list.filter(a => a.status === filters.status);
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

    // Server-side sorting: newest first
    list.sort((a, b) => new Date(b.schedule).getTime() - new Date(a.schedule).getTime());

    const total = list.length;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;

    const paginatedList = list.slice(startIndex, startIndex + limit);

    return {
      appointments: paginatedList,
      total,
      page,
      totalPages,
      stats
    };
  }

  static async updateAppointmentStatus(
    id: string,
    action: "schedule" | "cancel" | "complete",
    data: { note?: string; cancellationReason?: string }
  ): Promise<IAppointment> {
    const appointment = await db.appointments.findById(id);
    if (!appointment) {
      throw { status: 404, message: "Appointment record not found" };
    }

    const updatePayload: Partial<IAppointment> = {};
    let notificationType: "confirmed" | "cancelled" | "completed";

    if (action === "schedule") {
      updatePayload.status = "scheduled";
      updatePayload.note = data.note || "";
      updatePayload.cancellationReason = "";
      notificationType = "confirmed";
    } else if (action === "complete") {
      updatePayload.status = "completed";
      updatePayload.note = data.note || "";
      notificationType = "completed";
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
    console.log("appointmentDate =", appointmentDate);
    console.log("hour =", appointmentDate.getHours());
    const hour = appointmentDate.getHours();
    if (hour < 9 || hour >= 21) {
      throw {
        status: 400,
        message: "Appointments can only be booked between 9:00 AM and 9:00 PM.",
      };
    }

    const appointment = await db.appointments.findById(id);
    if (!appointment) {
      throw { status: 404, message: "Appointment record not found" };
    }

    const existingAppointments = await db.appointments.find();

    const isPatientAlreadyBooked = existingAppointments.some(a =>
      a._id !== id &&
      a.patientId === appointment.patientId &&
      (a.status === "pending" || a.status === "scheduled" || a.status === "completed") &&
      new Date(a.schedule).getTime() === appointmentDate.getTime() &&
      (a.primaryPhysician === appointment.primaryPhysician || (a.doctorId && a.doctorId === appointment.doctorId))
    );

    if (isPatientAlreadyBooked) {
      throw { status: 400, message: "You already have an appointment with this doctor at this time." };
    }

    const bookedCount = existingAppointments.filter(a =>
      a._id !== id &&
      (a.status === "pending" || a.status === "scheduled" || a.status === "completed") &&
      new Date(a.schedule).getTime() === appointmentDate.getTime() &&
      (a.primaryPhysician === appointment.primaryPhysician || (a.doctorId && a.doctorId === appointment.doctorId))
    ).length;

    if (bookedCount >= MAX_PATIENTS_PER_SLOT) {
      throw { status: 400, message: "This slot is fully booked. Please choose another available slot." };
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
