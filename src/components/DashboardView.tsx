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
  const [activeTab, setActiveTab] = useState<"appointments" | "doctors">("appointments");

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

  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    email: "",
    password: "",
    specialty: "General Medicine",
    phone: "",
    qualification: "",
    experience: ""
  });

  const [doctorToDeactivate, setDoctorToDeactivate] = useState<IDoctor | null>(null);

  // Scheduling Modal State
  const [actionTarget, setActionTarget] = useState<IAppointment | null>(null);
  const [actionType, setActionType] = useState<"schedule" | "cancel" | "complete" | null>(null);
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

  // Load both initially to ensure global stats are available
  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    loadData();
  }, [doctorFilter, statusFilter, currentPage]);

  useEffect(() => {
    async function fetchSlots() {
      if (!actionTarget || actionType !== "schedule" || !selectedDate) {
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

  const handleActionClick = (apt: IAppointment, action: "schedule" | "cancel" | "complete") => {
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

      if (actionType === "schedule" && selectedDate && selectedSlot) {
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
          note: actionType === "schedule" ? note : "",
          cancellationReason: actionType === "cancel" ? cancellationReason : "",
        };

        const res = await api.appointments.updateStatus(actionTarget._id, actionType, payload);

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
      const res = await api.doctors.create(newDoctor);
      if (res.success) {
        await loadDoctors();
        setIsAddingDoctor(false);
        setNewDoctor({
          name: "",
          email: "",
          password: "",
          specialty: "General Medicine",
          phone: "",
          qualification: "",
          experience: ""
        });
      }
    } catch (err: any) {
      alert(err?.message || "Failed to create doctor.");
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

  // DOCTORS PAGINATION LOGIC
  const filteredDoctors = doctorsList.filter(d =>
    d.name.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
    d.specialty.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
    d.email.toLowerCase().includes(doctorSearchTerm.toLowerCase())
  );

  const totalDoctorsFiltered = filteredDoctors.length;
  const docTotalPages = Math.ceil(totalDoctorsFiltered / ITEMS_PER_PAGE) || 1;
  const docStartIndex = (doctorCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDoctors = filteredDoctors.slice(docStartIndex, docStartIndex + ITEMS_PER_PAGE);

  // If viewing a specific doctor, completely overtake the screen
  if (selectedDoctorView) {
    return (
      <DoctorDashboardView
        currentUser={{ email: selectedDoctorView.email, name: selectedDoctorView.name }}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onBack={() => setSelectedDoctorView(null)}
        doctorProfile={selectedDoctorView}
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
                  Care<span className="text-brand-green">Pulse</span>
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
                Doctors Management
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
                                  {apt.status === "scheduled" && (
                                    <button
                                      onClick={() => handleActionClick(apt, "complete")}
                                      className="px-2.5 py-1.5 bg-brand-green/10 border border-brand-green/20 text-brand-green hover:bg-brand-green/15 text-[10px] uppercase font-black tracking-wider rounded-lg cursor-pointer transition-all"
                                    >
                                      Complete
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      handleActionClick(apt, "schedule");
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
                  onClick={() => setIsAddingDoctor(true)}
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
                              <button
                                onClick={() => setSelectedDoctorView(doc)}
                                className="px-3 py-1.5 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue hover:bg-brand-blue/15 text-[10px] uppercase font-black tracking-wider rounded-lg cursor-pointer transition-all"
                              >
                                View Dashboard
                              </button>
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
          </>
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
                <span>Onboard New Specialist</span>
              </h3>
              <p className="text-xs text-slate-100 mt-1">
                Enter details to create a new doctor profile and system account.
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
                <input required type="email" value={newDoctor.email} onChange={e => setNewDoctor({ ...newDoctor, email: e.target.value })} placeholder="doctor@carepulse.com" className="w-full bg-dark-100 border border-dark-300 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-green transition-all" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">System Password</label>
                <input required type="password" value={newDoctor.password} onChange={e => setNewDoctor({ ...newDoctor, password: e.target.value })} placeholder="********" className="w-full bg-dark-100 border border-dark-300 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-green transition-all" />
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
            </div>

            <div className="flex items-center justify-between border-t border-dark-300 pt-5">
              <button type="button" onClick={() => setIsAddingDoctor(false)} className="px-4 py-2 bg-dark-300 hover:bg-dark-400 border border-dark-400 text-xs font-bold rounded-xl transition-all cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={isSubmittingDoctor} className="px-5 py-2.5 text-dark-100 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1 shadow-lg bg-brand-green hover:bg-brand-green/90 shadow-brand-green/10 cursor-pointer disabled:opacity-50 transition-all">
                {isSubmittingDoctor ? "Creating Profile..." : "Create Doctor Profile"}
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
                {actionType === "schedule" || actionType === "complete" ? <CheckCircle className="text-brand-green w-5 h-5" /> : <XOctagon className="text-brand-red w-5 h-5" />}
                <span>{actionType === "schedule" ? "Reschedule Appointment" : actionType === "complete" ? "Complete Appointment" : "Cancel Appointment"}</span>
              </h3>
              <p className="text-xs text-slate-100 mt-1">Updating state for <strong>{actionTarget.patientName}</strong>.</p>
            </div>

            {actionType === "schedule" ? (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">New Appointment Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
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
              <button type="submit" disabled={isActionSubmitting} className={`px-5 py-2 text-dark-100 text-xs font-black uppercase rounded-xl flex items-center gap-1 cursor-pointer transition-all ${actionType === "schedule" || actionType === "complete" ? "bg-brand-green" : "bg-brand-red"}`}>
                {isActionSubmitting ? "Processing..." : (actionType === "schedule" ? "Confirm" : actionType === "complete" ? "Complete" : "Submit")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default DashboardView;
