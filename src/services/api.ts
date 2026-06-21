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
  avatarUrl?: string;
  status: "active" | "inactive";
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
  schedule: string;
  reason: string;
  status: "pending" | "scheduled" | "cancelled";
  note?: string;
  cancellationReason?: string;
  createdAt?: string;
}

const API_BASE = "/api";

// Auto-retrieve header authorization
function getHeaders(isMultipart = false): HeadersInit {
  const token = localStorage.getItem("carepulse_token");
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
      localStorage.removeItem("carepulse_token");
      localStorage.removeItem("carepulse_user");
      window.dispatchEvent(new Event("carepulse_logout"));
    }
    throw new Error(data.error || data.message || `API error (${res.status})`);
  }
  
  return data as T;
}

export const api = {
  // Auth Endpoint controllers
  auth: {
    register: async (payload: any) => {
      const data = await request<{ user: IUser; token: string; refreshToken: string }>(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      localStorage.setItem("carepulse_token", data.token);
      localStorage.setItem("carepulse_user", JSON.stringify(data.user));
      return data;
    },
    login: async (payload: any) => {
      const data = await request<{ user: IUser; token: string; refreshToken: string }>(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      localStorage.setItem("carepulse_token", data.token);
      localStorage.setItem("carepulse_user", JSON.stringify(data.user));
      return data;
    },
    getMe: async () => {
      return request<{ user: IUser }>(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      });
    },
    logout: () => {
      localStorage.removeItem("carepulse_token");
      localStorage.removeItem("carepulse_user");
      window.dispatchEvent(new Event("carepulse_logout"));
    }
  },

  // Doctors Endpoint controllers
  doctors: {
    list: async () => {
      return request<{ success: boolean; doctors: IDoctor[] }>(`${API_BASE}/doctors`, {
        headers: getHeaders(),
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
    list: async (filters: { search?: string; status?: string; doctor?: string } = {}) => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.doctor) params.append("doctor", filters.doctor);
      
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<{ success: boolean; appointments: IAppointment[] }>(`${API_BASE}/appointments${query}`, {
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
    }
  }
};
