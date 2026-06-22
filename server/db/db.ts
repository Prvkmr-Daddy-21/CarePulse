import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { localDb } from "./localDb";
import { UserModel, DoctorModel, PatientModel, AppointmentModel } from "../models/mongoose.models";
import { IUser, IDoctor, IPatient, IAppointment } from "../models/types";

let isMongoConnected = false;

const DEFAULT_DOCTORS: Omit<IDoctor, "_id">[] = [
  { name: "Dr. Catherine Green", email: "green@healthcare.com", specialty: "Cardiologist", phone: "+1 (555) 019-2834", status: "active" },
  { name: "Dr. Jasmine Johnson", email: "johnson@healthcare.com", specialty: "Pediatrician", phone: "+1 (555) 014-9922", status: "active" },
  { name: "Dr. Alexander Smith", email: "smith@healthcare.com", specialty: "Dermatologist", phone: "+1 (555) 012-3850", status: "active" },
  { name: "Dr. Robert Adams", email: "adams@healthcare.com", specialty: "Neurologist", phone: "+1 (555) 017-7489", status: "active" }
];

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL CONFIGURATION ERROR: MONGODB_URI is not set in environment in production. System startup aborted.");
    }
    console.log("------------------------------------------------------------------");
    console.log("ℹ️ MONGODB_URI not found in environment. Fallback to local JSON-file DB.");
    console.log("📁 Data will persist in /server/uploads/db.json");
    console.log("------------------------------------------------------------------");
    await seedLocalDbDefaultCredentials();
    return false;
  }

  if (isMongoConnected) return true;

  try {
    mongoose.set('bufferCommands', false); // CRITICAL: fail fast, don't hang in AI Studio
    await mongoose.connect(mongoUri);
    isMongoConnected = true;
    console.log("✅ Successfully connected to MongoDB Atlas via Mongoose!");

    // Seed default doctors if database is empty
    const docCount = await DoctorModel.countDocuments();
    if (docCount === 0) {
      await DoctorModel.insertMany(DEFAULT_DOCTORS as any);
      console.log("🌱 Seeded initial doctor profiles in MongoDB");
    }

    // Seed default admin specifically by email to prevent silent exclusions if other users already exist
    const existingAdmin = await UserModel.findOne({ email: "specialist@carepulse.com" } as any);
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await UserModel.create({
        email: "specialist@carepulse.com",
        password: hashedPassword,
        role: "admin"
      });
      console.log("🌱 Seeded default admin specialist account in MongoDB");
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB Atlas:", error);
    if (process.env.NODE_ENV === "production") {
      throw new Error(`CRITICAL RUNTIME ERROR: MongoDB connection failed in production: ${(error as Error).message}`);
    }
    console.log("⚠️ Falling back to local JSON-file DB to keep the system running gracefully.");
    await seedLocalDbDefaultCredentials();
    return false;
  }
}

async function seedLocalDbDefaultCredentials() {
  try {
    const adminUser = await localDb.users.findOne({ email: "specialist@carepulse.com" });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await localDb.users.create({
        email: "specialist@carepulse.com",
        password: hashedPassword,
        role: "admin"
      });
      console.log("🌱 Seeded default admin specialist account in Local JSON DB");
    }
  } catch (err) {
    console.error("⚠️ Local DB default credentials seeding warning:", err);
  }
}

// Convert Mongoose Document to standard JS objects for type compliance
function toJSON<T>(doc: any): T {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  if (obj._id) obj._id = obj._id.toString();
  return obj as T;
}

function assertMongoDBConnection() {
  if (!isMongoConnected && process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL ERROR: Local JSON fallback storage is strictly disabled in production. MongoDB configuration is required.");
  }
}

