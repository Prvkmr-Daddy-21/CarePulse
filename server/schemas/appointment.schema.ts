import { z } from "zod";

export const appointmentSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  primaryPhysician: z.string().min(1, "Physician name is required"),
  schedule: z.string().or(z.date()).transform((val) => new Date(val)),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  status: z.enum(["pending", "scheduled", "cancelled"]).default("pending"),
  note: z.string().optional(),
  cancellationReason: z.string().optional(),
});
