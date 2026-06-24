import React, { useState } from "react";
import {
  Activity,
  ShieldCheck,
  UserPlus,
  LogIn,
  CalendarCheck,
  ChevronRight,
  Mail,
  UserCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { api } from "../services/api";

interface LandingViewProps {
  onNavigate: (
    view:
      | "landing"
      | "login"
      | "register"
      | "book"
      | "profile"
      | "admin"
      | "forgot-password"
  ) => void;
  currentUser: any;
  currentPatient: any;
  onLoginSuccess?: (user: any) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  currentUser,
  currentPatient,
  onLoginSuccess
}) => {
  const [patientLoginEmail, setPatientLoginEmail] = useState("");
  const [patientLoginPass, setPatientLoginPass] = useState("");
  const [isLoggy, setIsLoggy] = useState(false);
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr(null);
    setIsLoggy(true);
    try {
      const res = await api.auth.login({
        email: patientLoginEmail,
        password: patientLoginPass,
      });
      if (onLoginSuccess) {
        await onLoginSuccess(res.user);
      } else {
        if (res.user.role === "patient") {
          // Query if profile exists
          try {
            const profileRes = await api.patients.getMe();
            if (profileRes.profile) {
              onNavigate("profile");
            } else {
              // Patient user exists but no profile yet, go to register
              onNavigate("register");
            }
          } catch {
            onNavigate("register");
          }
        } else {
          // Staff user role
          onNavigate("admin");
        }
      }
    } catch (err: any) {
      setLoginErr(err.message || "Invalid credentials. Please attempt again.");
    } finally {
      setIsLoggy(false);
    }
  };

  const handleQuickRedirect = () => {
    if (currentUser) {
      if (currentUser.role === "patient") {
        if (currentPatient) {
          onNavigate("profile");
        } else {
          onNavigate("register");
        }
      } else {
        onNavigate("admin");
      }
    } else {
      onNavigate("register");
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 relative text-white flex flex-col justify-between overflow-x-hidden font-sans" id="landing-container">
      {/* Absolute Dynamic Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-brand-green/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-brand-blue/5 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-dark-300 relative z-20">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="bg-brand-green/15 p-2.5 rounded-xl border border-brand-green/20">
            <Activity className="h-6 w-6 text-brand-green" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black leading-none">
              Medi<span className="text-brand-green">Connect</span>
            </h1>

            <span className="text-[10px] sm:text-xs text-gray-400 font-semibold tracking-wide">
              From Booking to Better Health
            </span>
          </div>
          <div className="hidden sm:flex items-center ml-2">
            <span className="bg-green-500 text-black font-black text-[10px] sm:text-xs px-2 py-1 rounded-md">
              SDG 3
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate("login")}
            className="text-xs text-gray-100 hover:text-white flex items-center gap-1.5 bg-dark-200 border border-dark-300 px-3.5 py-2 rounded-xl hover:bg-dark-300 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-brand-green" />
            Specialist Login
          </button>
        </div>
      </header>

      {/* Main hero grid section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 items-center gap-12  relative z-10 flex-grow">

        {/* Left column hero titles */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">

          {/* Trust Banner badge */}
          <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/20 rounded-full py-1.5 px-4">
            <ShieldCheck className="w-4 h-4 text-brand-green animate-pulse" />
            <span className="text-[10px] font-extrabold font-mono text-brand-green uppercase tracking-wider">SDG 3 • GOOD HEALTH & WELL-BEING</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            From Booking
            <br />
            to
            <span className="text-brand-green"> Better Health</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-100 max-w-xl leading-relaxed mx-auto lg:mx-0">
            MediConnect helps patients schedule appointments, manage healthcare records,
            connect with doctors, and receive timely medical care through a secure
            digital healthcare platform.
          </p>

          {/* Quick actions box */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-md pt-2 mx-auto lg:mx-0">
            <button
              onClick={handleQuickRedirect}
              className="px-6 py-3.5 bg-brand-green hover:bg-brand-green/90 text-dark-100 text-sm font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-green/15 transition-all cursor-pointer"
              id="hero-register-btn"
            >
              <UserPlus className="w-4.5 h-4.5" />
              <span>{currentUser ? "Go to Dashboard" : "Register Patient Account"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {!currentUser && (
              <button
                onClick={() => onNavigate("login")}
                className="px-6 py-3.5 bg-dark-200 hover:bg-dark-300 border border-dark-300 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4.5 h-4.5 text-brand-blue" />
                Staff Dashboard Portal
              </button>
            )}
          </div>

          {/* Trust indicators */}
          {/* MediConnect Highlights */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 border-t border-dark-300 pt-8 max-w-lg mx-auto lg:mx-0">

            <div className="space-y-1">
              <span className="block text-2xl font-black text-white">
                24/7
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-dark-500 font-bold">
                Appointment Access
              </span>
            </div>

            <div className="space-y-1">
              <span className="block text-2xl font-black text-brand-green">
                SDG 3
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-dark-500 font-bold">
                Health & Well-being
              </span>
            </div>

            <div className="space-y-1">
              <span className="block text-2xl font-black text-white">
                Secure
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-dark-500 font-bold">
                Patient Records
              </span>
            </div>

          </div>
        </div>

        {/* Right column - Fast Login box */}
        <div className="lg:col-span-5 relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full bg-brand-green/5 blur-3xl pointer-events-none" />

          <div className="relative bg-dark-200 border border-dark-300 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="border-b border-dark-300 pb-4">
              <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-brand-green" />
                <span>Patient Portal</span>
              </h3>
              <p className="text-xs text-gray-100 mt-1">Already registered? Sign in to manage appointments, view records, and track your healthcare journey.</p>
            </div>

            {loginErr && (
              <div className="p-3.5 bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-semibold rounded-xl">
                ⚠️ {loginErr}
              </div>
            )}

            <form onSubmit={handlePatientLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-100" />
                  <input
                    type="email"
                    required
                    value={patientLoginEmail}
                    onChange={(e) => setPatientLoginEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Your Password</label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-100" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={patientLoginPass}
                    onChange={(e) => setPatientLoginPass(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggy}
                className="w-full py-3.5 bg-brand-green hover:bg-brand-green/90 disabled:bg-dark-350 text-dark-100 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-brand-green/5 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                {isLoggy ? (
                  <>
                    <div className="w-4 h-4 border-2 border-dark-100 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Account...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Enter Patient Portal</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 flex flex-col gap-2">
              <span className="text-xs text-gray-100">
                New to MediConnect?{" "}
                <button
                  onClick={() => onNavigate("register")}
                  className="font-extrabold text-brand-green underline hover:text-brand-green/80 cursor-pointer"
                >
                  Register Patient Account
                </button>
              </span>
              <button
                onClick={() => onNavigate("forgot-password")}
                className="text-xs text-brand-green hover:text-brand-green/80 underline cursor-pointer self-center"
              >
                Forgot Password?
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Standard Legal Footer */}
      <footer className="border-t border-dark-300 bg-dark-150 relative z-20">
        <div className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-dark-500 font-mono">
          <span>© 2026 MediConnect. Advancing SDG 3 – Good Health & Well-being through accessible digital healthcare.</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Ordinance</span>
            <span className="hover:text-white cursor-pointer transition-colors font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-green" /> HIPAA Code Standard
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingView;
