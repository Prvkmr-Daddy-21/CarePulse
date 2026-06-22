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
  Calendar,
  CheckCircle,
  FileMinus,
  UserPlus,
  Mail,
  UserCheck,
  Phone,
  Briefcase,
  Award,
  Eye,
  EyeOff,
  Stethoscope,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { api, IDoctor } from "../services/api";

export const DoctorManagementSection: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [sortFilter, setSortFilter] = useState("appointments");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Add Doctor Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialty: "",
    qualification: "",
    experience: 0,
    status: "active" as "active" | "inactive"
  });
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // View Dashboard Modal
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  useEffect(() => {
    async function loadDoctorAppointments() {
      if (!selectedDoctor) {
        setRecentAppointments([]);
        return;
      }
      setIsLoadingAppointments(true);
      try {
        const res = await api.appointments.list({ doctor: selectedDoctor.name });
        if (res.success) {
          // Sort descending and take top 10
          const sorted = [...res.appointments].sort((a, b) => new Date(b.schedule).getTime() - new Date(a.schedule).getTime());
          setRecentAppointments(sorted.slice(0, 10));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingAppointments(false);
      }
    }
    loadDoctorAppointments();
  }, [selectedDoctor]);

  async function loadDoctors() {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.doctors.getStats();
      if (res.success) {
        setDoctors(res.doctors);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load doctor statistics.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setIsAdding(true);
    try {
      const res = await api.doctors.addDoctor(addForm);
      if (res.success) {
        await loadDoctors();
        setIsAddModalOpen(false);
        setAddForm({
          name: "",
          email: "",
          password: "",
          phone: "",
          specialty: "",
          qualification: "",
          experience: 0,
          status: "active"
        });
      }
    } catch (err: any) {
      setAddError(err?.message || "Failed to add doctor.");
    } finally {
      setIsAdding(false);
    }
  };

  // Compile system statistics
  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter(d => d.status === "active").length;

  const filteredDoctors = doctors.filter((doc) => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      doc.name.toLowerCase().includes(lowerSearch) ||
      doc.email.toLowerCase().includes(lowerSearch) ||
      doc.specialty.toLowerCase().includes(lowerSearch)
    );
  });

  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    if (sortFilter === "appointments") {
      return (b.stats?.total || 0) - (a.stats?.total || 0);
    } else if (sortFilter === "completed") {
      return (b.stats?.completed || 0) - (a.stats?.completed || 0);
    } else if (sortFilter === "pending") {
      return (b.stats?.pending || 0) - (a.stats?.pending || 0);
    } else if (sortFilter === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const totalFiltered = sortedDoctors.length;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalFiltered);
  const paginatedDoctors = sortedDoctors.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8 w-full animate-in fade-in duration-300">
      {/* Statistics highlights bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="doctor-stats-cards">
        <div className="bg-dark-200 border border-dark-300 hover:border-purple-500/50 rounded-2xl p-5 flex items-center gap-4 transition-all shadow-xl">
          <div className="p-3 rounded-xl border bg-purple-500/10 text-purple-400 border-purple-500/15">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-white leading-none">{totalDoctors}</span>
            <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Total Doctors</span>
          </div>
        </div>

        <div className="bg-dark-200 border border-dark-300 hover:border-brand-green/50 rounded-2xl p-5 flex items-center gap-4 transition-all shadow-xl">
          <div className="p-3 rounded-xl border bg-brand-green/10 text-brand-green border-brand-green/15">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-white leading-none">{activeDoctors}</span>
            <span className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Active Doctors</span>
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
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name, email, specialty..."
              className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
            />
          </div>
        </form>

        {/* Right - Tabs and Doctor filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
             <label className="text-xs text-gray-150 font-bold uppercase tracking-widest">Sort By:</label>
             <select 
               value={sortFilter}
               onChange={(e) => { setSortFilter(e.target.value); setCurrentPage(1); }}
               className="bg-dark-100 border border-dark-300 text-white text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-brand-green"
             >
               <option value="appointments">Most Appointments</option>
               <option value="name">Name</option>
               <option value="completed">Most Completed</option>
               <option value="pending">Most Pending</option>
             </select>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-brand-green hover:bg-brand-green/90 text-dark-100 font-bold text-xs uppercase tracking-widest rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-green/10 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Doctor
          </button>
        </div>
      </section>

      {/* Database grid panel table */}
      <section className="bg-dark-200 border border-dark-300 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="p-12 text-center text-dark-500 font-mono space-y-4">
            <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
            <span>Loading doctors...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-brand-red font-semibold">
            ⚠️ {error}
          </div>
        ) : totalFiltered === 0 ? (
          <div className="p-12 text-center text-dark-500 space-y-2">
            <FileMinus className="w-10 h-10 mx-auto text-dark-400" />
            <p className="font-extrabold text-sm text-neutral-100">No doctors match the active criteria.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {totalFiltered > 0 && (
              <div className="px-5 py-3 border-b border-dark-300 bg-dark-100/30 flex justify-between items-center">
                <span className="text-xs font-bold text-dark-500 uppercase tracking-widest">
                  Showing {startIndex + 1}–{endIndex} of {totalFiltered} doctors
                </span>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" id="doctors-data-table">
              <thead>
                <tr className="bg-dark-100/50 border-b border-dark-300 text-[10px] uppercase font-mono tracking-widest text-dark-500 font-black">
                  <th className="py-4 px-5">Doctor Info</th>
                  <th className="py-4 px-5">Specialization</th>
                  <th className="py-4 px-5">Experience</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Appointments</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-300 text-xs text-gray-150">
                {paginatedDoctors.map((doc) => (
                  <tr key={doc._id} className="hover:bg-dark-100/25 transition-colors">
                    {/* Info */}
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col">
                        <span className="font-black text-white text-sm">{doc.name}</span>
                        <span className="text-[10px] text-dark-500 font-mono">{doc.email}</span>
                        <span className="text-[10px] text-dark-500 font-mono">{doc.phone}</span>
                      </div>
                    </td>

                    {/* Specialization */}
                    <td className="py-3.5 px-5 font-semibold text-neutral-100">
                      {doc.specialty}
                    </td>

                    {/* Experience */}
                    <td className="py-3.5 px-5 font-semibold text-neutral-100">
                      {doc.experience || 0} years
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${doc.status === "active"
                        ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                        : "bg-brand-red/10 text-brand-red border border-brand-red/20"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${doc.status === "active" ? "bg-brand-green" : "bg-brand-red"}`} />
                        <span>{doc.status}</span>
                      </span>
                    </td>

                    {/* Appointments Stats */}
                    <td className="py-3.5 px-5">
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-white bg-dark-100 px-2 py-1 rounded-lg border border-dark-300" title="Total">
                          T: {doc.stats?.total || 0}
                        </span>
                        <span className="text-xs font-bold text-brand-orange bg-brand-orange/10 px-2 py-1 rounded-lg border border-brand-orange/20" title="Pending">
                          P: {doc.stats?.pending || 0}
                        </span>
                        <span className="text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded-lg border border-brand-green/20" title="Scheduled">
                          S: {doc.stats?.scheduled || 0}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedDoctor(doc)}
                        className="px-3 py-1.5 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue hover:bg-brand-blue/15 text-[10px] uppercase font-black tracking-wider rounded-lg cursor-pointer transition-all"
                      >
                        View Dashboard
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-5 border-t border-dark-300 bg-dark-100/30">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-dark-100 hover:bg-dark-200 border border-dark-300 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-[10px] text-dark-500 font-bold uppercase tracking-widest">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-dark-100 hover:bg-dark-200 border border-dark-300 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Add Doctor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <form
            onSubmit={handleAddSubmit}
            className="bg-dark-200 border border-dark-300 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 my-auto"
          >
            <div className="border-b border-dark-300 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-neutral-100 flex items-center gap-2">
                  <UserPlus className="text-brand-green w-5 h-5" />
                  <span>Register New Doctor</span>
                </h3>
                <p className="text-xs text-slate-100 mt-1">
                  Create a new specialist account and profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 bg-dark-300 hover:bg-dark-400 rounded-xl transition-all cursor-pointer"
              >
                <XOctagon className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {addError && (
              <div className="p-3.5 bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-semibold rounded-xl">
                ⚠️ {addError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Dr. John Doe"
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="john.doe@hospital.com"
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Secure password"
                    className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 pl-4 pr-10 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Specialization</label>
                <input
                  type="text"
                  required
                  value={addForm.specialty}
                  onChange={(e) => setAddForm({ ...addForm, specialty: e.target.value })}
                  placeholder="e.g. Cardiologist"
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Qualification</label>
                <input
                  type="text"
                  required
                  value={addForm.qualification}
                  onChange={(e) => setAddForm({ ...addForm, qualification: e.target.value })}
                  placeholder="e.g. MD, PhD"
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Years of Experience</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={addForm.experience}
                  onChange={(e) => setAddForm({ ...addForm, experience: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Status</label>
                <select
                  required
                  value={addForm.status}
                  onChange={(e) => setAddForm({ ...addForm, status: e.target.value as "active" | "inactive" })}
                  className="w-full bg-dark-100 border border-dark-300 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-brand-green transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-dark-300 pt-5 gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 bg-dark-300 hover:bg-dark-400 border border-dark-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="px-6 py-2.5 bg-brand-green hover:bg-brand-green/90 text-dark-100 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-brand-green/10 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                {isAdding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-dark-100 border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Doctor</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctor Performance Overview Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-dark-200 border border-dark-300 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-8 animate-in fade-in zoom-in duration-150 my-auto">
            <div className="flex justify-between items-start border-b border-dark-300 pb-4">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-brand-green/20 rounded-2xl flex items-center justify-center border border-brand-green/30">
                  <Stethoscope className="w-8 h-8 text-brand-green" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedDoctor.name}</h2>
                  <p className="text-sm text-brand-green font-bold uppercase tracking-wider">{selectedDoctor.specialty}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="p-2 bg-dark-300 hover:bg-dark-400 rounded-xl transition-all cursor-pointer"
              >
                <XOctagon className="w-6 h-6 text-gray-300" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Info Column */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-dark-500 uppercase tracking-widest border-b border-dark-300 pb-2">Doctor Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-150">
                    <Mail className="w-4 h-4 text-brand-green" />
                    <span>{selectedDoctor.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-150">
                    <Phone className="w-4 h-4 text-brand-green" />
                    <span>{selectedDoctor.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-150">
                    <Briefcase className="w-4 h-4 text-brand-green" />
                    <span>{selectedDoctor.experience || 0} Years Experience</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-150">
                    <Award className="w-4 h-4 text-brand-green" />
                    <span>{selectedDoctor.qualification || "Not specified"}</span>
                  </div>
                </div>
              </div>

              {/* Stats Column */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-black text-dark-500 uppercase tracking-widest border-b border-dark-300 pb-2">Doctor Analytics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-dark-100 border border-dark-300 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-white">{selectedDoctor.stats?.total || 0}</span>
                    <span className="text-[10px] text-dark-500 font-bold uppercase tracking-widest mt-1">Total</span>
                  </div>
                  <div className="bg-dark-100 border border-dark-300 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-brand-orange">{selectedDoctor.stats?.pending || 0}</span>
                    <span className="text-[10px] text-dark-500 font-bold uppercase tracking-widest mt-1">Pending</span>
                  </div>
                  <div className="bg-dark-100 border border-dark-300 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-brand-green">{selectedDoctor.stats?.scheduled || 0}</span>
                    <span className="text-[10px] text-dark-500 font-bold uppercase tracking-widest mt-1">Scheduled</span>
                  </div>
                  <div className="bg-dark-100 border border-dark-300 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-cyan-400">{selectedDoctor.stats?.completed || 0}</span>
                    <span className="text-[10px] text-dark-500 font-bold uppercase tracking-widest mt-1">Completed</span>
                  </div>
                  <div className="bg-dark-100 border border-dark-300 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-brand-red">{selectedDoctor.stats?.cancelled || 0}</span>
                    <span className="text-[10px] text-dark-500 font-bold uppercase tracking-widest mt-1">Cancelled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="space-y-4 border-t border-dark-300 pt-6">
              <h3 className="text-xs font-black text-dark-500 uppercase tracking-widest border-b border-dark-300 pb-2">Recent Appointments</h3>
              {isLoadingAppointments ? (
                <div className="p-4 text-center text-dark-500 font-mono text-xs">
                  Loading appointments...
                </div>
              ) : recentAppointments.length === 0 ? (
                <div className="p-8 text-center text-dark-500 text-xs">
                  No recent appointments found for this doctor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-dark-300 text-xs text-gray-150">
                      {recentAppointments.map(apt => (
                        <tr key={apt._id} className="hover:bg-dark-100/25 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-white">{apt.patientName}</span>
                              <span className="text-[10px] text-dark-500">{apt.patientPhone}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-brand-green" />
                              <span>{new Date(apt.schedule).toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate" title={apt.reason}>
                            {apt.reason}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                              apt.status === "scheduled" ? "bg-brand-green/10 text-brand-green border border-brand-green/20" :
                              apt.status === "pending" ? "bg-brand-orange/10 text-brand-orange border border-brand-orange/20" :
                              apt.status === "completed" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                              "bg-brand-red/10 text-brand-red border border-brand-red/20"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                apt.status === "scheduled" ? "bg-brand-green" :
                                apt.status === "pending" ? "bg-brand-orange" :
                                apt.status === "completed" ? "bg-cyan-400" :
                                "bg-brand-red"
                              }`} />
                              <span>{apt.status}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
