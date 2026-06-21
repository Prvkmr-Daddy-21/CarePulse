import { db } from "../db/db";
import { patientSchema } from "../schemas/patient.schema";
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
}
export default PatientService;
