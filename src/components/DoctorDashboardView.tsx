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
  Filter,
  CheckCircle,
  HelpCircle,
  FileMinus
} from "lucide-react";
import { api, IAppointment, IDoctor } from "../services/api";
import { DoctorInfoPanel } from "./DoctorInfoPanel";

interface DoctorDashboardViewProps {
  onNavigate: (view: "landing" | "login" | "register" | "book" | "profile" | "admin" | "doctor") => void;
  currentUser: any;
  onLogout: () => void;
  onBack?: () => void;
  doctorProfile?: IDoctor;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  onNavigate,
  currentUser,
  onLogout,
  onBack,
  doctorProfile
}) => {
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, scheduled: 0, completed: 0, cancelled: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  const [activeDoctorProfile, setActiveDoctorProfile] = useState<IDoctor | null>(doctorProfile || null);

  useEffect(() => {
    if (!doctorProfile && currentUser?.email) {
      api.doctors.list().then(res => {
        if (res.success) {
          const doc = res.doctors.find(d => d.email === currentUser.email);
          if (doc) setActiveDoctorProfile(doc);
        }
      }).catch(console.error);
    }
  }, [doctorProfile, currentUser]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.appointments.list({
        search: searchTerm,
        status: statusFilter,
        doctor: doctorProfile ? doctorProfile.name : "all", // Filter by doctor if viewing specific
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

  // Handle manual search form
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
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
          cancellationReason:
            actionType === "cancel"
              ? cancellationReason
              : "",
        };

        const res = await api.appointments.updateStatus(
          actionTarget._id,
          actionType,
          payload
        );

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

  const handleFilterClick = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-dark-100 text-white flex flex-col justify-start relative font-sans" id="specialist-dashboard">
      {/* Absolute Dynamic Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-brand-green/2 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-brand-blue/2 blur-[100px] pointer-events-none" />

      {/* Main Specialized Header */}
      <header className="bg-dark-200 border-b border-dark-300 relative z-30">
        <div className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-green/25 p-2 rounded-xl border border-brand-green/30">
              <Activity className="h-5 w-5 text-brand-green" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">
                Care<span className="text-brand-green">Pulse</span>
              </span>
              <span className="block text-[8px] font-mono tracking-widest text-brand-green uppercase">Clinical Dashboard Terminal</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-mono text-dark-500 font-bold uppercase">{onBack ? "VIEWING SPECIALIST" : "CONNECTED SPECIALIST"}</span>
              <span className="text-xs font-extrabold text-white">{currentUser?.email}</span>
            </div>
            {onBack ? (
              <button
                onClick={onBack}
                className="text-xs text-brand-blue flex items-center gap-1 bg-brand-blue/10 border border-brand-blue/20 px-3.5 py-2 rounded-xl hover:bg-brand-blue/15 transition-all cursor-pointer"
              >
                Back to Admin
              </button>
            ) : (
              <button
                onClick={onLogout}
                className="text-xs text-brand-red flex items-center gap-1 bg-brand-red/10 border border-brand-red/20 px-3.5 py-2 rounded-xl hover:bg-brand-red/15 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content wrapper */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-6 relative z-20 flex-grow flex flex-col h-0">
        
        {doctorProfile?.status === "inactive" && (
          <div className="bg-brand-red/10 border border-brand-red border-dashed rounded-xl p-4 flex items-center justify-center gap-2 flex-shrink-0">
            <XOctagon className="w-5 h-5 text-brand-red" />
            <span className="text-brand-red font-black uppercase tracking-widest text-sm">Doctor Profile Inactive</span>
          </div>
        )}

        {/* Statistics highlights bar */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 flex-shrink-0" id="stats-banner-cards">
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

          {/* Completed */}
          <div 
            className={`bg-dark-200 border rounded-2xl p-5 flex items-center gap-4 transition-all cursor-pointer ${statusFilter === "completed" ? "border-cyan-500 shadow-xl shadow-cyan-500/10" : "border-dark-300 hover:border-cyan-500/50"}`}
            onClick={() => handleFilterClick("completed")}
          >
            <div className={`p-3 rounded-xl border ${statusFilter === "completed" ? "bg-cyan-500 text-dark-100 border-cyan-500" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/15 animate-pulse"}`}>
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

        {/* Professional Doctor Information Panel */}
        <DoctorInfoPanel doctor={activeDoctorProfile} stats={stats} />

        {/* Action filter controls section */}
        <section className="bg-dark-200 border border-dark-300 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
          {/* Left - Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-150" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, symptoms, or clinical notes..."
                className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
                id="search-input"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-3 bg-brand-green hover:bg-brand-green/90 text-dark-100 font-bold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-brand-green/10 transition-all cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Right - Tabs and Doctor filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-dark-100 border border-dark-300 rounded-xl p-1" id="tab-filters">
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

            {/* Quick Refresh */}
            <button
              onClick={loadData}
              className="p-2 border border-dark-300 hover:border-dark-400 bg-dark-100 text-gray-150 hover:text-white rounded-xl cursor-pointer"
              title="Sync dataset"
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Database grid panel table */}
        <section className="bg-dark-200 border border-dark-300 rounded-2xl overflow-hidden shadow-2xl flex-grow flex flex-col min-h-[400px]">
          {isLoading ? (
            <div className="p-12 text-center text-dark-500 font-mono space-y-4">
              <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
              <span>Decrypting real-time clinical parameters...</span>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-brand-red font-semibold">
              ⚠️ {error}
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center text-dark-500 space-y-2">
              <FileMinus className="w-10 h-10 mx-auto text-dark-400" />
              <p className="font-extrabold text-sm text-neutral-100">No schedules match the active criteria.</p>
              <p className="text-xs text-dark-500">Wait for client requests or adjust parameters.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {appointments.length > 0 && (
                <div className="px-5 py-3 border-b border-dark-300 bg-dark-100/30 flex justify-between items-center">
                  <span className="text-xs font-bold text-dark-500 uppercase tracking-widest">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, stats[statusFilter === "all" ? "total" : statusFilter as keyof typeof stats] || 0)} of {stats[statusFilter === "all" ? "total" : statusFilter as keyof typeof stats] || 0} appointments
                  </span>
                </div>
              )}
              <div className="overflow-x-auto flex-grow overflow-y-auto">
                <table className="w-full border-collapse text-left relative" id="schedules-data-table">
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
                      {/* Name */}
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col">
                          <span className="font-black text-white text-sm">{apt.patientName}</span>
                          <span className="text-[10px] text-dark-500 font-mono">{apt.patientPhone}</span>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-3.5 px-5 font-bold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-green" />
                          <span>
                            {new Date(apt.schedule).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Specialist */}
                      <td className="py-3.5 px-5 font-semibold text-neutral-100">
                        {apt.primaryPhysician}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-5 max-w-xs xl:max-w-sm truncate" title={apt.reason}>
                        <div className="flex flex-col gap-0.5">
                          <span>{apt.reason}</span>
                          {apt.note && (
                            <span className="text-[10px] text-brand-green font-semibold leading-none flex items-center gap-0.5">
                              <CornerDownRight className="w-3 h-3" />
                              Note: "{apt.note}"
                            </span>
                          )}
                          {apt.cancellationReason && (
                            <span className="text-[10px] text-brand-red font-semibold leading-none flex items-center gap-0.5">
                              <CornerDownRight className="w-3 h-3" />
                              Cancelled: "{apt.cancellationReason}"
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${apt.status === "scheduled"
                          ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                          : apt.status === "pending"
                            ? "bg-brand-orange/10 text-brand-orange border border-brand-orange/20"
                            : apt.status === "completed"
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "bg-brand-red/10 text-brand-red border border-brand-red/20"
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${apt.status === "scheduled" ? "bg-brand-green" : apt.status === "pending" ? "bg-brand-orange" : apt.status === "completed" ? "bg-cyan-400" : "bg-brand-red"
                            }`} />
                          <span>{apt.status === "scheduled" ? "scheduled" : apt.status === "pending" ? "pending" : apt.status === "completed" ? "completed" : "cancelled"}</span>
                        </span>
                      </td>

                      {/* Actions */}
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

                                setSelectedDate(
                                  new Date(apt.schedule)
                                    .toISOString()
                                    .split('T')[0]
                                );
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
                <div className="flex items-center justify-between p-5 border-t border-dark-300 bg-dark-100/30">
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
      </main>

      {/* Action scheduling overlay modal */}
      {actionTarget && actionType && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <form
            onSubmit={handleActionSubmit}
            className="bg-dark-200 border border-dark-300 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150"
          >
            <div className="border-b border-dark-300 pb-4">
              <h3 className="text-lg font-black text-neutral-100 flex items-center gap-2">
                {actionType === "schedule" || actionType === "complete" ? <CheckCircle className="text-brand-green w-5 h-5" /> : <XOctagon className="text-brand-red w-5 h-5" />}
                <span>
                  {actionType === "schedule"
                    ? "Reschedule Appointment"
                    : actionType === "complete" ? "Complete Appointment" : "Submit Cancellation Notice"}
                </span>
              </h3>
              <p className="text-xs text-slate-100 mt-1">
                Updating schedule state for patient profile <strong>{actionTarget.patientName}</strong>.
              </p>
            </div>

            {actionType === "schedule" ? (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Specialist Consultation Notes</label>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                    New Appointment Date & Time
                  </label>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white mb-3"
                    required
                  />

                  {selectedDate && (
                    <div className="space-y-2 mt-2">
                      <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Available Time Slots</label>
                      {isLoadingSlots ? (
                        <div className="h-10 w-full bg-dark-100 animate-pulse rounded-xl" />
                      ) : availableSlots.length === 0 ? (
                        <p className="text-brand-red text-xs font-semibold">No available slots for this date.</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {availableSlots.map(slot => (
                            <button
                              type="button"
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2 rounded-lg text-xs font-bold transition-all ${selectedSlot === slot ? 'bg-brand-green text-dark-100 shadow-md shadow-brand-green/20' : 'bg-dark-100 border border-dark-300 text-gray-150 hover:border-brand-green/50'}`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <textarea
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Schedule diagnostic chest X-ray on arrival; request fasting for 4 hours."
                  rows={4}
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all resize-none"
                  id="modal-note-textarea"
                />
              </div>
            ) : actionType === "complete" ? (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Specialist Completion Notes</label>
                <textarea
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Patient successfully examined. Prescribed XYZ for 5 days."
                  rows={4}
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all resize-none"
                  id="modal-complete-note-textarea"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Cancellation Reasoning Statement</label>
                <textarea
                  required
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Practitioner unavailable due to unscheduled surgical deployment."
                  rows={4}
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all resize-none"
                  id="modal-reason-textarea"
                />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-dark-300 pt-5">
              <button
                type="button"
                onClick={() => {
                  setActionTarget(null);
                  setActionType(null);
                  setSelectedDate("");
                  setSelectedSlot("");


                }}
                className="px-4 py-2 bg-dark-300 hover:bg-dark-400 border border-dark-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={isActionSubmitting}
                className={`px-5 py-2.5 text-dark-100 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1 shadow-lg cursor-pointer disabled:cursor-not-allowed transition-all ${actionType === "schedule"
                  ? "bg-brand-green hover:bg-brand-green/90 shadow-brand-green/10"
                  : "bg-brand-red hover:bg-brand-red/90 shadow-brand-red/10"
                  }`}
                id="modal-submit-btn"
              >
                {isActionSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-dark-100 border-t-transparent rounded-full animate-spin" />
                    <span>Processing Status...</span>
                  </>
                ) : (
                  <>
                    {actionType === "schedule" || actionType === "complete" ? <FileCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    <span>{actionType === "schedule" ? "Confirm & Schedule" : actionType === "complete" ? "Complete Appointment" : "Submit Cancellation"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default DoctorDashboardView;
