import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  MapPin,
  Briefcase,
  ShieldCheck,
  Heart,
  Activity,
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  BadgeCheck,
  CheckCircle,
} from "lucide-react";
import { api, IDoctor } from "../services/api";

interface PatientRegistrationViewProps {
  onNavigate: (view: "landing" | "login" | "register" | "book" | "profile" | "admin") => void;
  onRegistrationSuccess: (user: any) => void;
}

export const PatientRegistrationView: React.FC<PatientRegistrationViewProps> = ({
  onNavigate,
  onRegistrationSuccess
}) => {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication + Account step state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Personal details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");

  // Step 3: Emergency & Insurance details
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactNumber, setEmergencyContactNumber] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");

  // Step 4: Medical Info & Consent
  const [primaryPhysician, setPrimaryPhysician] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Validate fields for each step
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadResources() {
      try {
        setIsLoadingDocs(true);
        const res = await api.doctors.list();
        if (res.success && res.doctors.length > 0) {
          setDoctors(res.doctors);
          if (res.doctors[0]) {
            setPrimaryPhysician(res.doctors[0].name);
          }
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
        // Fallback standard selection
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        errors.email = "Please supply a valid email address.";
      }
      if (!password || password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
      }
    }

    if (currentStep === 2) {
      if (!name || name.trim().length < 2) {
        errors.name = "Full name must be at least 2 characters.";
      }
      if (!phone || phone.trim().length < 8) {
        errors.phone = "Provide a valid contact phone number (at least 8 digits).";
      }
      if (!birthDate) {
        errors.birthDate = "Date of birth is required.";
      }
      if (!address || address.trim().length < 5) {
        errors.address = "Complete address is required (min 5 characters).";
      }
      if (!occupation || occupation.trim().length < 2) {
        errors.occupation = "Occupation designation is required.";
      }
    }

    if (currentStep === 3) {
      if (!emergencyContactName || emergencyContactName.trim().length < 2) {
        errors.emergencyContactName = "Emergency contact name required.";
      }
      if (!emergencyContactNumber || emergencyContactNumber.trim().length < 8) {
        errors.emergencyContactNumber = "Emergency contact phone required.";
      }
      if (!insuranceProvider || insuranceProvider.trim().length < 2) {
        errors.insuranceProvider = "Insurance provider company required.";
      }
      if (!insurancePolicyNumber || insurancePolicyNumber.trim().length < 2) {
        errors.insurancePolicyNumber = "Insurance policy number required.";
      }
    }

    if (currentStep === 4) {
      if (!primaryPhysician) {
        errors.primaryPhysician = "Please select a health practitioner.";
      }
      if (!privacyConsent) {
        errors.privacyConsent = "You must accept the privacy parameters & consent details.";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
      setError(null);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Create Login User Credentials first (Auth register)
      let authUser;
      try {
        const registerRes = await api.auth.register({
          email,
          password,
          role: "patient"
        });
        authUser = registerRes.user;
      } catch (authErr: any) {
        if (authErr && authErr.message && authErr.message.includes("already registered")) {
          setError("This email address is already registered. Please go to Login room.");
          setIsSubmitting(false);
          return;
        }
        throw authErr;
      }

      // Build patient registration profile multipart payload
      const patientPayload = {
        name,
        email,
        phone,
        birthDate: new Date(birthDate),
        gender,
        address,
        occupation,
        emergencyContactName,
        emergencyContactNumber,
        insuranceProvider,
        insurancePolicyNumber,
        primaryPhysician,
        privacyConsent,
        allergies,
        medicalHistory
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(patientPayload));

      if (selectedFile) {
        formData.append("document", selectedFile);
      }

      // Dispatch patient profile registration
      const profileRes = await api.patients.registerProfile(formData);

      if (profileRes.success) {
        onRegistrationSuccess(authUser);
      } else {
        throw new Error("Unable to create Patient profile. Please verify your fields.");
      }

    } catch (err: any) {
      console.error("Patient Registration failure:", err);
      setError(err?.message || "An unexpected error occurred during patient profile setup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 flex flex-col justify-start relative text-white py-12 px-6" id="patient-registration-container">
      {/* Dynamic Background Blur */}
      <div className="absolute top-[-5%] left-[-10%] w-[45%] h-[40%] rounded-full bg-brand-green/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-10%] w-[45%] h-[40%] rounded-full bg-brand-blue/5 blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto w-full relative z-10 flex flex-col gap-8">

        {/* Brand Banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate("landing")}>
            <div className="bg-brand-green/25 p-2 rounded-xl border border-brand-green/30">
              <Activity className="h-5 w-5 text-brand-green" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">
                Care<span className="text-brand-green">Pulse</span>
              </span>
              <span className="block text-[8px] font-mono tracking-widest text-brand-green uppercase">Ecosystem Registry</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate("landing")}
            className="text-xs text-gray-100 hover:text-white flex items-center gap-1 bg-dark-200 border border-dark-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>
        </div>

        {/* Section Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-100 sm:text-4xl">
            Welcome to <span className="text-brand-green">CarePulse</span> 👋
          </h1>
          <p className="text-sm text-gray-300 max-w-lg leading-relaxed">
            Let's get you set up in our secure hospital network. Complete the four steps below to create a fully tracked patient profile and safe document history storage.
          </p>
        </div>

        {/* Step Progress Bar Visualizer */}
        <div className="bg-dark-200 border border-dark-300 rounded-2xl p-4 sm:p-6 grid grid-cols-4 gap-2 relative overflow-hidden" id="wizard-progress-bar">
          {[
            { stepNum: 1, title: "Account", icon: Mail },
            { stepNum: 2, title: "Personal", icon: User },
            { stepNum: 3, title: "Contacts", icon: Phone },
            { stepNum: 4, title: "Medical", icon: Heart },
          ].map((s, idx) => {
            const isActive = step >= s.stepNum;
            const isCurrent = step === s.stepNum;
            return (
              <div
                key={idx}
                className={`flex flex-col items-center text-center gap-2 relative ${isCurrent ? "opacity-100" : "opacity-60"}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-mono transition-all border ${isCurrent
                  ? "bg-brand-green text-dark-100 border-brand-green scale-110 shadow-lg shadow-brand-green/20"
                  : isActive
                    ? "bg-dark-300 text-brand-green border-brand-green"
                    : "bg-dark-100 text-gray-100 border-dark-300"
                  }`}>
                  {isActive && step > s.stepNum ? <CheckCircle className="w-4.5 h-4.5 stroke-[2.5]" /> : s.stepNum}
                </div>
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${isActive ? "text-brand-green" : "text-gray-100"}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Form Card Wrap */}
        <form onSubmit={handleSubmit} className="bg-dark-200 border border-dark-300 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">

          {error && (
            <div className="p-4 bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm font-semibold rounded-xl" id="register-error-msg">
              ⚠️ {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: Account Login Credentials */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
                id="form-step-1"
              >
                <div className="border-b border-dark-300 pb-3">
                  <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-brand-green" />
                    <span>Account Login Coordinates</span>
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">Specify an active email and secure password for future patient dashboard access or doctor scheduling.</p>
                </div>

                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-300" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. email@domain.com"
                        className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                        id="reg-input-email"
                      />
                    </div>
                    {validationErrors.email && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.email}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">Create Secure Password</label>
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-3.5 h-4 w-4 text-gray-300" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters recommended"
                        className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                        id="reg-input-password"
                      />
                    </div>
                    {validationErrors.password && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.password}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Personal Patient Profile Information */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
                id="form-step-2"
              >
                <div className="border-b border-dark-300 pb-3">
                  <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-green" />
                    <span>Personal Metrics</span>
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">Provide your general profile information accurately to correlate with clinical files.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">Full Registered Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-300" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                        id="reg-input-name"
                      />
                    </div>
                    {validationErrors.name && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.name}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">Contact Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-300" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                        id="reg-input-phone"
                      />
                    </div>
                    {validationErrors.phone && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.phone}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-gray-300" />
                      <input
                        type="date"
                        required
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                        id="reg-input-dob"
                      />
                    </div>
                    {validationErrors.birthDate && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.birthDate}</p>}
                  </div>

                  {/* Gender Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">Gender</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["male", "female", "other"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g as any)}
                          className={`py-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${gender === g
                            ? "bg-brand-green/20 text-brand-green border-brand-green shadow-sm"
                            : "bg-dark-100 text-gray-300 border-dark-300 hover:border-dark-400"
                            }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Occupation */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">Occupation</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-gray-300" />
                      <input
                        type="text"
                        required
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                        id="reg-input-occupation"
                      />
                    </div>
                    {validationErrors.occupation && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.occupation}</p>}
                  </div>

                  {/* Fully formatted Resident Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">Permanent Residence Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-300" />
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. 14 Wall Street, New York, NY"
                        className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                        id="reg-input-address"
                      />
                    </div>
                    {validationErrors.address && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.address}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Emergency Contacts & Health Insurance credentials */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
                id="form-step-3"
              >
                <div className="border-b border-dark-300 pb-3">
                  <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-brand-green" />
                    <span>Emergency Contacts & Insurance Coordinates</span>
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">Specify an associated guardian relative and insurance plan policies for safety parameters.</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-dark-100 p-4 rounded-xl border border-dark-300 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <h4 className="sm:col-span-2 text-xs font-extrabold tracking-widest text-brand-green uppercase">Emergency Contact Info</h4>

                    {/* Emergency Contact name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Contact Guardian Person</label>
                      <input
                        type="text"
                        required
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        placeholder="e.g. Mary Doe"
                        className="w-full bg-dark-200 border border-dark-300 rounded-xl py-3 px-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                        id="reg-input-emerg-name"
                      />
                      {validationErrors.emergencyContactName && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.emergencyContactName}</p>}
                    </div>

                    {/* Emergency Contact phone */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Contact Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={emergencyContactNumber}
                        onChange={(e) => setEmergencyContactNumber(e.target.value)}
                        placeholder="+1 (555) 999-9999"
                        className="w-full bg-dark-200 border border-dark-300 rounded-xl py-3 px-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                        id="reg-input-emerg-phone"
                      />
                      {validationErrors.emergencyContactNumber && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.emergencyContactNumber}</p>}
                    </div>
                  </div>

                  <div className="bg-dark-100 p-4 rounded-xl border border-dark-300 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <h4 className="sm:col-span-2 text-xs font-extrabold tracking-widest text-brand-blue uppercase">Insurance Policy Data</h4>

                    {/* Provider name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Insurance Provider Company</label>
                      <input
                        type="text"
                        required
                        value={insuranceProvider}
                        onChange={(e) => setInsuranceProvider(e.target.value)}
                        placeholder="e.g. BlueCross BlueShield"
                        className="w-full bg-dark-200 border border-dark-300 rounded-xl py-3 px-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                        id="reg-input-insurance"
                      />
                      {validationErrors.insuranceProvider && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.insuranceProvider}</p>}
                    </div>

                    {/* Policy number */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Policy ID Number</label>
                      <input
                        type="text"
                        required
                        value={insurancePolicyNumber}
                        onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                        placeholder="e.g. BCBS-99120-A"
                        className="w-full bg-dark-200 border border-dark-300 rounded-xl py-3 px-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                        id="reg-input-policy"
                      />
                      {validationErrors.insurancePolicyNumber && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.insurancePolicyNumber}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Primary Physician selection, allergies, document upload, and privacy parameters */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
                id="form-step-4"
              >
                <div className="border-b border-dark-300 pb-3">
                  <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-brand-green" />
                    <span>Medical Profile & Safety Parameters</span>
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 font-medium">Almost finished. Provide clinical details to assign health practitioners and upload scanning diagnostics.</p>
                </div>

                <div className="space-y-4">
                  {/* Physician selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">Primary Health Practitioner Selection</label>
                    {isLoadingDocs ? (
                      <div className="h-11 w-full bg-dark-100 animate-pulse rounded-xl" />
                    ) : (
                      <select
                        value={primaryPhysician}
                        onChange={(e) => setPrimaryPhysician(e.target.value)}
                        className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-green transition-all select-none"
                        id="reg-select-physician"
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

                  {/* Medical History */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">Past Allergies (Optional)</label>
                      <textarea
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="e.g. Shellfish, Penicillin, Pollen..."
                        rows={3}
                        className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all resize-none"
                        id="reg-input-allergies"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">Medical History & Notes (Optional)</label>
                      <textarea
                        value={medicalHistory}
                        onChange={(e) => setMedicalHistory(e.target.value)}
                        placeholder="e.g. Asthma, Hypertension diagnosed in 2021..."
                        rows={3}
                        className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all resize-none"
                        id="reg-input-history"
                      />
                    </div>
                  </div>

                  {/* Advanced Drag and Drop File Upload for Medical Documents */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">Scanned Clinical/Insurance Documents </label>
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all relative ${dragActive
                        ? "border-brand-green bg-brand-green/5"
                        : selectedFile
                          ? "border-brand-blue bg-brand-blue/5"
                          : "border-dark-300 hover:border-dark-400 bg-dark-100"
                        }`}
                      id="document-drag-upload-zone"
                    >
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        className="hidden"
                        id="medical-file-picker"
                      />

                      {selectedFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-brand-blue/15 text-brand-blue rounded-xl">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white max-w-[250px] truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-gray-300 mt-0.5 font-mono">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Drag or click to change
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="mt-2 text-[10px] font-bold text-brand-red px-2 py-1 rounded bg-brand-red/10 border border-brand-red/20 cursor-pointer"
                          >
                            Remove File
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="medical-file-picker" className="cursor-pointer flex flex-col items-center gap-2">
                          <div className="p-3 bg-dark-300 text-brand-green rounded-xl border border-dark-400">
                            <Upload className="w-6 h-6 animate-bounce" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-brand-green">Click to select files</span>
                            <span className="text-xs text-gray-300"> or drag and drop PDFs, PNGs or Word docs</span>
                            <p className="text-[10px] text-dark-500 mt-1 font-medium">Max upload size: 5MB</p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Privacy Consent Parameters */}
                  <div className="p-4 bg-dark-300 border border-dark-400 rounded-xl space-y-3">
                    <h4 className="text-xs font-extrabold tracking-wider uppercase text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-brand-green" />
                      <span>Ecosystem Legal Notice Consent</span>
                    </h4>

                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={privacyConsent}
                        onChange={(e) => setPrivacyConsent(e.target.checked)}
                        className="mt-1 accent-brand-green w-4 h-4 rounded"
                        id="checkbox-consent"
                      />
                      <span className="text-[11px] text-gray-300 leading-tight">
                        I hereby consent to treatment instructions, diagnostic tracking, and coordinate storage parameters aligned to HIPAA privacy standards configured by CarePulse platform admins.
                      </span>
                    </label>
                    {validationErrors.privacyConsent && <p className="text-brand-red text-xs mt-1 font-semibold">{validationErrors.privacyConsent}</p>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Wizards Actions Row */}
          <div className="flex items-center justify-between pt-4 border-t border-dark-300">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2.5 bg-dark-300 hover:bg-dark-400 text-xs font-bold text-white rounded-xl border border-dark-400 flex items-center gap-1.5 transition-all cursor-pointer"
                id="wizard-prev-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Step
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-5 py-2.5 bg-brand-green hover:bg-brand-green/90 text-dark-100 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-green/10 transition-all cursor-pointer"
                id="wizard-next-btn"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-green hover:bg-brand-green/90 disabled:bg-dark-450 text-dark-100 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-green/15 cursor-pointer disabled:cursor-not-allowed transition-all"
                id="wizard-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-dark-100 border-t-transparent rounded-full animate-spin" />
                    <span>Registering Patient...</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4.5 h-4.5" />
                    <span>Register Clinic Account</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Security parameters trust disclaimer footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-dark-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
          <span>CarePulse uses end-to-end sandbox storage. Your data is under strict authorization logs.</span>
        </div>
      </div>
    </div>
  );
};
export default PatientRegistrationView;
