import React, { useState, useEffect } from "react";
import {
  Activity,
  CalendarCheck,
  Clock,
  XOctagon,
  Search,
  CornerDownRight,
  FileCheck,
  FileText,
  LogOut,
  Calendar,
  CheckCircle,
  FileMinus,
  Users,
  UserPlus,
  Briefcase,
  GraduationCap,
  Phone,
  Mail,
  User,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { api, IAppointment, IDoctor } from "../services/api";
import { DoctorDashboardView } from "./DoctorDashboardView";

interface DashboardViewProps {
  onNavigate: (view: "landing" | "login" | "register" | "book" | "profile" | "admin") => void;
  currentUser: any;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  currentUser,
  onLogout
}) => {
  const [selectedDoctorView, setSelectedDoctorView] = useState<IDoctor | null>(null);
  const [activeTab, setActiveTab] = useState<"appointments" | "doctors" | "blood">("appointments");

  // ==== APPOINTMENTS STATE ====
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, scheduled: 0, completed: 0, cancelled: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // ==== DOCTORS STATE ====
  const [doctorsList, setDoctorsList] = useState<IDoctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
  const [doctorCurrentPage, setDoctorCurrentPage] = useState(1);
  const [bloodRequests, setBloodRequests] = useState<any[]>([]);
  const [bloodDonors, setBloodDonors] = useState<any[]>([]);

  // Blood Bank Filters & Pagination
  const [bloodSearchTerm, setBloodSearchTerm] = useState("");
  const [bloodStatusFilter, setBloodStatusFilter] = useState("all");
  const [bloodPriorityFilter, setBloodPriorityFilter] = useState("all");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("all");
  const [bloodCurrentPage, setBloodCurrentPage] = useState(1);
  const BLOOD_ITEMS_PER_PAGE = 10;

  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);
  const [deletingDoctor, setDeletingDoctor] = useState<IDoctor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newDoctor, setNewDoctor] = useState({
    name: "",
    email: "",
    password: "",
    specialty: "General Medicine",
    phone: "",
    qualification: "",
    experience: "",
    consultationFee: 0
  });

  const [doctorToDeactivate, setDoctorToDeactivate] = useState<IDoctor | null>(null);

  // Scheduling Modal State
  const [actionTarget, setActionTarget] = useState<IAppointment | null>(null);
  const [actionType, setActionType] = useState<"schedule" | "reschedule" | "cancel" | "complete" | null>(null);
  const [note, setNote] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // LOAD APPOINTMENTS
  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.appointments.list({
        search: searchTerm,
        status: statusFilter,
        doctor: doctorFilter,
        page: currentPage,
        limit: ITEMS_PER_PAGE
      });
      if (res.success) {
        setAppointments(res.appointments);
        setTotalPages(res.totalPages);
        setStats(res.stats || { total: 0, pending: 0, scheduled: 0, completed: 0, cancelled: 0 });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to query system appointments repository.");
    } finally {
      setIsLoading(false);
    }
  }

  // LOAD DOCTORS
  async function loadDoctors() {
    try {
      setDoctorsLoading(true);
      setDoctorsError(null);
      const res = await api.doctors.list();
      if (res.success) {
        setDoctorsList(res.doctors);
      }
    } catch (err: any) {
      setDoctorsError(err?.message || "Failed to query system doctors repository.");
    } finally {
      setDoctorsLoading(false);
    }
  }
  async function loadBloodData() {
    try {
      const requestsRes = await api.blood.listRequests();
      const donorsRes = await api.blood.listDonors();

      if (requestsRes.success) {
        setBloodRequests(requestsRes.requests);
      }

      if (donorsRes.success) {
        setBloodDonors(donorsRes.donors);
      }
    } catch (err) {
      console.error("Blood data load failed:", err);
    }
  }

  const handleBloodRequestAction = async (id: string, status: string, actionName: string) => {
    if (!window.confirm(`Are you sure you want to ${actionName} this request?`)) return;
    try {
      const res = await api.blood.updateRequestStatus(id, status);
      if (res.success) {
        loadBloodData();
      } else {
        alert("Failed to update status");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  };

  const handleBloodDonorAction = async (id: string, status: string, actionName: string) => {
    if (!window.confirm(`Are you sure you want to ${actionName} this donor?`)) return;
    try {
      const res = await api.blood.updateDonorStatus(id, status);
      if (res.success) {
        loadBloodData();
      } else {
        alert("Failed to update status");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  };

  // Load both initially to ensure global stats are available
  useEffect(() => {
    loadDoctors();
    loadBloodData();
  }, []);

  useEffect(() => {
    loadData();
  }, [doctorFilter, statusFilter, currentPage]);

  useEffect(() => {
    async function fetchSlots() {
      if (!actionTarget || actionType !== "reschedule" || !selectedDate) {
        setAvailableSlots([]);
        return;
      }
      try {
        setIsLoadingSlots(true);
        const res = await api.appointments.getAvailableSlots(actionTarget.primaryPhysician, selectedDate);
        if (res.success) {
          setAvailableSlots(res.availableSlots);
        }
      } catch {
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    fetchSlots();
    setSelectedSlot("");
  }, [actionTarget, actionType, selectedDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const handleDoctorSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorCurrentPage(1);
  };

  const handleActionClick = (apt: IAppointment, action: "schedule" | "reschedule" | "cancel" | "complete") => {
    setActionTarget(apt);
    setActionType(action);
    setNote(apt.note || "");
    setCancellationReason(apt.cancellationReason || "");
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTarget || !actionType) return;

    try {
      setIsActionSubmitting(true);

      if (actionType === "reschedule" && selectedDate && selectedSlot) {
        const res = await api.appointments.reschedule(
          actionTarget._id,
          {
            schedule: `${selectedDate}T${selectedSlot}:00`,
            note,
          }
        );

        if (res.success) {
          await loadData();
          setActionTarget(null);
          setActionType(null);
          setSelectedDate("");
          setSelectedSlot("");
        }
      } else {
        const payload = {
          note: (actionType === "schedule" || actionType === "reschedule") ? note : "",
          cancellationReason: actionType === "cancel" ? cancellationReason : "",
        };

        const res = await api.appointments.updateStatus(actionTarget._id, actionType === "reschedule" ? "schedule" : actionType, payload);

        if (res.success) {
          await loadData();
          setActionTarget(null);
          setActionType(null);
          setSelectedDate("");
          setSelectedSlot("");
        }
      }
    } catch (err: any) {
      alert(err?.message || "Action state transmission failed.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleAddDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingDoctor(true);
      if (editingDoctorId) {
        const res = await api.doctors.update(editingDoctorId, newDoctor);
        if (res.success) {
          await loadDoctors();
          setIsAddingDoctor(false);
          setEditingDoctorId(null);
          setNewDoctor({
            name: "", email: "", password: "", specialty: "General Medicine", phone: "", qualification: "", experience: "", consultationFee: 0
          });
        }
      } else {
        const res = await api.doctors.create(newDoctor);
        if (res.success) {
          await loadDoctors();
          setIsAddingDoctor(false);
          setEditingDoctorId(null);
          setNewDoctor({
            name: "", email: "", password: "", specialty: "General Medicine", phone: "", qualification: "", experience: "", consultationFee: 0
          });
        }
      }
    } catch (err: any) {
      alert(err?.message || "Failed to submit doctor profile.");
    } finally {
      setIsSubmittingDoctor(false);
    }
  };

  const handleFilterClick = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleStatusToggle = async (doc: IDoctor) => {
    if (doc.status === "active") {
      setDoctorToDeactivate(doc);
    } else {
      try {
        const res = await api.doctors.updateStatus(doc._id, "active");
        if (res.success) await loadDoctors();
      } catch (err: any) {
        alert(err?.message || "Failed to update doctor status");
      }
    }
  };

  const confirmDeactivate = async () => {
    if (!doctorToDeactivate) return;
    try {
      const res = await api.doctors.updateStatus(doctorToDeactivate._id, "inactive");
      if (res.success) {
        await loadDoctors();
        setDoctorToDeactivate(null);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update doctor status");
    }
  };

  const handleDeleteDoctor = async () => {
    if (!deletingDoctor) return;
    try {
      setIsDeleting(true);
      const res = await api.doctors.remove(deletingDoctor._id);
      if (res.success) {
        setDoctorsList(prev => prev.filter(d => d._id !== deletingDoctor._id));
        setDeletingDoctor(null);
        alert("Doctor deleted successfully");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete doctor.");
    } finally {
      setIsDeleting(false);
    }
  };

  // DOCTORS PAGINATION LOGIC
  const filteredDoctors = doctorsList.filter(d =>
    d.name.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
    d.specialty.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
    d.email.toLowerCase().includes(doctorSearchTerm.toLowerCase())
  );

  const docTotalPages = Math.ceil(filteredDoctors.length / 10);
  const paginatedDoctors = filteredDoctors.slice((doctorCurrentPage - 1) * 10, doctorCurrentPage * 10);

  // BLOOD BANK LOGIC
  const priorityValue: Record<string, number> = { critical: 3, urgent: 2, normal: 1 };

  const filteredBloodRequests = bloodRequests.filter(req => {
    const matchesSearch = req.patientName?.toLowerCase().includes(bloodSearchTerm.toLowerCase()) ||
      req.hospitalName?.toLowerCase().includes(bloodSearchTerm.toLowerCase()) ||
      req.bloodGroup?.toLowerCase().includes(bloodSearchTerm.toLowerCase());
    const matchesStatus = bloodStatusFilter === "all" || req.status === bloodStatusFilter;
    const matchesPriority = bloodPriorityFilter === "all" || req.urgency === bloodPriorityFilter;
    const matchesGroup = bloodGroupFilter === "all" || req.bloodGroup === bloodGroupFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesGroup;
  }).sort((a, b) => {
    const pA = priorityValue[a.urgency] || 0;
    const pB = priorityValue[b.urgency] || 0;
    if (pA !== pB) return pB - pA;
    return new Date(b.requestDate || 0).getTime() - new Date(a.requestDate || 0).getTime();
  });

  const bloodTotalPages = Math.ceil(filteredBloodRequests.length / BLOOD_ITEMS_PER_PAGE) || 1;
  const paginatedBloodRequests = filteredBloodRequests.slice((bloodCurrentPage - 1) * BLOOD_ITEMS_PER_PAGE, bloodCurrentPage * BLOOD_ITEMS_PER_PAGE);

  // Blood Analytics
  const bloodStats = {
    totalReqs: bloodRequests.length,
    criticalReqs: bloodRequests.filter(r => r.urgency === 'critical').length,
    urgentReqs: bloodRequests.filter(r => r.urgency === 'urgent').length,
    normalReqs: bloodRequests.filter(r => r.urgency === 'normal').length,
    fulfilledReqs: bloodRequests.filter(r => r.status === 'fulfilled').length,
    availableDonors: bloodDonors.filter(d => d.status === 'eligible').length,
    activeDonors: bloodDonors.filter(d => d.status === 'active' || d.status === 'eligible').length,
    inactiveDonors: bloodDonors.filter(d => d.status === 'inactive' || d.status === 'ineligible').length,
  };

  // If viewing a specific doctor, completely overtake the screen
  if (selectedDoctorView) {
    return (
      <DoctorDashboardView
        currentUser={{ email: selectedDoctorView.email, name: selectedDoctorView.name }}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onBack={() => setSelectedDoctorView(null)}
        doctorProfile={selectedDoctorView}
        bloodRequests={bloodRequests}
        bloodDonors={bloodDonors}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dark-100 text-white flex flex-col justify-start relative font-sans" id="admin-dashboard">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-brand-green/2 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-brand-blue/2 blur-[100px] pointer-events-none" />

      {/* Main Header */}
      <header className="bg-dark-200 border-b border-dark-300 relative z-30">
        <div className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="bg-brand-green/25 p-2 rounded-xl border border-brand-green/30">
                <ShieldCheck className="h-5 w-5 text-brand-green" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white">
                  Medi<span className="text-brand-green">Connect</span>
                </span>
                <span className="block text-[8px] font-mono tracking-widest text-brand-green uppercase">Admin Terminal</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-dark-100 p-1 rounded-xl border border-dark-300">
              <button
                onClick={() => setActiveTab("appointments")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === "appointments" ? "bg-dark-300 text-white shadow-md" : "text-gray-150 hover:text-white"}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Appointments
              </button>
              <button
                onClick={() => setActiveTab("doctors")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === "doctors" ? "bg-dark-300 text-white shadow-md" : "text-gray-150 hover:text-white"}`}
              >
                <Users className="w-3.5 h-3.5" />
                Doctors
              </button>
              <button
                onClick={() => setActiveTab("blood")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === "blood" ? "bg-brand-red/20 text-brand-red shadow-md border border-brand-red/30" : "text-gray-150 hover:text-brand-red"}`}
              >
                <Activity className="w-3.5 h-3.5" />
                Blood Bank
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-mono text-dark-500 font-bold uppercase">SYSTEM ADMIN</span>
              <span className="text-xs font-extrabold text-white">{currentUser?.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="text-xs text-brand-red flex items-center gap-1 bg-brand-red/10 border border-brand-red/20 px-3.5 py-2 rounded-xl hover:bg-brand-red/15 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Wrapper */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 pb-20 sm:pb-8 space-y-6 relative z-20 flex-grow flex flex-col">

        {/* ======================= APPOINTMENTS TAB ======================= */}
        {activeTab === "appointments" && (
          <>
            {/* Statistics highlights bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 flex-shrink-0" id="stats-banner-cards">
              {/* Total */}
              <div
                className={`bg-dark-200 border rounded-2xl p-5 flex items-center gap-4 transition-all cursor-pointer ${statusFilter === "all" ? "border-purple-500 shadow-xl shadow-purple-500/10" : "border-dark-300 hover:border-purple-500/50"}`}
                onClick={() => handleFilterClick("all")}
              >
                <div className={`p-3 rounded-xl border ${statusFilter === "all" ? "bg-purple-500 text-dark-100 border-purple-500" : "bg-purple-500/10 text-purple-400 border-purple-500/15"}`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-white leading-none">{stats.total}</span>
                  <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Total Appointments</span>
                </div>
              </div>

              {/* Scheduled */}
              <div
                className={`bg-dark-200 border rounded-2xl p-5 flex items-center gap-4 transition-all cursor-pointer ${statusFilter === "scheduled" ? "border-brand-green shadow-xl shadow-brand-green/10" : "border-dark-300 hover:border-brand-green/50"}`}
                onClick={() => handleFilterClick("scheduled")}
              >
                <div className={`p-3 rounded-xl border ${statusFilter === "scheduled" ? "bg-brand-green text-dark-100 border-brand-green" : "bg-brand-green/10 text-brand-green border-brand-green/15"}`}>
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-white leading-none">{stats.scheduled}</span>
                  <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Confirmed Slots</span>
                </div>
              </div>

              {/* Pending */}
              <div
                className={`bg-dark-200 border rounded-2xl p-5 flex items-center gap-4 transition-all cursor-pointer ${statusFilter === "pending" ? "border-brand-orange shadow-xl shadow-brand-orange/10" : "border-dark-300 hover:border-brand-orange/50"}`}
                onClick={() => handleFilterClick("pending")}
              >
                <div className={`p-3 rounded-xl border ${statusFilter === "pending" ? "bg-brand-orange text-dark-100 border-brand-orange" : "bg-brand-orange/10 text-brand-orange border-brand-orange/15 animate-pulse"}`}>
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-white leading-none">{stats.pending}</span>
                  <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Pending Validation</span>
                </div>
              </div>

              {/* Completed */}
              <div
                className={`bg-dark-200 border rounded-2xl p-5 flex items-center gap-4 transition-all cursor-pointer ${statusFilter === "completed" ? "border-cyan-500 shadow-xl shadow-cyan-500/10" : "border-dark-300 hover:border-cyan-500/50"}`}
                onClick={() => handleFilterClick("completed")}
              >
                <div className={`p-3 rounded-xl border ${statusFilter === "completed" ? "bg-cyan-500 text-dark-100 border-cyan-500" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/15"}`}>
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-white leading-none">{stats.completed}</span>
                  <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Completed Visits</span>
                </div>
              </div>

              {/* Cancelled */}
              <div
                className={`bg-dark-200 border rounded-2xl p-5 flex items-center gap-4 transition-all cursor-pointer ${statusFilter === "cancelled" ? "border-brand-red shadow-xl shadow-brand-red/10" : "border-dark-300 hover:border-brand-red/50"}`}
                onClick={() => handleFilterClick("cancelled")}
              >
                <div className={`p-3 rounded-xl border ${statusFilter === "cancelled" ? "bg-brand-red text-dark-100 border-brand-red" : "bg-brand-red/10 text-brand-red border-brand-red/15"}`}>
                  <XOctagon className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-white leading-none">{stats.cancelled}</span>
                  <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Cancelled Bookings</span>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-dark-200 border border-dark-300 rounded-2xl p-5 flex items-center gap-4 transition-all">
                <div className="p-3 rounded-xl border bg-brand-blue/10 text-brand-blue border-brand-blue/15">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-white leading-none">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </span>
                  <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Completion Rate</span>
                </div>
              </div>
            </div>

            {/* Action filter controls section */}
            <section className="bg-dark-200 border border-dark-300 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row sm:items-center gap-2 max-w-md w-full">
                <div className="relative w-full sm:flex-grow">
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-150" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search patient, symptoms, or clinical notes..."
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto justify-center px-4 py-3 bg-brand-green hover:bg-brand-green/90 text-dark-100 font-bold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-brand-green/10 transition-all cursor-pointer"
                >
                  Search
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-1.5 bg-dark-100 border border-dark-300 rounded-xl p-1">
                  {["all", "pending", "scheduled", "completed", "cancelled"].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleFilterClick(s)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${statusFilter === s
                        ? "bg-brand-green text-dark-100 shadow-lg"
                        : "text-gray-150 hover:text-white hover:bg-dark-200"
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button onClick={loadData} className="p-2 border border-dark-300 hover:border-dark-400 bg-dark-100 text-gray-150 hover:text-white rounded-xl cursor-pointer">
                  <Activity className="w-4 h-4" />
                </button>
              </div>
            </section>

            {/* Database grid panel table */}
            <section className="bg-dark-200 border border-dark-300 rounded-2xl overflow-hidden shadow-2xl flex-grow flex flex-col min-h-0">
              {isLoading ? (
                <div className="p-12 text-center text-dark-500 font-mono space-y-4 m-auto">
                  <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
                  <span>Decrypting real-time clinical parameters...</span>
                </div>
              ) : error ? (
                <div className="p-12 text-center text-brand-red font-semibold m-auto">
                  ⚠️ {error}
                </div>
              ) : appointments.length === 0 ? (
                <div className="p-12 text-center text-dark-500 space-y-2 m-auto">
                  <FileMinus className="w-10 h-10 mx-auto text-dark-400" />
                  <p className="font-extrabold text-sm text-neutral-100">No schedules match the active criteria.</p>
                  <p className="text-xs text-dark-500">Wait for client requests or adjust parameters.</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="px-5 py-3 border-b border-dark-300 bg-dark-100/30 flex justify-between items-center">
                    <span className="text-xs font-bold text-dark-500 uppercase tracking-widest">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, stats[statusFilter === "all" ? "total" : statusFilter as keyof typeof stats] || 0)} of {stats[statusFilter === "all" ? "total" : statusFilter as keyof typeof stats] || 0} appointments
                    </span>
                  </div>
                  <div className="overflow-x-auto flex-grow">
                    <table className="w-full border-collapse text-left relative">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-dark-200 border-b border-dark-300 text-[10px] uppercase font-mono tracking-widest text-dark-500 font-black">
                          <th className="py-4 px-5">Patient Name</th>
                          <th className="py-4 px-5">Scheduled Date</th>
                          <th className="py-4 px-5">Specialist</th>
                          <th className="py-4 px-5">Diagnosis Requirements</th>
                          <th className="py-4 px-5">Validation Status</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-300 text-xs text-gray-150">
                        {appointments.map((apt) => (
                          <tr key={apt._id} className="hover:bg-dark-100/25 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex flex-col">
                                <span className="font-black text-white text-sm">{apt.patientName}</span>
                                <span className="text-[10px] text-dark-500 font-mono">{apt.patientPhone}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 font-bold">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-brand-green" />
                                <span>
                                  {new Date(apt.schedule).toLocaleString("en-IN", {
                                    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 font-semibold text-neutral-100">
                              {apt.primaryPhysician}
                            </td>
                            <td className="py-3.5 px-5 max-w-xs xl:max-w-sm truncate" title={apt.reason}>
                              <div className="flex flex-col gap-0.5">
                                <span>{apt.reason}</span>
                                {apt.note && (
                                  <span className="text-[10px] text-brand-green font-semibold leading-none flex items-center gap-0.5">
                                    <CornerDownRight className="w-3 h-3" /> Note: "{apt.note}"
                                  </span>
                                )}
                                {apt.cancellationReason && (
                                  <span className="text-[10px] text-brand-red font-semibold leading-none flex items-center gap-0.5">
                                    <CornerDownRight className="w-3 h-3" /> Cancelled: "{apt.cancellationReason}"
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-5">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${apt.status === "scheduled"
                                ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                                : apt.status === "pending"
                                  ? "bg-brand-orange/10 text-brand-orange border border-brand-orange/20"
                                  : apt.status === "completed"
                                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                    : "bg-brand-red/10 text-brand-red border border-brand-red/20"
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${apt.status === "scheduled" ? "bg-brand-green" : apt.status === "pending" ? "bg-brand-orange" : apt.status === "completed" ? "bg-cyan-400" : "bg-brand-red"}`} />
                                <span>{apt.status}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              {apt.status === "pending" || apt.status === "scheduled" ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  {apt.status === "pending" && (
                                    <button
                                      onClick={() => handleActionClick(apt, "schedule")}
                                      className="px-2.5 py-1.5 bg-brand-green/10 border border-brand-green/20 text-brand-green hover:bg-brand-green/15 text-[10px] uppercase font-black tracking-wider rounded-lg cursor-pointer transition-all"
                                    >
                                      Schedule
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      handleActionClick(apt, "reschedule");
                                      setSelectedDate(new Date(apt.schedule).toISOString().split('T')[0]);
                                    }}
                                    className="px-2.5 py-1.5 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue hover:bg-brand-blue/15 text-[10px] uppercase font-black tracking-wider rounded-lg cursor-pointer transition-all"
                                  >
                                    Reschedule
                                  </button>
                                  <button
                                    onClick={() => handleActionClick(apt, "cancel")}
                                    className="px-2.5 py-1.5 bg-brand-red/10 border border-brand-red/20 text-brand-red hover:bg-brand-red/15 text-[10px] uppercase font-black tracking-wider rounded-lg cursor-pointer transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-dark-500 font-mono">Processed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-5 border-t border-dark-300 bg-dark-100/30 flex-shrink-0">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-dark-100 hover:bg-dark-200 border border-dark-300 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="text-[10px] text-dark-500 font-bold uppercase tracking-widest">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-dark-100 hover:bg-dark-200 border border-dark-300 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* ======================= DOCTORS TAB ======================= */}
        {activeTab === "doctors" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
              <div className="bg-dark-200 border border-dark-300 rounded-2xl p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl border bg-brand-green/10 text-brand-green border-brand-green/15">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-white leading-none">{doctorsList.length}</span>
                  <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Total Doctors</span>
                </div>
              </div>

              <div className="bg-dark-200 border border-dark-300 rounded-2xl p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl border bg-purple-500/10 text-purple-400 border-purple-500/15">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-white leading-none">{stats.total}</span>
                  <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Total Appointments</span>
                </div>
              </div>
            </div>

            <section className="bg-dark-200 border border-dark-300 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
              <form onSubmit={handleDoctorSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-150" />
                  <input
                    type="text"
                    value={doctorSearchTerm}
                    onChange={(e) => setDoctorSearchTerm(e.target.value)}
                    placeholder="Search doctor by name, specialty or email..."
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
                  />
                </div>
                <button type="submit" className="px-4 py-3 bg-dark-100 hover:bg-dark-300 border border-dark-300 text-white font-bold text-xs rounded-xl transition-all cursor-pointer">
                  Search
                </button>
              </form>

              <div className="flex items-center gap-3">
                <button onClick={loadDoctors} className="p-3 border border-dark-300 hover:border-dark-400 bg-dark-100 text-gray-150 hover:text-white rounded-xl cursor-pointer">
                  <Activity className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingDoctorId(null);
                    setNewDoctor({ name: "", email: "", password: "", specialty: "General Medicine", phone: "", qualification: "", experience: "", consultationFee: 0 });
                    setIsAddingDoctor(true);
                  }}
                  className="px-4 py-3 bg-brand-green hover:bg-brand-green/90 text-dark-100 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-brand-green/10 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Add New Doctor
                </button>
              </div>
            </section>

            <section className="bg-dark-200 border border-dark-300 rounded-2xl overflow-hidden shadow-2xl flex-grow flex flex-col min-h-0">
              {doctorsLoading ? (
                <div className="p-12 text-center text-dark-500 font-mono space-y-4 m-auto">
                  <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
                  <span>Loading specialists registry...</span>
                </div>
              ) : doctorsError ? (
                <div className="p-12 text-center text-brand-red font-semibold m-auto">
                  ⚠️ {doctorsError}
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="p-12 text-center text-dark-500 space-y-2 m-auto">
                  <User className="w-10 h-10 mx-auto text-dark-400" />
                  <p className="font-extrabold text-sm text-neutral-100">No doctors found.</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="px-5 py-3 border-b border-dark-300 bg-dark-100/30 flex justify-between items-center">
                    <span className="text-xs font-bold text-dark-500 uppercase tracking-widest">
                      Showing {docStartIndex + 1}–{Math.min(docStartIndex + ITEMS_PER_PAGE, totalDoctorsFiltered)} of {totalDoctorsFiltered} doctors
                    </span>
                  </div>
                  <div className="overflow-x-auto flex-grow">
                    <table className="w-full border-collapse text-left relative">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-dark-200 border-b border-dark-300 text-[10px] uppercase font-mono tracking-widest text-dark-500 font-black">
                          <th className="py-4 px-5">Doctor Profile</th>
                          <th className="py-4 px-5">Specialty</th>
                          <th className="py-4 px-5">Experience</th>
                          <th className="py-4 px-5">System Status</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-300 text-xs text-gray-150">
                        {paginatedDoctors.map((doc) => (
                          <tr key={doc._id} className="hover:bg-dark-100/25 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex flex-col">
                                <span className="font-black text-white text-sm">{doc.name}</span>
                                <span className="text-[10px] text-dark-500 font-mono flex items-center gap-1 mt-0.5">
                                  <Mail className="w-2.5 h-2.5" /> {doc.email}
                                </span>
                                <span className="text-[10px] text-dark-500 font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-2.5 h-2.5" /> {doc.phone}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-brand-green flex items-center gap-1">
                                  <Briefcase className="w-3.5 h-3.5" /> {doc.specialty}
                                </span>
                                {doc.qualification && (
                                  <span className="text-[10px] text-gray-300 flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3 text-dark-500" /> {doc.qualification}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              <span className="font-semibold text-white">{doc.experience || "N/A"}</span>
                            </td>
                            <td className="py-4 px-5">
                              <button
                                onClick={() => handleStatusToggle(doc)}
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${doc.status === "active" ? "bg-brand-green/10 text-brand-green border border-brand-green/20 hover:bg-brand-green/20" : "bg-dark-300 text-dark-500 hover:bg-dark-400 border border-dark-400 hover:text-white"}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${doc.status === "active" ? "bg-brand-green" : "bg-dark-500"}`} />
                                <span>{doc.status}</span>
                              </button>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingDoctorId(doc._id);
                                    setNewDoctor({
                                      name: doc.name,
                                      email: doc.email,
                                      password: "",
                                      specialty: doc.specialty,
                                      phone: doc.phone,
                                      qualification: doc.qualification || "",
                                      experience: doc.experience?.toString() || "",
                                      consultationFee: doc.consultationFee || 0
                                    });
                                    setIsAddingDoctor(true);
                                  }}
                                  className="px-3 py-1.5 bg-brand-green/10 border border-brand-green/20 text-brand-green hover:bg-brand-green/15 text-[10px] uppercase font-black tracking-wider rounded-lg cursor-pointer transition-all"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeletingDoctor(doc)}
                                  className="px-3 py-1.5 bg-brand-red/10 border border-brand-red/20 text-brand-red hover:bg-brand-red/15 text-[10px] uppercase font-black tracking-wider rounded-lg cursor-pointer transition-all"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setSelectedDoctorView(doc)}
                                  className="px-3 py-1.5 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue hover:bg-brand-blue/15 text-[10px] uppercase font-black tracking-wider rounded-lg cursor-pointer transition-all"
                                >
                                  View Dashboard
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {docTotalPages > 1 && (
                    <div className="flex items-center justify-between p-5 border-t border-dark-300 bg-dark-100/30 flex-shrink-0">
                      <button
                        onClick={() => setDoctorCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={doctorCurrentPage === 1}
                        className="px-4 py-2 bg-dark-100 hover:bg-dark-200 border border-dark-300 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="text-[10px] text-dark-500 font-bold uppercase tracking-widest">
                        Page {doctorCurrentPage} of {docTotalPages}
                      </span>
                      <button
                        onClick={() => setDoctorCurrentPage((prev) => Math.min(docTotalPages, prev + 1))}
                        disabled={doctorCurrentPage === docTotalPages}
                        className="px-4 py-2 bg-dark-100 hover:bg-dark-200 border border-dark-300 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
            {/* ======================= BLOOD BANK TAB ======================= */}
            {activeTab === "blood" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <section className="bg-dark-200 border border-dark-300 rounded-3xl p-6 md:p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black flex items-center gap-2">
                      <span className="bg-brand-red/20 text-brand-red p-2 rounded-xl">
                        <Activity className="w-5 h-5" />
                      </span>
                      Blood Requests
                    </h2>
                  </div>

                  {/* Analytics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-dark-100 p-4 rounded-2xl border border-dark-300 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-dark-500 tracking-wider">Total Requests</span>
                      <span className="text-2xl font-black text-white">{bloodStats.totalReqs}</span>
                    </div>
                    <div className="bg-dark-100 p-4 rounded-2xl border border-brand-red/20 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-brand-red tracking-wider">Critical</span>
                      <span className="text-2xl font-black text-brand-red">{bloodStats.criticalReqs}</span>
                    </div>
                    <div className="bg-dark-100 p-4 rounded-2xl border border-brand-orange/20 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-brand-orange tracking-wider">Urgent</span>
                      <span className="text-2xl font-black text-brand-orange">{bloodStats.urgentReqs}</span>
                    </div>
                    <div className="bg-dark-100 p-4 rounded-2xl border border-brand-green/20 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-brand-green tracking-wider">Fulfilled</span>
                      <span className="text-2xl font-black text-brand-green">{bloodStats.fulfilledReqs}</span>
                    </div>
                    <div className="bg-dark-100 p-4 rounded-2xl border border-dark-300 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-dark-500 tracking-wider">Available Donors</span>
                      <span className="text-2xl font-black text-white">{bloodStats.availableDonors}</span>
                    </div>
                  </div>

                  {/* Filters & Search */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <input
                      type="text"
                      placeholder="Search Patient, Hospital, Blood Group..."
                      value={bloodSearchTerm}
                      onChange={(e) => {
                        setBloodSearchTerm(e.target.value);
                        setBloodCurrentPage(1);
                      }}
                      className="flex-1 bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-brand-green focus:outline-none transition-all"
                    />
                    <select
                      value={bloodStatusFilter}
                      onChange={(e) => {
                        setBloodStatusFilter(e.target.value);
                        setBloodCurrentPage(1);
                      }}
                      className="bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-brand-green focus:outline-none transition-all"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <select
                      value={bloodPriorityFilter}
                      onChange={(e) => {
                        setBloodPriorityFilter(e.target.value);
                        setBloodCurrentPage(1);
                      }}
                      className="bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-brand-green focus:outline-none transition-all"
                    >
                      <option value="all">All Priorities</option>
                      <option value="critical">Critical</option>
                      <option value="urgent">Urgent</option>
                      <option value="normal">Normal</option>
                    </select>
                    <select
                      value={bloodGroupFilter}
                      onChange={(e) => {
                        setBloodGroupFilter(e.target.value);
                        setBloodCurrentPage(1);
                      }}
                      className="bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-brand-green focus:outline-none transition-all"
                    >
                      <option value="all">All Blood Groups</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  {filteredBloodRequests.length === 0 ? (
                    <div className="p-8 border border-dark-300 border-dashed rounded-2xl flex flex-col items-center justify-center text-center bg-dark-100/50">
                      <span className="text-sm font-bold text-dark-500">No active blood requests</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-dark-300 bg-dark-100">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-dark-200 border-b border-dark-300">
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500">Date</th>
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500">Patient</th>
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500">Blood Group</th>
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500">Units</th>
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500">Urgency</th>
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500">Hospital</th>
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500">Status</th>
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-300">
                          {paginatedBloodRequests.map((req, i) => (
                            <tr key={i} className="hover:bg-dark-200/50 transition-colors">
                              <td className="py-3 px-5 text-sm text-gray-400">{new Date(req.requestDate || new Date()).toLocaleDateString()}</td>
                              <td className="py-3 px-5 text-sm font-bold text-white">{req.patientName}</td>
                              <td className="py-3 px-5 text-sm font-bold text-brand-red">{req.bloodGroup}</td>
                              <td className="py-3 px-5 text-sm text-gray-300">{req.unitsRequired}</td>
                              <td className="py-3 px-5">
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${req.urgency === 'critical' ? 'bg-red-500/10 text-red-500' : req.urgency === 'urgent' ? 'bg-orange-500/10 text-orange-500' : 'bg-brand-blue/10 text-brand-blue'}`}>
                                  {req.urgency}
                                </span>
                              </td>
                              <td className="py-3 px-5 text-sm text-gray-300">{req.hospitalName}</td>
                              <td className="py-3 px-5 text-sm">
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${req.status === 'pending' ? 'bg-brand-orange/10 text-brand-orange' : req.status === 'fulfilled' ? 'bg-brand-green/10 text-brand-green' : req.status === 'approved' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-dark-300 text-gray-300'}`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="py-3 px-5 text-right">
                                {req.status === 'pending' && (
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => handleBloodRequestAction(req._id, 'approved', 'Approve')} className="text-[10px] bg-brand-green/20 text-brand-green px-2 py-1 rounded hover:bg-brand-green/30">Approve</button>
                                    <button onClick={() => handleBloodRequestAction(req._id, 'rejected', 'Reject')} className="text-[10px] bg-brand-red/20 text-brand-red px-2 py-1 rounded hover:bg-brand-red/30">Reject</button>
                                  </div>
                                )}
                                {req.status === 'approved' && (
                                  <button onClick={() => handleBloodRequestAction(req._id, 'fulfilled', 'Mark Fulfilled')} className="text-[10px] bg-brand-blue/20 text-brand-blue px-2 py-1 rounded hover:bg-brand-blue/30">Mark Fulfilled</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {bloodTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 bg-dark-100 p-4 rounded-2xl border border-dark-300">
                      <button
                        onClick={() => setBloodCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={bloodCurrentPage === 1}
                        className="px-4 py-2 bg-dark-200 hover:bg-dark-300 border border-dark-400 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="text-[10px] text-dark-500 font-bold uppercase tracking-widest">
                        Page {bloodCurrentPage} of {bloodTotalPages}
                      </span>
                      <button
                        onClick={() => setBloodCurrentPage((prev) => Math.min(bloodTotalPages, prev + 1))}
                        disabled={bloodCurrentPage === bloodTotalPages}
                        className="px-4 py-2 bg-dark-200 hover:bg-dark-300 border border-dark-400 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </section>

                <section className="bg-dark-200 border border-dark-300 rounded-3xl p-6 md:p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black flex items-center gap-2">
                      <span className="bg-brand-red/20 text-brand-red p-2 rounded-xl">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      </span>
                      Blood Donors
                    </h2>
                  </div>
                  {bloodDonors.length === 0 ? (
                    <div className="p-8 border border-dark-300 border-dashed rounded-2xl flex flex-col items-center justify-center text-center bg-dark-100/50">
                      <span className="text-sm font-bold text-dark-500">No active blood donors</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-dark-300 bg-dark-100">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-dark-200 border-b border-dark-300">
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500">Donor Name</th>
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500">Blood Group</th>
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500">Status</th>
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500">Medical Notes</th>
                            <th className="py-4 px-5 text-[10px] uppercase font-black tracking-widest text-dark-500 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-300">
                          {bloodDonors.map((donor, i) => (
                            <tr key={i} className="hover:bg-dark-200/50 transition-colors">
                              <td className="py-3 px-5 text-sm font-bold text-white">{donor.patientName}</td>
                              <td className="py-3 px-5 text-sm font-bold text-brand-red">{donor.bloodGroup}</td>
                              <td className="py-3 px-5 text-sm">
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${donor.status === 'eligible' || donor.status === 'active' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-orange/10 text-brand-orange'}`}>
                                  {donor.status}
                                </span>
                              </td>
                              <td className="py-3 px-5 text-xs text-gray-400 max-w-[300px] truncate">{donor.medicalConditions || 'None'}</td>
                              <td className="py-3 px-5 text-right flex justify-end gap-2">
                                {donor.status === 'eligible' || donor.status === 'ineligible' ? (
                                  <>
                                    <button onClick={() => handleBloodDonorAction(donor._id, 'active', 'Activate')} className="text-[10px] bg-brand-green/20 text-brand-green px-2 py-1 rounded hover:bg-brand-green/30">Activate</button>
                                    <button onClick={() => handleBloodDonorAction(donor._id, 'inactive', 'Deactivate')} className="text-[10px] bg-brand-red/20 text-brand-red px-2 py-1 rounded hover:bg-brand-red/30">Deactivate</button>
                                  </>
                                ) : (
                                  <button onClick={() => handleBloodDonorAction(donor._id, donor.status === 'active' ? 'inactive' : 'active', 'Toggle Availability')} className="text-[10px] bg-brand-blue/20 text-brand-blue px-2 py-1 rounded hover:bg-brand-blue/30">Toggle Availability</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            )}
          </main>
        {/* Mobile Bottom Navigation */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-200 border-t border-dark-300 flex items-stretch">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "appointments"
              ? "text-brand-green border-t-2 border-brand-green -mt-px"
              : "text-dark-500 hover:text-white"
              }`}
          >
            <Calendar className="w-5 h-5" />
            Appointments
          </button>
          <button
            onClick={() => setActiveTab("doctors")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "doctors"
              ? "text-brand-green border-t-2 border-brand-green -mt-px"
              : "text-dark-500 hover:text-white"
              }`}
          >
            <Users className="w-5 h-5" />
            Doctors
          </button>
        </nav>

        {/* Add Doctor Modal */}
        {isAddingDoctor && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <form
              onSubmit={handleAddDoctorSubmit}
              className="bg-dark-200 border border-dark-300 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto"
            >
              <div className="border-b border-dark-300 pb-4">
                <h3 className="text-lg font-black text-neutral-100 flex items-center gap-2">
                  <UserPlus className="text-brand-green w-5 h-5" />
                  <span>{editingDoctorId ? "Edit Specialist" : "Onboard New Specialist"}</span>
                </h3>
                <p className="text-xs text-slate-100 mt-1">
                  {editingDoctorId ? "Update existing details for this doctor profile." : "Enter details to create a new doctor profile and system account."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Full Name</label>
                  <input required type="text" value={newDoctor.name} onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })} placeholder="Dr. John Doe" className="w-full bg-dark-100 border border-dark-300 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-green transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Specialty</label>
                  <select value={newDoctor.specialty} onChange={e => setNewDoctor({ ...newDoctor, specialty: e.target.value })} className="w-full bg-dark-100 border border-dark-300 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-green transition-all appearance-none cursor-pointer">
                    <option>General Medicine</option>
                    <option>Cardiologist</option>
                    <option>Pediatrician</option>
                    <option>Dermatologist</option>
                    <option>Neurologist</option>
                    <option>Psychiatrist</option>
                    <option>Orthopedic Surgeon</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Email Address</label>
                  <input required type="email" value={newDoctor.email} onChange={e => setNewDoctor({ ...newDoctor, email: e.target.value })} placeholder="doctor@MediConnect.com" className="w-full bg-dark-100 border border-dark-300 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-green transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">System Password</label>
                  <input required={!editingDoctorId} type="password" value={newDoctor.password} onChange={e => setNewDoctor({ ...newDoctor, password: e.target.value })} placeholder={editingDoctorId ? "Leave blank to keep current" : "********"} className="w-full bg-dark-100 border border-dark-300 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-green transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Phone Number</label>
                  <input required type="text" value={newDoctor.phone} onChange={e => setNewDoctor({ ...newDoctor, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="w-full bg-dark-100 border border-dark-300 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-green transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Experience (Years)</label>
                  <input type="text" value={newDoctor.experience} onChange={e => setNewDoctor({ ...newDoctor, experience: e.target.value })} placeholder="e.g. 10 Years" className="w-full bg-dark-100 border border-dark-300 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-green transition-all" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Qualifications</label>
                  <input type="text" value={newDoctor.qualification} onChange={e => setNewDoctor({ ...newDoctor, qualification: e.target.value })} placeholder="MBBS, MD - Cardiology" className="w-full bg-dark-100 border border-dark-300 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-green transition-all" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Consultation Fee</label>
                  <input type="number" value={newDoctor.consultationFee} onChange={e => setNewDoctor({ ...newDoctor, consultationFee: parseFloat(e.target.value) || 0 })} placeholder="e.g. 500" className="w-full bg-dark-100 border border-dark-300 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-green transition-all" />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-dark-300 pt-5">
                <button type="button" onClick={() => setIsAddingDoctor(false)} className="px-4 py-2 bg-dark-300 hover:bg-dark-400 border border-dark-400 text-xs font-bold rounded-xl transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingDoctor} className="px-5 py-2.5 text-dark-100 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1 shadow-lg bg-brand-green hover:bg-brand-green/90 shadow-brand-green/10 cursor-pointer disabled:opacity-50 transition-all">
                  {isSubmittingDoctor ? "Processing..." : (editingDoctorId ? "Save Profile" : "Create Doctor Profile")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Deactivation Confirmation Modal */}
        {doctorToDeactivate && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-dark-200 border border-dark-300 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-brand-red/10 p-4 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-brand-red" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Deactivate Doctor?</h3>
                  <p className="text-xs text-dark-500 mt-2">
                    The doctor <strong>{doctorToDeactivate.name}</strong> will no longer be available for new appointments. Existing appointments will remain active.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setDoctorToDeactivate(null)}
                  className="flex-1 px-4 py-3 bg-dark-300 hover:bg-dark-400 border border-dark-400 text-xs font-bold text-white rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeactivate}
                  className="flex-1 px-4 py-3 bg-brand-red hover:bg-brand-red/90 text-dark-100 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-brand-red/10 cursor-pointer"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scheduling Action Modal */}
        {actionTarget && actionType && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <form
              onSubmit={handleActionSubmit}
              className="bg-dark-200 border border-dark-300 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto"
            >
              <div className="border-b border-dark-300 pb-4">
                <h3 className="text-lg font-black text-neutral-100 flex items-center gap-2">
                  {actionType === "schedule" || actionType === "reschedule" || actionType === "complete" ? <CheckCircle className="text-brand-green w-5 h-5" /> : <XOctagon className="text-brand-red w-5 h-5" />}
                  <span>{actionType === "reschedule" ? "Reschedule Appointment" : actionType === "schedule" ? "Confirm Appointment" : actionType === "complete" ? "Complete Appointment" : "Cancel Appointment"}</span>
                </h3>
                <p className="text-xs text-slate-100 mt-1">Updating state for <strong>{actionTarget.patientName}</strong>.</p>
              </div>

              {actionType === "reschedule" ? (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">New Appointment Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={(() => {
                      const now = new Date();
                      const offset = now.getTimezoneOffset();
                      return new Date(now.getTime() - offset * 60000).toISOString().split('T')[0];
                    })()}
                    max={(() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + 6);
                      const offset = d.getTimezoneOffset();
                      return new Date(d.getTime() - offset * 60000).toISOString().split('T')[0];
                    })()}
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white mb-3"
                    required
                  />
                  {selectedDate && (
                    <div className="space-y-2 mt-2">
                      <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Available Slots</label>
                      {isLoadingSlots ? (
                        <div className="h-10 w-full bg-dark-100 animate-pulse rounded-xl" />
                      ) : availableSlots.length === 0 ? (
                        <p className="text-brand-red text-xs font-semibold">No slots available.</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {availableSlots.map(slot => (
                            <button
                              type="button"
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2 rounded-lg text-xs font-bold transition-all ${selectedSlot === slot ? 'bg-brand-green text-dark-100 shadow-md' : 'bg-dark-100 border border-dark-300 text-gray-150 hover:border-brand-green/50'}`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Notes</label>
                  <textarea
                    required
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:border-brand-green transition-all resize-none"
                  />
                </div>
              ) : actionType === "schedule" ? (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Confirmation Notes</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:border-brand-green transition-all resize-none"
                  />
                </div>
              ) : actionType === "complete" ? (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Completion Notes</label>
                  <textarea
                    required
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:border-brand-green transition-all resize-none"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Reason for Cancellation</label>
                  <textarea
                    required
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    rows={4}
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:border-brand-green transition-all resize-none"
                  />
                </div>
              )}

              <div className="flex justify-between border-t border-dark-300 pt-5">
                <button type="button" onClick={() => { setActionTarget(null); setActionType(null); }} className="px-4 py-2 bg-dark-300 hover:bg-dark-400 border border-dark-400 text-xs font-bold rounded-xl transition-all cursor-pointer">
                  Close
                </button>
                <button type="submit" disabled={isActionSubmitting} className={`px-5 py-2 text-dark-100 text-xs font-black uppercase rounded-xl flex items-center gap-1 cursor-pointer transition-all ${actionType === "schedule" || actionType === "reschedule" || actionType === "complete" ? "bg-brand-green" : "bg-brand-red"}`}>
                  {isActionSubmitting ? "Processing..." : (actionType === "reschedule" ? "Reschedule" : actionType === "schedule" ? "Confirm" : actionType === "complete" ? "Complete" : "Submit")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Doctor Modal */}
        {deletingDoctor && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-dark-200 border border-brand-red/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red to-orange-500"></div>

              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-brand-red/20 mb-4">
                  <svg className="h-6 w-6 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-white">Delete Doctor</h3>
                <p className="text-sm text-dark-500 mt-2">
                  Are you sure you want to delete <span className="font-bold text-white">{deletingDoctor.name}</span>?
                  This action is permanent and cannot be undone. Associated appointments will lose their primary physician reference.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setDeletingDoctor(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-dark-100 hover:bg-dark-300 text-white text-sm font-bold rounded-xl transition-all border border-dark-400 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDoctor}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-brand-red hover:bg-brand-red/90 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-red/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
export default DashboardView;