export const db = {
  get isConnected() {
    return isMongoConnected;
  },

  users: {
    find: async (query?: Partial<IUser>): Promise<IUser[]> => {
      if (isMongoConnected) {
        const users = await UserModel.find((query || {}) as any);
        return users.map(u => toJSON<IUser>(u));
      }
      assertMongoDBConnection();
      return localDb.users.find(query);
    },
    findOne: async (query: Partial<IUser>): Promise<IUser | null> => {
      if (isMongoConnected) {
        const user = await UserModel.findOne(query as any);
        return user ? toJSON<IUser>(user) : null;
      }
      assertMongoDBConnection();
      return localDb.users.findOne(query);
    },
    findById: async (id: string): Promise<IUser | null> => {
      if (isMongoConnected) {
        try {
          const user = await UserModel.findOne({ _id: id } as any);
          return user ? toJSON<IUser>(user) : null;
        } catch {
          return null;
        }
      }
      assertMongoDBConnection();
      return localDb.users.findById(id);
    },
    create: async (data: Omit<IUser, "_id" | "createdAt">): Promise<IUser> => {
      if (isMongoConnected) {
        const user = await UserModel.create(data);
        return toJSON<IUser>(user);
      }
      assertMongoDBConnection();
      return localDb.users.create(data);
    },
    findByIdAndUpdate: async (id: string, update: Partial<IUser>): Promise<IUser | null> => {
      if (isMongoConnected) {
        try {
          const user = await UserModel.findByIdAndUpdate(id as any, { $set: update } as any, { new: true } as any);
          return user ? toJSON<IUser>(user) : null;
        } catch {
          return null;
        }
      }
      assertMongoDBConnection();
      return localDb.users.findByIdAndUpdate(id, update);
    }
  },

  doctors: {
    find: async (query?: Partial<IDoctor>): Promise<IDoctor[]> => {
      if (isMongoConnected) {
        const docs = await DoctorModel.find((query || {}) as any);
        return docs.map(d => toJSON<IDoctor>(d));
      }
      assertMongoDBConnection();
      return localDb.doctors.find(query);
    },
    findOne: async (query: Partial<IDoctor>): Promise<IDoctor | null> => {
      if (isMongoConnected) {
        const doc = await DoctorModel.findOne(query as any);
        return doc ? toJSON<IDoctor>(doc) : null;
      }
      assertMongoDBConnection();
      return localDb.doctors.findOne(query);
    },
    findById: async (id: string): Promise<IDoctor | null> => {
      if (isMongoConnected) {
        try {
          const doc = await DoctorModel.findOne({ _id: id } as any);
          return doc ? toJSON<IDoctor>(doc) : null;
        } catch {
          return null;
        }
      }
      assertMongoDBConnection();
      return localDb.doctors.findById(id);
    },
    create: async (data: Omit<IDoctor, "_id">): Promise<IDoctor> => {
      if (isMongoConnected) {
        const doc = await DoctorModel.create(data);
        return toJSON<IDoctor>(doc);
      }
      assertMongoDBConnection();
      return localDb.doctors.create(data);
    }
  },

  patients: {
    find: async (query?: Partial<IPatient>): Promise<IPatient[]> => {
      if (isMongoConnected) {
        const patients = await PatientModel.find((query || {}) as any);
        return patients.map(p => toJSON<IPatient>(p));
      }
      assertMongoDBConnection();
      return localDb.patients.find(query);
    },
    findOne: async (query: Partial<IPatient>): Promise<IPatient | null> => {
      if (isMongoConnected) {
        const patient = await PatientModel.findOne(query as any);
        return patient ? toJSON<IPatient>(patient) : null;
      }
      assertMongoDBConnection();
      return localDb.patients.findOne(query);
    },
    findById: async (id: string): Promise<IPatient | null> => {
      if (isMongoConnected) {
        try {
          const patient = await PatientModel.findOne({ _id: id } as any);
          return patient ? toJSON<IPatient>(patient) : null;
        } catch {
          return null;
        }
      }
      assertMongoDBConnection();
      return localDb.patients.findById(id);
    },
    create: async (data: Omit<IPatient, "_id" | "createdAt">): Promise<IPatient> => {
      if (isMongoConnected) {
        const patient = await PatientModel.create(data as any);
        return toJSON<IPatient>(patient);
      }
      assertMongoDBConnection();
      return localDb.patients.create(data);
    },
    findByIdAndUpdate: async (id: string, update: Partial<IPatient>): Promise<IPatient | null> => {
      if (isMongoConnected) {
        try {
          const patient = await PatientModel.findByIdAndUpdate(id as any, { $set: update } as any, { new: true } as any);
          return patient ? toJSON<IPatient>(patient) : null;
        } catch {
          return null;
        }
      }
      assertMongoDBConnection();
      return localDb.patients.findByIdAndUpdate(id, update);
    }
  },

  appointments: {
    find: async (query?: Partial<IAppointment>): Promise<IAppointment[]> => {
      if (isMongoConnected) {
        const appointments = await AppointmentModel.find((query || {}) as any).sort({ schedule: 1 } as any);
        return appointments.map(a => toJSON<IAppointment>(a));
      }
      assertMongoDBConnection();
      return (await localDb.appointments.find(query)).sort(
        (a, b) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime()
      );
    },
    findOne: async (query: Partial<IAppointment>): Promise<IAppointment | null> => {
      if (isMongoConnected) {
        const appointment = await AppointmentModel.findOne(query as any);
        return appointment ? toJSON<IAppointment>(appointment) : null;
      }
      assertMongoDBConnection();
      return localDb.appointments.findOne(query);
    },
    findById: async (id: string): Promise<IAppointment | null> => {
      if (isMongoConnected) {
        try {
          const appointment = await AppointmentModel.findOne({ _id: id } as any);
          return appointment ? toJSON<IAppointment>(appointment) : null;
        } catch {
          return null;
        }
      }
      assertMongoDBConnection();
      return localDb.appointments.findById(id);
    },
    create: async (data: Omit<IAppointment, "_id" | "createdAt">): Promise<IAppointment> => {
      if (isMongoConnected) {
        const appointment = await AppointmentModel.create(data as any);
        return toJSON<IAppointment>(appointment);
      }
      assertMongoDBConnection();
      return localDb.appointments.create(data);
    },
    findByIdAndUpdate: async (id: string, update: Partial<IAppointment>): Promise<IAppointment | null> => {
      if (isMongoConnected) {
        try {
          const appointment = await AppointmentModel.findByIdAndUpdate(id as any, { $set: update } as any, { new: true } as any);
          return appointment ? toJSON<IAppointment>(appointment) : null;
        } catch {
          return null;
        }
      }
      assertMongoDBConnection();
      return localDb.appointments.findByIdAndUpdate(id, update);
    }
  }
};
