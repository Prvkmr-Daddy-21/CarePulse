import React, { useState, useEffect } from "react";
import {
  Activity,
  User,
  LogIn,
  Calendar,
  LogOut,
  Phone,
  MapPin,
  Briefcase,
  ShieldCheck,
  FileText,
  PlusCircle,
  Clock,
  AlertTriangle,
  FolderOpen
} from "lucide-react";
import { api, IPatient, IAppointment } from "../services/api";

interface PatientProfileViewProps {
  onNavigate: (view: "landing" | "login" | "register" | "book" | "profile" | "admin") => void;
  currentUser: any;
  onLogout: () => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  onNavigate,
  currentUser,
  onLogout
}) => {
  const [profile, setProfile] = useState<IPatient | null>(null);
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    phone: profile?.phone || "",
    address: profile?.address || "",
    occupation: profile?.occupation || "",
    emergencyContactName: profile?.emergencyContactName || "",
    emergencyContactNumber: profile?.emergencyContactNumber || "",
  });
  const totalAppointments = appointments.length;

  const scheduledAppointments = appointments.filter(
    (apt) => apt.status === "scheduled"
  ).length;

  const pendingAppointments = appointments.filter(
    (apt) => apt.status === "pending"
  ).length;

  const cancelledAppointments = appointments.filter(
    (apt) => apt.status === "cancelled"
  ).length;
  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        setIsLoading(true);
        setError(null);

        // Fetch patient profile first
        const profileRes = await api.patients.getMe();
        if (profileRes.profile) {
          setProfile(profileRes.profile);
          setFormData({
            phone: profileRes.profile.phone || "",
            address: profileRes.profile.address || "",
            occupation: profileRes.profile.occupation || "",
            emergencyContactName: profileRes.profile.emergencyContactName || "",
            emergencyContactNumber: profileRes.profile.emergencyContactNumber || "",
          });
          // Fetch appointments using patient id
          const apptRes = await api.appointments.getMy(profileRes.profile._id);
          if (apptRes.success) {
            setAppointments(apptRes.appointments);
          }
        }
      } catch (err: any) {
        setError(err?.message || "Failed to retrieve your patient profile coordinates.");
        // If profile was not found (404), redirect to registration view
        if (err?.message && err.message.includes("not found")) {
          onNavigate("register");
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [currentUser]);
  const handleProfileSave = async () => {
    try {
      const response = await api.patients.updateProfile(formData);

      if (response.profile) {
        setProfile(response.profile);
      }

      setEditing(false);

      alert("Profile updated successfully");
    } catch (error) {
      alert("Failed to update profile");
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-100 flex flex-col items-center justify-center p-6 text-white space-y-4">
        <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
        <span className="font-mono text-dark-500">Decrypting clinical coordinates...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-100 text-white flex flex-col justify-start relative font-sans" id="patient-profile-panel">
      {/* Absolute Background Blur */}
      <div className="absolute top-[-5%] right-[-10%] w-[45%] h-[40%] rounded-full bg-brand-green/2 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[45%] h-[40%] rounded-full bg-brand-blue/2 blur-[100px] pointer-events-none" />

      {/* Main Header */}
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
              <span className="block text-[8px] font-mono tracking-widest text-brand-green uppercase">Authorized Patient Node</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate("book")}
              className="text-xs text-dark-100 bg-brand-green hover:bg-brand-green/90 px-4 py-2 rounded-xl font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-brand-green/10 transition-all cursor-pointer"
              id="header-book-appointment-btn"
            >
              <PlusCircle className="w-4 h-4" />
              Book Slot
            </button>
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
      <main className="max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20 flex-grow">

        {/* Left column - Patient credentials dossier */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-dark-200 border border-dark-300 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
            {/* Header Avatar and Basic */}
            <div className="flex items-center gap-4 border-b border-dark-300 pb-4">
              <div className="w-14 h-14 bg-brand-green/20 rounded-2xl flex items-center justify-center border border-brand-green/30 text-brand-green">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white leading-tight">{profile?.name || "Active Patient"}</h3>
                <span className="text-[10px] font-mono text-dark-500 uppercase font-black uppercase tracking-wider">MAPPED PATIENT INDENTIFIER</span>
              </div>
            </div>

            {/* Demographics details grid */}
            <div className="space-y-4 text-xs">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-brand-green">Personal dossier</h4>
              <button
                onClick={() => setEditing(true)}
                className="mb-4 px-4 py-2 bg-brand-green text-dark-100 rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Edit Profile
              </button>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-brand-green mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[9px] text-dark-500 uppercase font-mono leading-none">CONTACT PHONE NUMBER</span>
                    <span className="font-bold text-white">{profile?.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[9px] text-dark-500 uppercase font-mono leading-none">DATE OF BIRTH / GENDER</span>
                    <span className="font-bold text-white capitalize">
                      {profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""} • {profile?.gender}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-green mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[9px] text-dark-500 uppercase font-mono leading-none">RESIDENCE PATH ADDRESS</span>
                    <span className="font-bold text-white">{profile?.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Briefcase className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[9px] text-dark-500 uppercase font-mono leading-none">DESIGNATED OCCUPATION</span>
                    <span className="font-bold text-white">{profile?.occupation}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Insurance details */}
            <div className="space-y-4 text-xs border-t border-dark-300 pt-4">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-brand-blue">Insurance & Emergency Guardians</h4>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 bg-dark-100 border border-dark-300 rounded-xl">
                  <span className="block text-[9px] text-dark-500 uppercase font-mono font-bold leading-none mb-1">RELATION GATED</span>
                  <span className="block font-black text-white text-xs truncate">{profile?.emergencyContactName}</span>
                  <span className="block text-[10px] text-gray-150 font-mono mt-0.5">{profile?.emergencyContactNumber}</span>
                </div>

                <div className="p-3 bg-dark-100 border border-dark-300 rounded-xl">
                  <span className="block text-[9px] text-dark-500 uppercase font-mono font-bold leading-none mb-1">INSURANCE SCHEME</span>
                  <span className="block font-black text-white text-xs truncate">{profile?.insuranceProvider}</span>
                  <span className="block text-[10px] text-gray-150 font-mono mt-0.5">{profile?.insurancePolicyNumber}</span>
                </div>
              </div>
            </div>

            {/* Scanned Verification Clinical Documents upload links */}
            {profile?.documentUrl && (
              <div className="border-t border-dark-300 pt-4">
                <a
                  href={profile.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-brand-blue/10 border border-brand-blue/20 hover:bg-brand-blue/15 text-brand-blue text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-4.5 h-4.5" />
                  <span>Inspect Uploaded Dossier</span>
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Right column - Historic Consultations Allocation list */}
        <section className="lg:col-span-8 flex flex-col gap-6">



          {/* Welcome Banner */}

          <div className="bg-dark-200 border border-dark-300 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
            <div className="space-y-1 z-10 text-center sm:text-left">
              <h2 className="text-2xl font-black text-white tracking-tight">Active Therapist Timeline</h2>
              <p className="text-xs text-slate-100 leading-relaxed max-w-md">
                Monitor status logs for upcoming practitioner allocations, clinic confirmations, or detailed cancellation reasons.
              </p>
            </div>

            <button
              onClick={() => onNavigate("book")}
              className="px-5 py-3.5 bg-brand-green hover:bg-brand-green/90 text-dark-100 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-brand-green/10 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 z-10"
              id="cta-book-appointment-btn"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              <span>Book Appointment Slot</span>
            </button>
          </div>

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="bg-dark-200 border border-dark-300 rounded-2xl p-5">
              <p className="text-dark-500 text-[10px] uppercase font-black tracking-wider">
                Total Appointments
              </p>
              <h2 className="text-3xl font-black text-white mt-2">
                {totalAppointments}
              </h2>
            </div>

            <div className="bg-dark-200 border border-brand-green/20 rounded-2xl p-5">
              <p className="text-brand-green text-[10px] uppercase font-black tracking-wider">
                Scheduled
              </p>
              <h2 className="text-3xl font-black text-brand-green mt-2">
                {scheduledAppointments}
              </h2>
            </div>

            <div className="bg-dark-200 border border-brand-orange/20 rounded-2xl p-5">
              <p className="text-brand-orange text-[10px] uppercase font-black tracking-wider">
                Pending
              </p>
              <h2 className="text-3xl font-black text-brand-orange mt-2">
                {pendingAppointments}
              </h2>
            </div>

            <div className="bg-dark-200 border border-brand-red/20 rounded-2xl p-5">
              <p className="text-brand-red text-[10px] uppercase font-black tracking-wider">
                Cancelled
              </p>
              <h2 className="text-3xl font-black text-brand-red mt-2">
                {cancelledAppointments}
              </h2>
            </div>

          </div>
          {/* History listings */}
          <div className="bg-dark-200 border border-dark-300 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-neutral-100 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-dark-300">
              <Clock className="w-4.5 h-4.5 text-brand-green" />
              <span>Historic Consultant Appointments</span>
            </h3>

            {error && (
              <div className="p-4 bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-semibold rounded-xl">
                ⚠️ {error}
              </div>
            )}

            {appointments.length === 0 ? (
              <div className="py-12 text-center text-dark-500 space-y-2">
                <Activity className="w-8 h-8 text-dark-400 mx-auto animate-pulse" />
                <p className="font-extrabold text-xs text-slate-150">No schedules submitted under this patient profile yet.</p>
                <button
                  onClick={() => onNavigate("book")}
                  className="text-xs text-brand-green font-extrabold underline hover:text-brand-green/80 cursor-pointer"
                >
                  Create slot allocation request
                </button>
              </div>
            ) : (
              <div className="divide-y divide-dark-300">
                {appointments.map((apt) => (
                  <div key={apt._id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">

                    {/* Diagnostic Reason details */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-dark-300 border border-dark-400 text-slate-100 text-[10px] font-extrabold rounded-lg">
                          {apt.primaryPhysician}
                        </span>
                        <span className="text-xs font-mono font-bold text-dark-500">
                          {new Date(apt.schedule).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-100 font-medium">Reason: "{apt.reason}"</p>

                      {/* Note and feedback responses */}
                      {apt.note && (
                        <p className="text-[11px] text-brand-green bg-brand-green/5 border border-brand-green/10 rounded-lg p-2 max-w-lg">
                          📝 <strong>Practitioner Feedback:</strong> "{apt.note}"
                        </p>
                      )}

                      {apt.cancellationReason && (
                        <p className="text-[11px] text-brand-red bg-brand-red/5 border border-brand-red/10 rounded-lg p-2 max-w-lg flex items-start gap-1 justify-start">
                          <AlertTriangle className="w-3.5 h-3.5 text-brand-red mt-0.5 shrink-0" />
                          <span><strong>Cancellation Notice:</strong> "{apt.cancellationReason}"</span>
                        </p>
                      )}
                    </div>

                    {/* Status Badge right aligned */}
                    <div className="shrink-0 flex items-center md:justify-end">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${apt.status === "scheduled"
                        ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                        : apt.status === "pending"
                          ? "bg-brand-orange/10 text-brand-orange border border-brand-orange/20"
                          : "bg-brand-red/10 text-brand-red border border-brand-red/20"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${apt.status === "scheduled" ? "bg-brand-green" : apt.status === "pending" ? "bg-brand-orange" : "bg-brand-red"
                          }`} />
                        <span>{apt.status}</span>
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Security parameters trust disclaimer footer */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dark-200 border border-dark-300 rounded-3xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-black text-white mb-4">
              Edit Profile
            </h2>

            <div className="space-y-3">

              <input
                className="w-full p-3 rounded-xl bg-dark-100 border border-dark-300 text-white"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value,
                  })
                }
              />

              <input
                className="w-full p-3 rounded-xl bg-dark-100 border border-dark-300 text-white"
                placeholder="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: e.target.value,
                  })
                }
              />

              <input
                className="w-full p-3 rounded-xl bg-dark-100 border border-dark-300 text-white"
                placeholder="Occupation"
                value={formData.occupation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    occupation: e.target.value,
                  })
                }
              />

              <input
                className="w-full p-3 rounded-xl bg-dark-100 border border-dark-300 text-white"
                placeholder="Emergency Contact Name"
                value={formData.emergencyContactName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContactName: e.target.value,
                  })
                }
              />

              <input
                className="w-full p-3 rounded-xl bg-dark-100 border border-dark-300 text-white"
                placeholder="Emergency Contact Number"
                value={formData.emergencyContactNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContactNumber: e.target.value,
                  })
                }
              />

              <div className="flex gap-3 pt-3">
                <button
                  onClick={handleProfileSave}
                  className="flex-1 bg-brand-green text-dark-100 py-3 rounded-xl font-black"
                >
                  Save
                </button>

                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-brand-red text-white py-3 rounded-xl font-black"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <footer className="border-t border-dark-300 py-6 text-center text-xs text-dark-500 font-mono relative z-20">
        CarePulse patient timeline node • All sessions encrypted under TLS coordinates.
      </footer>
    </div>
  );
};
export default PatientProfileView;
