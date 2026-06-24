import mongoose, { Schema } from "mongoose";
import { IUser, IDoctor, IPatient, IAppointment } from "./types";

// User Schema
const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "patient", "doctor"], default: "patient", index: true },
  resetPasswordToken: { type: String, default: null, index: true },
  resetPasswordExpire: { type: Date, default: null },
}, { timestamps: true });

UserSchema.index({ email: 1, role: 1 });

export const UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// Doctor Schema
const DoctorSchema = new Schema<IDoctor>({
  name: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  specialty: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  qualification: { type: String },
  experience: { type: Schema.Types.Mixed }, // String or Number
  consultationFee: { type: Number },
  avatarUrl: { type: String },
  status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
});

DoctorSchema.index({ specialty: 1, status: 1 });

export const DoctorModel = mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", DoctorSchema);

// Patient Schema
const PatientSchema = new Schema<IPatient>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  birthDate: { type: Date, required: true },
  gender: { type: String, enum: ["male", "female", "other"], required: true },
  address: { type: String, required: true },
  occupation: { type: String, required: true },
  emergencyContactName: { type: String, required: true },
  emergencyContactNumber: { type: String, required: true },
  insuranceProvider: { type: String, required: true },
  insurancePolicyNumber: { type: String, required: true },
  primaryPhysician: { type: Schema.Types.Mixed, required: true, index: true }, // allow name or ObjectId
  documentUrl: { type: String },
  privacyConsent: { type: Boolean, required: true },
}, { timestamps: true });

PatientSchema.index({ userId: 1, email: 1 });
PatientSchema.index({ name: "text" }); // for clinical searches

export const PatientModel = mongoose.models.Patient || mongoose.model<IPatient>("Patient", PatientSchema);

// Appointment Schema
const AppointmentSchema = new Schema<IAppointment>({
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true, index: true },
  patientPhone: { type: String, required: true },
  primaryPhysician: { type: Schema.Types.Mixed, required: true, index: true }, // allow name or ObjectId
  doctorId: { type: String, index: true },
  schedule: { type: Date, required: true, index: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["pending", "scheduled", "cancelled", "completed"], default: "pending", index: true },
  note: { type: String },
  cancellationReason: { type: String },
}, { timestamps: true });

AppointmentSchema.index({ patientId: 1, status: 1 });
AppointmentSchema.index({ schedule: 1, status: 1 });

export const AppointmentModel = mongoose.models.Appointment || mongoose.model<IAppointment>("Appointment", AppointmentSchema);

const BloodDonorSchema = new Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  address: { type: String },
  bloodGroup: { type: String, required: true },
  lastDonationDate: { type: Date },
  status: { type: String, enum: ["eligible", "ineligible", "active", "inactive"], default: "eligible" },
  medicalConditions: { type: String },
}, { timestamps: true });

export const BloodDonorModel = mongoose.models.BloodDonor || mongoose.model("BloodDonor", BloodDonorSchema);

const BloodRequestSchema = new Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  unitsRequired: { type: Number, required: true },
  urgency: { type: String, enum: ["normal", "urgent", "critical"], default: "normal" },
  status: { type: String, enum: ["pending", "approved", "rejected", "fulfilled", "cancelled"], default: "pending" },
  hospitalName: { type: String },
  contactPhone: { type: String },
  requestDate: { type: Date, default: Date.now },
}, { timestamps: true });

export const BloodRequestModel = mongoose.models.BloodRequest || mongoose.model("BloodRequest", BloodRequestSchema);
