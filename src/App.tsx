import React, { useState, useEffect } from "react";
import { LandingView } from "./components/LandingView";
import { PatientRegistrationView } from "./components/PatientRegistrationView";
import { AdminLoginView } from "./components/AdminLoginView";
import { AppointmentBookingView } from "./components/AppointmentBookingView";
import { DashboardView } from "./components/DashboardView";
import { PatientProfileView } from "./components/PatientProfileView";
import { ForgotPasswordView } from "./components/ForgotPasswordView";
import { ResetPasswordView } from "./components/ResetPasswordView";
import { DoctorDashboardView } from "./components/DoctorDashboardView";
import { BloodServicesView } from "./components/BloodServicesView";
import { ThemeToggle } from "./components/ThemeToggle";
import { ToastContainer } from "./components/Toast";
import { api, IUser, IPatient } from "./services/api";

type ViewState = "landing" | "login" | "register" | "book" | "profile" | "admin" | "doctor" | "forgot-password" | "reset-password" | "blood";

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

        const storedToken = localStorage.getItem("MediConnect_token");
        const storedUserJson = localStorage.getItem("MediConnect_user");

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
          } else if (userObj.role === "admin") {
            setCurrentView("admin");
          } else if (userObj.role === "doctor") {
            setCurrentView("doctor");
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

    window.addEventListener("MediConnect_logout", handleLogoutTrigger);
    return () => {
      window.removeEventListener("MediConnect_logout", handleLogoutTrigger);
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
    } else if (user.role === "doctor") {
      setCurrentView("doctor");
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
      <div className="min-h-screen bg-dark-100 flex flex-col items-center justify-center p-6 text-white space-y-4">
        <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
        <span className="font-mono text-xs uppercase tracking-widest text-gray-500">Initializing MediConnect Core...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-100 select-none text-white transition-colors duration-300 relative">
      <ToastContainer />
      <ThemeToggle />
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

      {currentView === "doctor" && (
        <DoctorDashboardView
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

      {currentView === "blood" && (
        <BloodServicesView
          onNavigate={handleNavigate}
          currentPatient={currentPatient}
        />
      )}
    </div>
  );
}
