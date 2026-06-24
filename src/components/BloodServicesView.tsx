import React, { useState, useEffect } from "react";
import { Activity, ArrowLeft, Heart, Droplet, Clock, AlertTriangle } from "lucide-react";
import { api, IPatient } from "../services/api";

interface BloodServicesViewProps {
  onNavigate: (view: "landing" | "login" | "register" | "book" | "profile" | "admin" | "doctor" | "blood") => void;
  currentPatient: IPatient | null;
}

export const BloodServicesView: React.FC<BloodServicesViewProps> = ({ onNavigate, currentPatient }) => {
  const [activeTab, setActiveTab] = useState<"donate" | "request">("donate");
  const [bloodGroup, setBloodGroup] = useState(currentPatient?.bloodType || "");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [urgency, setUrgency] = useState<"normal" | "urgent" | "critical">("normal");
  const [hospitalName, setHospitalName] = useState("");
  const [contactPhone, setContactPhone] = useState(currentPatient?.phone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    setIsSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await api.blood.addDonor({
        patientId: currentPatient._id,
        patientName: currentPatient.name,
        age: age ? Number(age) : undefined,
        gender: gender || undefined,
        address: address || undefined,
        bloodGroup,
        medicalConditions,
      });
      if (res.success) {
        setSuccessMsg("Successfully registered as a blood donor. Thank you for saving lives!");
        setMedicalConditions("");
      } else {
        setErrorMsg("Failed to register. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    setIsSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await api.blood.addRequest({
        patientId: currentPatient._id,
        patientName: currentPatient.name,
        bloodGroup,
        unitsRequired,
        urgency,
        hospitalName,
        contactPhone,
      });
      if (res.success) {
        setSuccessMsg("Blood request submitted successfully. We will contact you soon.");
        setUnitsRequired(1);
        setHospitalName("");
      } else {
        setErrorMsg("Failed to submit request. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 flex flex-col items-center justify-center p-6 text-white relative">
      <div className="absolute top-[-5%] left-[-10%] w-[45%] h-[40%] rounded-full bg-brand-red/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-10%] w-[45%] h-[40%] rounded-full bg-brand-red/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <button
          onClick={() => onNavigate("profile")}
          className="mb-8 flex items-center text-dark-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-sm font-semibold uppercase tracking-wider">Return to Dashboard</span>
        </button>

        <div className="mb-8 flex items-center gap-3">
          <div className="bg-brand-red/20 p-3 rounded-2xl border border-brand-red/30 text-brand-red shadow-lg shadow-brand-red/10">
            <Droplet className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Blood <span className="text-brand-red">Services</span></h1>
            <p className="text-sm text-dark-500 font-mono mt-1 uppercase tracking-widest">Donate Blood or Request Emergency Supply</p>
          </div>
        </div>

        <div className="bg-dark-200 border border-dark-300 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => { setActiveTab("donate"); setSuccessMsg(""); setErrorMsg(""); }}
              className={`flex-1 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all ${activeTab === "donate"
                  ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                  : "bg-dark-100 text-dark-500 border border-dark-300 hover:text-white"
                }`}
            >
              <Heart className="w-4 h-4 inline mr-2" /> Register as Donor
            </button>
            <button
              onClick={() => { setActiveTab("request"); setSuccessMsg(""); setErrorMsg(""); }}
              className={`flex-1 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all ${activeTab === "request"
                  ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                  : "bg-dark-100 text-dark-500 border border-dark-300 hover:text-white"
                }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" /> Request Blood
            </button>
          </div>

          {successMsg && (
            <div className="mb-6 p-4 bg-brand-green/10 border border-brand-green/20 text-brand-green rounded-xl text-sm font-bold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 p-4 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-xl text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {errorMsg}
            </div>
          )}

          {activeTab === "donate" && (
            <form onSubmit={handleDonate} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-dark-500 mb-2">Blood Group</label>
                <select
                  required
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                >
                  <option value="">Select Blood Group</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-dark-500 mb-2">Age</label>
                  <input
                    type="number"
                    min="18"
                    max="65"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                    placeholder="e.g. 25"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-dark-500 mb-2">Gender</label>
                  <select
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-dark-500 mb-2">Residential Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                  placeholder="Street, City, Zip Code"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-dark-500 mb-2">Medical Conditions (Optional)</label>
                <textarea
                  rows={3}
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="Any current medical conditions or past surgeries we should know about..."
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-red hover:bg-brand-red/90 text-white rounded-xl py-4 font-black uppercase tracking-widest text-sm shadow-xl shadow-brand-red/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? <Activity className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5" />}
                {isSubmitting ? "Processing..." : "Register to Donate"}
              </button>
            </form>
          )}

          {activeTab === "request" && (
            <form onSubmit={handleRequest} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-dark-500 mb-2">Blood Group Needed</label>
                  <select
                    required
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                  >
                    <option value="">Select</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-dark-500 mb-2">Units Required</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(Number(e.target.value))}
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-dark-500 mb-2">Urgency Level</label>
                <div className="flex gap-3">
                  {["normal", "urgent", "critical"].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUrgency(u as any)}
                      className={`flex-1 py-3 border rounded-xl text-xs font-bold uppercase tracking-wider capitalize ${urgency === u
                          ? "bg-brand-red/10 border-brand-red text-brand-red"
                          : "bg-dark-100 border-dark-300 text-dark-500 hover:border-dark-400"
                        }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-dark-500 mb-2">Hospital / Clinic Name</label>
                <input
                  type="text"
                  required
                  placeholder="Where is the blood needed?"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-dark-500 mb-2">Contact Phone</label>
                <input
                  type="text"
                  required
                  placeholder="Contact number for emergencies"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-red hover:bg-brand-red/90 text-white rounded-xl py-4 font-black uppercase tracking-widest text-sm shadow-xl shadow-brand-red/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? <Activity className="w-5 h-5 animate-spin" /> : <Droplet className="w-5 h-5" />}
                {isSubmitting ? "Processing..." : "Submit Blood Request"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
