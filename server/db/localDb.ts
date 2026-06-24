import fs from "fs";
import path from "path";
import { IUser, IDoctor, IPatient, IAppointment, IBloodDonor, IBloodRequest } from "../models/types";

const UPLOADS_DIR = path.join(process.cwd(), "server", "uploads");
const DB_FILE = path.join(UPLOADS_DIR, "db.json");

interface ILocalSchema {
  users: IUser[];
  doctors: IDoctor[];
  patients: IPatient[];
  appointments: IAppointment[];
  bloodDonors: IBloodDonor[];
  bloodRequests: IBloodRequest[];
}

const DEFAULT_DOCTORS: IDoctor[] = [];

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
      appointments: [],
      bloodDonors: [],
      bloodRequests: []
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
      appointments: [],
      bloodDonors: [],
      bloodRequests: []
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
    },
    findByIdAndUpdate: async (id: string, update: Partial<IUser>) => {
      const db = readDb();
      const index = db.users.findIndex(u => u._id === id);
      if (index === -1) return null;
      db.users[index] = { ...db.users[index], ...update };
      writeDb(db);
      return db.users[index];
    },
    findByIdAndDelete: async (id: string) => {
      const db = readDb();
      const index = db.users.findIndex(u => u._id === id);
      if (index === -1) return null;
      const deleted = db.users.splice(index, 1)[0];
      writeDb(db);
      return deleted;
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
    },
    findByIdAndUpdate: async (id: string, update: Partial<IDoctor>) => {
      const db = readDb();
      const index = db.doctors.findIndex(d => d._id === id);
      if (index === -1) return null;
      db.doctors[index] = { ...db.doctors[index], ...update };
      writeDb(db);
      return db.doctors[index];
    },
    findByIdAndDelete: async (id: string) => {
      const db = readDb();
      const index = db.doctors.findIndex(d => d._id === id);
      if (index === -1) return null;
      const deleted = db.doctors.splice(index, 1)[0];
      writeDb(db);
      return deleted;
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
  },

  // Blood Donors Queries
  bloodDonors: {
    find: async (query?: Partial<IBloodDonor>) => {
      const db = readDb();
      if (!query) return db.bloodDonors;
      return db.bloodDonors.filter(a => Object.entries(query).every(([k, v]) => (a as any)[k] === v));
    },
    findOne: async (query: Partial<IBloodDonor>) => {
      const db = readDb();
      return db.bloodDonors.find(a => Object.entries(query).every(([k, v]) => (a as any)[k] === v)) || null;
    },
    findById: async (id: string) => {
      const db = readDb();
      return db.bloodDonors.find(a => a._id === id) || null;
    },
    create: async (data: Omit<IBloodDonor, "_id" | "createdAt">) => {
      const db = readDb();
      const newDonor: IBloodDonor = {
        ...data,
        _id: `bd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date()
      };
      db.bloodDonors.push(newDonor);
      writeDb(db);
      return newDonor;
    },
    findByIdAndUpdate: async (id: string, update: Partial<IBloodDonor>) => {
      const db = readDb();
      const index = db.bloodDonors.findIndex(a => a._id === id);
      if (index === -1) return null;
      db.bloodDonors[index] = { ...db.bloodDonors[index], ...update };
      writeDb(db);
      return db.bloodDonors[index];
    }
  },

  // Blood Requests Queries
  bloodRequests: {
    find: async (query?: Partial<IBloodRequest>) => {
      const db = readDb();
      if (!query) return db.bloodRequests;
      return db.bloodRequests.filter(a => Object.entries(query).every(([k, v]) => (a as any)[k] === v));
    },
    findOne: async (query: Partial<IBloodRequest>) => {
      const db = readDb();
      return db.bloodRequests.find(a => Object.entries(query).every(([k, v]) => (a as any)[k] === v)) || null;
    },
    findById: async (id: string) => {
      const db = readDb();
      return db.bloodRequests.find(a => a._id === id) || null;
    },
    create: async (data: Omit<IBloodRequest, "_id" | "createdAt">) => {
      const db = readDb();
      const newReq: IBloodRequest = {
        ...data,
        _id: `br_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date()
      };
      db.bloodRequests.push(newReq);
      writeDb(db);
      return newReq;
    },
    findByIdAndUpdate: async (id: string, update: Partial<IBloodRequest>) => {
      const db = readDb();
      const index = db.bloodRequests.findIndex(a => a._id === id);
      if (index === -1) return null;
      db.bloodRequests[index] = { ...db.bloodRequests[index], ...update };
      writeDb(db);
      return db.bloodRequests[index];
    }
  }
};
