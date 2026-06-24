export interface IUser {
  _id: string;
  email: string;
  role: "admin" | "patient" | "doctor";
  createdAt?: string;
}

export interface IDoctor {
  _id: string;
  name: string;
  email: string;
  specialty: string;
  phone: string;
  qualification?: string;
  experience?: string | number;
  avatarUrl?: string;
  status: "active" | "inactive";
  stats?: {
    total: number;
    pending: number;
    scheduled: number;
    completed: number;
    cancelled: number;
  };
}

export interface IPatient {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: "male" | "female" | "other";
  address: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  primaryPhysician: string;
  documentUrl?: string;
  privacyConsent: boolean;
  createdAt?: string;
}

export interface IAppointment {
  _id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  primaryPhysician: string;
  doctorId?: string;
  schedule: string;
  reason: string;
  status: "pending" | "scheduled" | "cancelled" | "completed";
  note?: string;
  cancellationReason?: string;
  createdAt?: string;
}

const API_BASE = "/api";

// Auto-retrieve header authorization
function getHeaders(isMultipart = false): HeadersInit {
  const token = localStorage.getItem("MediConnect_token");
  const headers: Record<string, string> = {};

  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// Request dispatcher utility with fail-fast validation checks
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Check for tokens getting stale or expired to log out gracefully
    if (res.status === 401 && data.error === "TokenExpired") {
      localStorage.removeItem("MediConnect_token");
      localStorage.removeItem("MediConnect_user");
      window.dispatchEvent(new Event("MediConnect_logout"));
    }
    throw new Error(data.error || data.message || `API error (${res.status})`);
  }

  return data as T;
}

export const api = {
  // Auth Endpoint controllers
  auth: {
    checkEmail: async (payload: { email: string }) => {
      return request<{ exists: boolean; role?: string }>(`${API_BASE}/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    register: async (payload: any) => {
      const data = await request<{ user: IUser; token: string; refreshToken: string }>(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      localStorage.setItem("MediConnect_token", data.token);
      localStorage.setItem("MediConnect_user", JSON.stringify(data.user));
      return data;
    },
    login: async (payload: any) => {
      const data = await request<{ user: IUser; token: string; refreshToken: string }>(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      localStorage.setItem("MediConnect_token", data.token);
      localStorage.setItem("MediConnect_user", JSON.stringify(data.user));
      return data;
    },
    getMe: async () => {
      return request<{ user: IUser }>(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      });
    },
    forgotPassword: async (payload: { email: string }) => {
      return request<{ success: boolean; message: string }>(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    resetPassword: async (token: string, payload: any) => {
      return request<{ success: boolean; message: string }>(`${API_BASE}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    logout: () => {
      localStorage.removeItem("MediConnect_token");
      localStorage.removeItem("MediConnect_user");
      window.dispatchEvent(new Event("MediConnect_logout"));
    }
  },

  // Doctors Endpoint controllers
  doctors: {
    list: async (filters: { status?: string } = {}) => {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<{ success: boolean; doctors: IDoctor[] }>(`${API_BASE}/doctors${query}`, {
        headers: getHeaders(),
      });
    },
    create: async (payload: any) => {
      return request<{ success: boolean; doctor: IDoctor }>(`${API_BASE}/doctors`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
    },
    updateStatus: async (id: string, status: "active" | "inactive") => {
      return request<{ success: boolean; doctor: IDoctor }>(`${API_BASE}/doctors/${id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
    }
  },

  // Patients Endpoint controllers
  patients: {
    registerProfile: async (formData: FormData) => {
      return request<{ success: boolean; profile: IPatient }>(`${API_BASE}/patients/register`, {
        method: "POST",
        headers: getHeaders(true),
        body: formData,
      });
    },
    getMe: async () => {
      return request<{ profile: IPatient | null }>(`${API_BASE}/patients/me`, {
        headers: getHeaders(),
      });
    },
    getById: async (id: string) => {
      return request<{ profile: IPatient }>(`${API_BASE}/patients/${id}`, {
        headers: getHeaders(),
      });
    },
    updateProfile: async (payload: any) => {
      return request<{ success: boolean; profile: IPatient }>(`${API_BASE}/patients/me`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
    }
  },

  // Appointments list controllers
  appointments: {
    book: async (payload: any) => {
      return request<{ success: boolean; appointment: IAppointment }>(`${API_BASE}/appointments/book`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
    },
    list: async (filters: { search?: string; status?: string; doctor?: string; page?: number; limit?: number } = {}) => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status && filters.status !== "all") params.append("status", filters.status);
      if (filters.doctor && filters.doctor !== "all") params.append("doctor", filters.doctor);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const query = params.toString() ? `?${params.toString()}` : "";
      return request<{ success: boolean; appointments: IAppointment[]; total: number; page: number; totalPages: number; stats: { total: number, pending: number, scheduled: number, completed: number, cancelled: number } }>(`${API_BASE}/appointments${query}`, {
        headers: getHeaders(),
      });
    },
    getAvailableSlots: async (doctor: string, date: string) => {
      const params = new URLSearchParams({ doctor, date });
      return request<{ success: boolean; availableSlots: string[] }>(`${API_BASE}/appointments/available-slots?${params.toString()}`, {
        headers: getHeaders(),
      });
    },
    getMy: async (patientId: string) => {
      return request<{ success: boolean; appointments: IAppointment[] }>(`${API_BASE}/appointments/patient/${patientId}`, {
        headers: getHeaders(),
      });
    },
    updateStatus: async (id: string, action: "schedule" | "cancel", payload: { note?: string; cancellationReason?: string }) => {
      return request<{ success: boolean; appointment: IAppointment }>(`${API_BASE}/appointments/${id}/status?action=${action}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
    },
    reschedule: async (id: string, payload: { schedule: string; note?: string }) => {
      return request<{ success: boolean; appointment: IAppointment }>(`${API_BASE}/appointments/${id}/reschedule`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
    }
  }
};
