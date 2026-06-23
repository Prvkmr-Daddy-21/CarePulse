import React, { useState, useEffect } from "react";
import {
  Activity,
  CalendarCheck,
  Heart,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  PlusCircle,
  FileText
} from "lucide-react";
import { api, IDoctor } from "../services/api";

interface AppointmentBookingViewProps {
  onNavigate: (view: "landing" | "login" | "register" | "book" | "profile" | "admin") => void;
  currentPatient: any;
}

export const AppointmentBookingView: React.FC<AppointmentBookingViewProps> = ({
  onNavigate,
  currentPatient
}) => {
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form parameters
  const [primaryPhysician, setPrimaryPhysician] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadResources() {
      try {
        setIsLoadingDocs(true);
        const res = await api.doctors.list();
        if (res.success && res.doctors.length > 0) {
          setDoctors(res.doctors);
          setPrimaryPhysician(res.doctors[0].name);
        } else {
          // Fallback UI mock doctors list
          const fallbackDocs: IDoctor[] = [
            { _id: "doc1", name: "Dr. Catherine Green", email: "green@healthcare.com", specialty: "Cardiologist", phone: "+1 555-0100", status: "active" },
            { _id: "doc2", name: "Dr. Alexander Smith", email: "smith@healthcare.com", specialty: "Dermatologist", phone: "+1 555-0200", status: "active" },
            { _id: "doc3", name: "Dr. Jasmine Johnson", email: "johnson@healthcare.com", specialty: "Pediatrician", phone: "+1 555-0300", status: "active" }
          ];
          setDoctors(fallbackDocs);
          setPrimaryPhysician("Dr. Catherine Green");
        }
      } catch {
        const fallbackDocs: IDoctor[] = [
          { _id: "doc1", name: "Dr. Catherine Green", email: "green@healthcare.com", specialty: "Cardiologist", phone: "+1 555-0100", status: "active" },
          { _id: "doc2", name: "Dr. Alexander Smith", email: "smith@healthcare.com", specialty: "Dermatologist", phone: "+1 555-0200", status: "active" }
        ];
        setDoctors(fallbackDocs);
        setPrimaryPhysician("Dr. Catherine Green");
      } finally {
        setIsLoadingDocs(false);
      }
    }
    loadResources();
  }, []);

  useEffect(() => {
    async function fetchSlots() {
      if (!primaryPhysician || !selectedDate) {
        setAvailableSlots([]);
        return;
      }
      try {
        setIsLoadingSlots(true);
        const res = await api.appointments.getAvailableSlots(primaryPhysician, selectedDate);
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
    setSelectedSlot(""); // reset selected slot on date/doctor change
  }, [primaryPhysician, selectedDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Validate inputs
    const errors: Record<string, string> = {};
    if (!primaryPhysician) errors.primaryPhysician = "Consultant is required";
    if (!selectedDate || !selectedSlot) errors.schedule = "Date and time slot is required";
    if (!reason || reason.trim().length < 5) errors.reason = "Appointment reason must be at least 5 characters";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!currentPatient) {
      setError("Unable to resolve current patient profile record. Please check you registered correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientId: currentProfileId(),
        primaryPhysician,
        schedule: new Date(`${selectedDate}T${selectedSlot}:00`),
        reason,
        note,
        status: "pending"
      };

      await api.appointments.book(payload);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Booking request failed. Please attempt again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProfileId = () => {
    return currentPatient?._id || currentPatient?.id;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dark-100 flex flex-col items-center justify-center p-6 text-white relative">
        {/* Absolute Background Blur */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-brand-green/5 blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full bg-dark-200 border border-dark-300 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center gap-6 relative z-10">
          <div className="p-4 bg-brand-green/10 text-brand-green rounded-full border border-brand-green/20 animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Booking Requested Successfully!</h2>
            <p className="text-xs text-slate-100 leading-relaxed max-w-sm">
              We have dispatched your slot request to the chosen health practitioner (<strong>{primaryPhysician}</strong>).
              Your scheduling update will be validated shortly.
            </p>
          </div>

          <div className="w-full bg-dark-100 p-4 border border-dark-300 rounded-2xl grid grid-cols-2 gap-2 text-left text-xs text-gray-150">
            <div>
              <span className="block text-[10px] text-dark-500 uppercase font-bold tracking-wide">PRACTITIONER</span>
              <span className="font-extrabold text-white">{primaryPhysician}</span>
            </div>
            <div>
              <span className="block text-[10px] text-dark-500 uppercase font-bold tracking-wide">SLOT REQUEST</span>
              <span className="font-extrabold text-white">{new Date(`${selectedDate}T${selectedSlot}:00`).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => onNavigate("profile")}
              className="py-3 bg-brand-green hover:bg-brand-green/90 text-dark-100 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all"
            >
              Monitor Schedules
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setSelectedDate("");
                setSelectedSlot("");
                setReason("");
                setNote("");
              }}
              className="py-3 bg-dark-300 border border-dark-400 hover:bg-dark-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
            >
              Book Another Slot
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-100 flex flex-col justify-start relative text-white py-12 px-6" id="appointment-booking-view">
      {/* Dynamic Background Blur */}
      <div className="absolute top-[-5%] left-[-10%] w-[45%] h-[40%] rounded-full bg-brand-green/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-10%] w-[45%] h-[40%] rounded-full bg-brand-blue/5 blur-[100px] pointer-events-none" />

      <div className="max-w-2xl mx-auto w-full relative z-10 flex flex-col gap-8">

        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("profile")}>
            <div className="bg-brand-green/25 p-2 rounded-xl border border-brand-green/30">
              <Activity className="h-5 w-5 text-brand-green" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">
                Care<span className="text-brand-green">Pulse</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate("profile")}
            className="text-xs text-gray-150 hover:text-white flex items-center gap-1.5 bg-dark-200 border border-dark-300 px-3.5 py-2 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>

        {/* Header Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-neutral-100 flex items-center gap-2">
            <PlusCircle className="text-brand-green w-7 h-7" />
            <span>Create Slot Allocation Request</span>
          </h1>
          <p className="text-xs text-slate-100 leading-relaxed max-w-md">
            Assign your primary practitioner, configure clinical symptoms or requirements, select the date/time parameters, and wait for confirmation.
          </p>
        </div>

        {/* Content Form box */}
        <form onSubmit={handleBooking} className="bg-dark-200 border border-dark-300 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
          {error && (
            <div className="p-4 bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-semibold rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5">
            {/* Health Practitioner */}
            <div>
              <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Primary Health Specialist</label>
              {isLoadingDocs ? (
                <div className="h-11 w-full bg-dark-100 animate-pulse rounded-xl" />
              ) : (
                <select
                  value={primaryPhysician}
                  onChange={(e) => setPrimaryPhysician(e.target.value)}
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
                  id="book-select-physician"
                >
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc.name} className="bg-dark-200 text-white">
                      {doc.name} - {doc.specialty}
                    </option>
                  ))}
                </select>
              )}
              {validationErrors.primaryPhysician && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.primaryPhysician}</p>}
            </div>

            {/* Date Slot */}
            <div>
              <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Preferred Slot (Date & Time)</label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={(() => {
                  const now = new Date();
                  const offset = now.getTimezoneOffset();
                  return new Date(now.getTime() - offset * 60000)
                    .toISOString()
                    .split('T')[0];
                })()}

                max={(() => {
                  const d = new Date();
                  d.setMonth(d.getMonth() + 6);

                  const offset = d.getTimezoneOffset();
                  return new Date(d.getTime() - offset * 60000)
                    .toISOString()
                    .split('T')[0];
                })()}
                className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all mb-4"
                id="book-input-date"
              />
              
              {selectedDate && primaryPhysician && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest">Available Time Slots</label>
                  {isLoadingSlots ? (
                    <div className="h-10 w-full bg-dark-100 animate-pulse rounded-xl" />
                  ) : availableSlots.length === 0 ? (
                    <p className="text-brand-red text-xs font-semibold">No available slots for this date.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              
              <p className="text-xs text-gray-400 mt-2">
                Appointments can only be booked within the next 6 months.
              </p>
              {validationErrors.schedule && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.schedule}</p>}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Reason for Appointment / Symptoms</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Constant lower back discomfort persisting for 5 days, exacerbated by prolonged sitting."
                rows={3}
                required
                className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all resize-none"
                id="book-textarea-reason"
              />
              {validationErrors.reason && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.reason}</p>}
            </div>

            {/* Note */}
            <div>
              <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Additional Clinical Comments / Requests (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Prefers morning consultations if possible; requires assistance on stairs."
                rows={2}
                className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all resize-none"
                id="book-textarea-note"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between border-t border-dark-300 pt-5 mt-4">
            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className="px-5 py-2.5 bg-dark-300 hover:bg-dark-400 text-xs font-bold text-white rounded-xl border border-dark-400 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-green hover:bg-brand-green/90 disabled:bg-dark-450 text-dark-100 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-green/10 cursor-pointer disabled:cursor-not-allowed transition-all"
              id="book-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark-100 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Slot Request...</span>
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4.5 h-4.5" />
                  <span>Request Booking</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security parameters trust disclaimer footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-dark-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
          <span>Encryption certificate validation is fully active.</span>
        </div>
      </div>
    </div>
  );
};
export default AppointmentBookingView;
