import React, { useState, useEffect } from "react";
import { LandingView } from "./components/LandingView";
import { PatientRegistrationView } from "./components/PatientRegistrationView";
import { AdminLoginView } from "./components/AdminLoginView";
import { AppointmentBookingView } from "./components/AppointmentBookingView";
import { DashboardView } from "./components/DashboardView";
import { PatientProfileView } from "./components/PatientProfileView";
import { ForgotPasswordView } from "./components/ForgotPasswordView";
import { ResetPasswordView } from "./components/ResetPasswordView";
import { api, IUser, IPatient } from "./services/api";

type ViewState = "landing" | "login" | "register" | "book" | "profile" | "admin" | "forgot-password" | "reset-password";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>("landing");
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [currentPatient, setCurrentPatient] = useState<IPatient | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Parse session logs on system boot
  useEffect(() => {
    async function loadSession() {
      try {
        const path = window.location.pathname;
        const resetMatch = path.match(/^\/reset-password\/([a-f0-9]+)$/i);
        if (resetMatch) {
          setResetToken(resetMatch[1]);
          setCurrentView("reset-password");
          setIsInitializing(false);
          return;
        }

        const storedToken = localStorage.getItem("carepulse_token");
        const storedUserJson = localStorage.getItem("carepulse_user");

        if (storedToken && storedUserJson) {
          const userObj = JSON.parse(storedUserJson) as IUser;
          setCurrentUser(userObj);

          if (userObj.role === "patient") {
            try {
              const res = await api.patients.getMe();
              if (res.profile) {
                setCurrentPatient(res.profile);
                setCurrentView("profile");
              } else {
                setCurrentView("register");
              }
            } catch {
              setCurrentView("register");
            }
          } else if (userObj.role === "admin" || userObj.role === "doctor") {
            setCurrentView("admin");
          }
        }
      } catch (err) {
        console.error("Session mapping failure", err);
      } finally {
        setIsInitializing(false);
      }
    }

    loadSession();

    // Setup global logout triggers
    const handleLogoutTrigger = () => {
      setCurrentUser(null);
      setCurrentPatient(null);
      handleNavigate("landing");
    };

    window.addEventListener("carepulse_logout", handleLogoutTrigger);
    return () => {
      window.removeEventListener("carepulse_logout", handleLogoutTrigger);
    };
  }, []);

  const handleNavigate = (view: ViewState) => {
    if (view === "landing" || view === "login" || view === "register" || view === "forgot-password") {
      window.history.pushState({}, "", "/");
    }
    setCurrentView(view);
  };

  const handleLoginSuccess = async (user: IUser) => {
    setCurrentUser(user);
    if (user.role === "patient") {
      try {
        const res = await api.patients.getMe();
        if (res.profile) {
          setCurrentPatient(res.profile);
          setCurrentView("profile");
        } else {
          setCurrentView("register");
        }
      } catch {
        setCurrentView("register");
      }
    } else {
      setCurrentView("admin");
    }
  };

  const handleRegistrationSuccess = async (user: IUser) => {
    setCurrentUser(user);
    try {
      const res = await api.patients.getMe();
      if (res.profile) {
        setCurrentPatient(res.profile);
        setCurrentView("profile");
      } else {
        setCurrentView("profile");
      }
    } catch {
      setCurrentView("profile");
    }
  };

  const handleLogout = () => {
    api.auth.logout();
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0d0f10] flex flex-col items-center justify-center p-6 text-white space-y-4">
        <div className="w-8 h-8 border-3 border-[#24ae7c] border-t-transparent rounded-full animate-spin mx-auto" />
        <span className="font-mono text-xs uppercase tracking-widest text-gray-500">Initializing CarePulse Core...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0f10] select-none text-white">
      {currentView === "landing" && (
        <LandingView
          onNavigate={handleNavigate}
          currentUser={currentUser}
          currentPatient={currentPatient}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {currentView === "register" && (
        <PatientRegistrationView
          onNavigate={handleNavigate}
          onRegistrationSuccess={handleRegistrationSuccess}
        />
      )}

      {currentView === "login" && (
        <AdminLoginView
          onNavigate={handleNavigate}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {currentView === "book" && (
        <AppointmentBookingView
          onNavigate={handleNavigate}
          currentPatient={currentPatient}
        />
      )}

      {currentView === "profile" && (
        <PatientProfileView
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {currentView === "admin" && (
        <DashboardView
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {currentView === "forgot-password" && (
        <ForgotPasswordView
          onNavigate={handleNavigate}
        />
      )}

      {currentView === "reset-password" && (
        <ResetPasswordView
          token={resetToken || ""}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
