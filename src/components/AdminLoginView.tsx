import React, { useState } from "react";
import { 
  LogIn, 
  Mail, 
  UserCheck, 
  Activity, 
  ArrowLeft, 
  ShieldAlert 
} from "lucide-react";
import { api } from "../services/api";

interface AdminLoginViewProps {
  onNavigate: (view: "landing" | "login" | "register" | "book" | "profile" | "admin") => void;
  onLoginSuccess: (user: any) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ 
  onNavigate,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.auth.login({ email, password });
      
      // Specialist panel only accepts admin or doctor roles
      if (res.user.role === "admin" || res.user.role === "doctor") {
        onLoginSuccess(res.user);
      } else {
        setError("Unauthorized access. This gate requires administrative or practitioner authorization logs.");
      }
    } catch (err: any) {
      setError(err?.message || "Invalid authentication. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 flex flex-col justify-between text-white relative py-12 px-6" id="admin-login-view">
      {/* Absolute Dynamic Gradients */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] rounded-full bg-brand-green/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[45%] h-[40%] rounded-full bg-brand-blue/5 blur-[100px] pointer-events-none" />

      {/* Brand Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("landing")}>
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
          onClick={() => onNavigate("landing")}
          className="text-xs text-gray-150 hover:text-white flex items-center gap-1.5 bg-dark-200 border border-dark-300 px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Home Base
        </button>
      </div>

      {/* Content Form Box */}
      <div className="max-w-md mx-auto w-full relative z-10">
        <div className="bg-dark-200 border border-dark-300 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
          <div className="border-b border-dark-300 pb-4">
            <h3 className="text-xl font-extrabold text-neutral-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-green" />
              <span>Specialist Access Terminal</span>
            </h3>
            <p className="text-xs text-slate-100 mt-1">Authenticate credentials to initiate scheduling grids, cancel bookings, or query diagnostics.</p>
          </div>

          {error && (
            <div className="p-4 bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-semibold rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Administrative Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-100" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="specialist@carepulse.com"
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                  id="admin-email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Terminal Key Entry (Password)</label>
              <div className="relative">
                <UserCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-100" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-brand-green transition-all"
                  id="admin-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-brand-green hover:bg-brand-green/90 disabled:bg-dark-350 text-dark-100 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-brand-green/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-all"
              id="admin-login-submit"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark-100 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Terminal Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Connect Specialist Node</span>
                </>
              )}
            </button>
          </form>

          {/* Demonstration Notice */}
          <div className="p-3 bg-brand-blue/5 border border-brand-blue/20 rounded-xl text-[10px] text-brand-blue leading-relaxed font-mono">
            💡 <strong>Sandbox Tip:</strong> Register as a patient or log in with any testing coordinates. Staff accounts use standard seed profiles.
          </div>
        </div>
      </div>

      {/* Sandbox credits disclaimer */}
      <span className="text-center text-[10px] text-dark-500 font-mono relative z-10 pr-2">
        CarePulse specialist portal • Admin clearance logs required.
      </span>
    </div>
  );
};
export default AdminLoginView;
