import { z } from "zod";

export const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  birthDate: z.preprocess(
    (val) => {
      if (!val) return undefined;
      return typeof val === "string" || val instanceof Date ? new Date(val) : val;
    },
    z.date({ message: "Invalid birth date" })
  ),
  gender: z.enum(["male", "female", "other"]),
  address: z.string().min(5, "Address must be at least 5 characters"),
  occupation: z.string().min(2, "Occupation must be at least 2 characters"),
  emergencyContactName: z.string().min(2, "Emergency contact name must be at least 2 characters"),
  emergencyContactNumber: z.string().min(8, "Emergency contact number must be at least 8 digits"),
  insuranceProvider: z.string().min(2, "Insurance provider required"),
  insurancePolicyNumber: z.string().min(2, "Insurance policy number required"),
  primaryPhysician: z.string().min(2, "Please select a primary physician"),
  privacyConsent: z.preprocess(
    (val) => {
      if (typeof val === "string") return val === "true";
      return val;
    },
    z.boolean().refine((val) => val === true, {
      message: "You must consent to privacy terms",
    })
  ),
});

export const updatePatientSchema = z.object({
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  occupation: z.string().min(2, "Occupation must be at least 2 characters"),
  emergencyContactName: z.string().min(2, "Emergency contact name must be at least 2 characters"),
  emergencyContactNumber: z.string().min(8, "Emergency contact number must be at least 8 digits"),
});

