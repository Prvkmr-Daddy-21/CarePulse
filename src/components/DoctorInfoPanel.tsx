import React from "react";
import { IDoctor } from "../services/api";
import { Activity } from "lucide-react";

interface DoctorInfoPanelProps {
  doctor: IDoctor | null;
  stats: {
    total: number;
    pending: number;
    scheduled: number;
    completed: number;
  };
}

export const DoctorInfoPanel: React.FC<DoctorInfoPanelProps> = ({ doctor, stats }) => {
  if (!doctor) return null;

  return (
    <div className="bg-dark-200 border border-dark-300 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 flex-shrink-0">
      
      {/* Top Section: Left and Right Profiles */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-green/20 border-2 border-brand-green/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-green/10">
            <Activity className="w-6 h-6 text-brand-green" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">{doctor.name}</h2>
              <span className={`w-2 h-2 rounded-full ${doctor.status === 'active' ? 'bg-brand-green' : 'bg-dark-500 animate-pulse'}`} />
            </div>
            <p className="text-brand-green font-bold text-xs tracking-wide">{doctor.specialty}</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          {doctor.email && (
            <div className="flex items-center gap-1.5">
              <span className="text-dark-500 font-bold uppercase tracking-wider text-[9px]">Email:</span>
              <a href={`mailto:${doctor.email}`} className="text-white hover:text-brand-green transition-colors">{doctor.email}</a>
            </div>
          )}
          {doctor.qualification && (
            <div className="flex items-center gap-1.5">
              <span className="text-dark-500 font-bold uppercase tracking-wider text-[9px]">Qual:</span>
              <span className="text-white">{doctor.qualification}</span>
            </div>
          )}
          {doctor.experience && (
            <div className="flex items-center gap-1.5">
              <span className="text-dark-500 font-bold uppercase tracking-wider text-[9px]">Exp:</span>
              <span className="text-white">{doctor.experience} Years</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-dark-500 font-bold uppercase tracking-wider text-[9px]">Appts:</span>
            <span className="text-brand-green font-bold">{stats.total}</span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 border-t border-dark-300 pt-3">
        {doctor.qualification && (
          <span className="px-2 py-0.5 bg-dark-100 border border-dark-300 rounded text-[9px] font-bold text-gray-300">
            {doctor.qualification}
          </span>
        )}
        {doctor.experience && (
          <span className="px-2 py-0.5 bg-dark-100 border border-dark-300 rounded text-[9px] font-bold text-gray-300">
            {doctor.experience} Years
          </span>
        )}
        <span className={`px-2 py-0.5 border rounded text-[9px] font-bold ${doctor.status === 'active' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-dark-100 text-dark-500 border-dark-300'}`}>
          {doctor.status === 'active' ? 'Available' : 'Unavailable'}
        </span>
        <span className="px-2 py-0.5 bg-dark-100 border border-dark-300 rounded text-[9px] font-bold text-gray-300">
          {stats.total} Appointments
        </span>
      </div>
      
    </div>
  );
};
