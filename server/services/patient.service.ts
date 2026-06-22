import { db } from "../db/db";
import { patientSchema, updatePatientSchema } from "../schemas/patient.schema";
import { IPatient } from "../models/types";

export class PatientService {
  static async registerPatient(userId: string, inputData: any, documentUrl: string): Promise<IPatient> {
    const validatedData = patientSchema.parse(inputData);

    const existingProfile = await db.patients.findOne({ userId });
    if (existingProfile) {
      throw { status: 409, message: "Patient profile already exists for this user account" };
    }

    const patient = await db.patients.create({
      userId,
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      birthDate: validatedData.birthDate,
      gender: validatedData.gender,
      address: validatedData.address,
      occupation: validatedData.occupation,
      emergencyContactName: validatedData.emergencyContactName,
      emergencyContactNumber: validatedData.emergencyContactNumber,
      insuranceProvider: validatedData.insuranceProvider,
      insurancePolicyNumber: validatedData.insurancePolicyNumber,
      primaryPhysician: validatedData.primaryPhysician,
      documentUrl,
      privacyConsent: validatedData.privacyConsent,
    });

    return patient;
  }

  static async getPatientProfile(userId: string): Promise<IPatient | null> {
    const profile = await db.patients.findOne({ userId });
    return profile;
  }

  static async getPatientById(id: string): Promise<IPatient | null> {
    const profile = await db.patients.findOne({ _id: id });
    return profile || await db.patients.findOne({ userId: id });
  }

  static async updatePatientProfile(userId: string, inputData: any): Promise<IPatient> {
    const validatedData = updatePatientSchema.parse(inputData);
    const patient = await db.patients.findOne({ userId });
    if (!patient) {
      throw { status: 404, message: "Patient profile not found to update" };
    }

    const updated = await db.patients.findByIdAndUpdate(patient._id, {
      phone: validatedData.phone,
      address: validatedData.address,
      occupation: validatedData.occupation,
      emergencyContactName: validatedData.emergencyContactName,
      emergencyContactNumber: validatedData.emergencyContactNumber,
    });

    if (!updated) {
      throw { status: 404, message: "Patient profile update failed" };
    }

    return updated;
  }
}
export default PatientService;
