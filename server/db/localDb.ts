import fs from "fs";
import path from "path";
import { IUser, IDoctor, IPatient, IAppointment } from "../models/types";

const UPLOADS_DIR = path.join(process.cwd(), "server", "uploads");
const DB_FILE = path.join(UPLOADS_DIR, "db.json");

interface ILocalSchema {
  users: IUser[];
  doctors: IDoctor[];
  patients: IPatient[];
  appointments: IAppointment[];
}

const DEFAULT_DOCTORS: IDoctor[] = [
  { _id: "doc1", name: "Dr. Catherine Green", email: "green@healthcare.com", specialty: "Cardiologist", phone: "+1 (555) 019-2834", status: "active" },
  { _id: "doc2", name: "Dr. Alexander Smith", email: "smith@healthcare.com", specialty: "Dermatologist", phone: "+1 (555) 012-3850", status: "active" },
  { _id: "doc3", name: "Dr. Jasmine Johnson", email: "johnson@healthcare.com", specialty: "Pediatrician", phone: "+1 (555) 014-9922", status: "active" },
  { _id: "doc4", name: "Dr. Robert Adams", email: "adams@healthcare.com", specialty: "Neurologist", phone: "+1 (555) 017-7489", status: "active" }
];

function ensureDirectoryExistence() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function readDb(): ILocalSchema {
  ensureDirectoryExistence();
  if (!fs.existsSync(DB_FILE)) {
    const fresh: ILocalSchema = {
      users: [],
      doctors: DEFAULT_DOCTORS,
      patients: [],
      appointments: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2));
    return fresh;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Local database corrupted, resetting to defaults", e);
    const fresh: ILocalSchema = {
      users: [],
      doctors: DEFAULT_DOCTORS,
      patients: [],
      appointments: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2));
    return fresh;
  }
}

function writeDb(data: ILocalSchema) {
  ensureDirectoryExistence();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export const localDb = {
  // Users Queries
  users: {
    find: async (query?: Partial<IUser>) => {
      const db = readDb();
      if (!query) return db.users;
      return db.users.filter(u => Object.entries(query).every(([k, v]) => (u as any)[k] === v));
    },
    findOne: async (query: Partial<IUser>) => {
      const db = readDb();
      return db.users.find(u => Object.entries(query).every(([k, v]) => (u as any)[k] === v)) || null;
    },
    findById: async (id: string) => {
      const db = readDb();
      return db.users.find(u => u._id === id) || null;
    },
    create: async (data: Omit<IUser, "_id" | "createdAt">) => {
      const db = readDb();
      const newUser: IUser = {
        ...data,
        _id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date()
      };
      db.users.push(newUser);
      writeDb(db);
      return newUser;
    }
  },

  // Doctors Queries
  doctors: {
    find: async (query?: Partial<IDoctor>) => {
      const db = readDb();
      if (!query) return db.doctors;
      return db.doctors.filter(d => Object.entries(query).every(([k, v]) => (d as any)[k] === v));
    },
    findOne: async (query: Partial<IDoctor>) => {
      const db = readDb();
      return db.doctors.find(d => Object.entries(query).every(([k, v]) => (d as any)[k] === v)) || null;
    },
    findById: async (id: string) => {
      const db = readDb();
      return db.doctors.find(d => d._id === id) || null;
    },
    create: async (data: Omit<IDoctor, "_id">) => {
      const db = readDb();
      const newDoc: IDoctor = {
        ...data,
        _id: `doc_${Date.now()}`
      };
      db.doctors.push(newDoc);
      writeDb(db);
      return newDoc;
    }
  },

  // Patients Queries
  patients: {
    find: async (query?: Partial<IPatient>) => {
      const db = readDb();
      if (!query) return db.patients;
      return db.patients.filter(p => Object.entries(query).every(([k, v]) => {
        if (k === "birthDate" && v instanceof Date) {
          return new Date(p.birthDate).getTime() === v.getTime();
        }
        return (p as any)[k] === v;
      }));
    },
    findOne: async (query: Partial<IPatient>) => {
      const db = readDb();
      return db.patients.find(p => Object.entries(query).every(([k, v]) => {
        if (k === "birthDate" && v instanceof Date) {
          return new Date(p.birthDate).getTime() === v.getTime();
        }
        return (p as any)[k] === v;
      })) || null;
    },
    findById: async (id: string) => {
      const db = readDb();
      return db.patients.find(p => p._id === id) || null;
    },
    create: async (data: Omit<IPatient, "_id" | "createdAt">) => {
      const db = readDb();
      const newPatient: IPatient = {
        ...data,
        _id: `pat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date()
      };
      db.patients.push(newPatient);
      writeDb(db);
      return newPatient;
    },
    findByIdAndUpdate: async (id: string, update: Partial<IPatient>) => {
      const db = readDb();
      const index = db.patients.findIndex(p => p._id === id);
      if (index === -1) return null;
      db.patients[index] = { ...db.patients[index], ...update };
      writeDb(db);
      return db.patients[index];
    }
  },

  // Appointments Queries
  appointments: {
    find: async (query?: Partial<IAppointment>) => {
      const db = readDb();
      if (!query) return db.appointments;
      return db.appointments.filter(a => Object.entries(query).every(([k, v]) => {
        if (k === "schedule" && v instanceof Date) {
          return new Date(a.schedule).getTime() === v.getTime();
        }
        return (a as any)[k] === v;
      }));
    },
    findOne: async (query: Partial<IAppointment>) => {
      const db = readDb();
      return db.appointments.find(a => Object.entries(query).every(([k, v]) => (a as any)[k] === v)) || null;
    },
    findById: async (id: string) => {
      const db = readDb();
      return db.appointments.find(a => a._id === id) || null;
    },
    create: async (data: Omit<IAppointment, "_id" | "createdAt">) => {
      const db = readDb();
      const newAppointment: IAppointment = {
        ...data,
        _id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date()
      };
      db.appointments.push(newAppointment);
      writeDb(db);
      return newAppointment;
    },
    findByIdAndUpdate: async (id: string, update: Partial<IAppointment>) => {
      const db = readDb();
      const index = db.appointments.findIndex(a => a._id === id);
      if (index === -1) return null;
      db.appointments[index] = { ...db.appointments[index], ...update };
      writeDb(db);
      return db.appointments[index];
    }
  }
};
