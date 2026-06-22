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
import { api, IAppointment } from "../services/api";

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
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");

  // Scheduling Modal State
  const [actionTarget, setActionTarget] = useState<IAppointment | null>(null);
  const [actionType, setActionType] = useState<"schedule" | "cancel" | null>(null);
  const [note, setNote] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.appointments.list({
        search: searchTerm,
        status: statusFilter,
        doctor: doctorFilter
      });
      if (res.success) {
        setAppointments(res.appointments);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to query system appointments repository.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter, doctorFilter]);

  // Handle manual search form
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleActionClick = (apt: IAppointment, action: "schedule" | "cancel") => {
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

      if (actionType === "schedule" && selectedDate) {
        const res = await api.appointments.reschedule(
          actionTarget._id,
          {
            schedule: selectedDate,
            note,
          }
        );

        if (res.success) {
          await loadData();
          setActionTarget(null);
          setActionType(null);
          setSelectedDate("");
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
        }
      }
    } catch (err: any) {
      alert(err?.message || "Action state transmission failed.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Compile system statistics
  const scheduledCount = appointments.filter(a => a.status === "scheduled").length;
  const pendingCount = appointments.filter(a => a.status === "pending").length;
  const cancelledCount = appointments.filter(a => a.status === "cancelled").length;

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
              <span className="block text-xs font-mono text-dark-500 font-bold uppercase">CONNECTED SPECIALIST</span>
              <span className="text-xs font-extrabold text-white">{currentUser?.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="text-xs text-brand-red flex items-center gap-1 bg-brand-red/10 border border-brand-red/20 px-3.5 py-2 rounded-xl hover:bg-brand-red/15 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Content wrapper */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-8 relative z-20 flex-grow">

        {/* Statistics highlights bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="stats-banner-cards">
          {/* Scheduled */}
          <div className="bg-dark-200 border border-dark-300 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-brand-green/10 text-brand-green rounded-xl border border-brand-green/15">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-2xl font-black text-white leading-none">{scheduledCount}</span>
              <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Confirmed Slots</span>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-dark-200 border border-dark-300 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl border border-brand-orange/15 animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-2xl font-black text-white leading-none">{pendingCount}</span>
              <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Pending Validation</span>
            </div>
          </div>

          {/* Cancelled */}
          <div className="bg-dark-200 border border-dark-300 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-brand-red/10 text-brand-red rounded-xl border border-brand-red/15">
              <XOctagon className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-2xl font-black text-white leading-none">{cancelledCount}</span>
              <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Cancelled Bookings</span>
            </div>
          </div>
        </div>

        {/* Action filter controls section */}
        <section className="bg-dark-200 border border-dark-300 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              {["all", "pending", "scheduled", "cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
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
        <section className="bg-dark-200 border border-dark-300 rounded-2xl overflow-hidden shadow-2xl">
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" id="schedules-data-table">
                <thead>
                  <tr className="bg-dark-100/50 border-b border-dark-300 text-[10px] uppercase font-mono tracking-widest text-dark-500 font-black">
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
                            {new Date(apt.schedule).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
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
                            : "bg-brand-red/10 text-brand-red border border-brand-red/20"
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${apt.status === "scheduled" ? "bg-brand-green" : apt.status === "pending" ? "bg-brand-orange" : "bg-brand-red"
                            }`} />
                          <span>{apt.status === "scheduled" ? "scheduled" : apt.status === "pending" ? "pending" : "cancelled"}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        {apt.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                handleActionClick(apt, "schedule");

                                setSelectedDate(
                                  new Date(apt.schedule)
                                    .toISOString()
                                    .slice(0, 16)
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
                {actionType === "schedule" ? <CheckCircle className="text-brand-green w-5 h-5" /> : <XOctagon className="text-brand-red w-5 h-5" />}
                <span>
                  {actionType === "schedule"
                    ? "Reschedule Appointment"
                    : "Submit Cancellation Notice"}
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
                    type="datetime-local"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white"
                    required
                  />
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
                    {actionType === "schedule" ? <FileCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    <span>{actionType === "schedule" ? "Confirm & Schedule" : "Submit Cancellation"}</span>
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
export default DashboardView;
