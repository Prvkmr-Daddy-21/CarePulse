export interface IUser {
  _id: string;
  email: string;
  password?: string;
  role: "admin" | "patient" | "doctor";
  resetPasswordToken?: string | null;
  resetPasswordExpire?: Date | null;
  createdAt?: Date;
}

export interface IDoctor {
  _id: string;
  name: string;
  email: string;
  specialty: string;
  phone: string;
  avatarUrl?: string;
  status: "active" | "inactive";
  qualification?: string;
  experience?: number;
}

export interface IPatient {
  _id: string;
  userId: string; // Ref User login account
  name: string;
  email: string;
  phone: string;
  birthDate: Date;
  gender: "male" | "female" | "other";
  address: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  primaryPhysician: string; // Doctor name or doctor ID
  documentUrl?: string;
  privacyConsent: boolean;
  createdAt?: Date;
}

export interface IAppointment {
  _id: string;
  patientId: string; // Ref Patient ID
  patientName: string; // Cache patient details for fast listing
  patientPhone: string;
  primaryPhysician: string; // Doctor name
  doctorId?: string; // Reference to Doctor for security
  schedule: Date;
  reason: string;
  status: "pending" | "scheduled" | "cancelled" | "completed";
  note?: string;
  cancellationReason?: string;
  createdAt?: Date;
}
