import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "../store";
import { 
  ShieldAlert, 
  UserPlus, 
  CheckCircle, 
  AlertOctagon, 
  Users, 
  Bookmark, 
  KeyRound, 
  X, 
  ScrollText, 
  Mail, 
  Smartphone, 
  Shield, 
  Lock, 
  Key,
  Calendar,
  Clock,
  Briefcase,
  Sparkles,
  RefreshCw,
  Plus,
  ArrowRight,
  ArrowLeft,
  Settings,
  Heart,
  Check,
  Search,
  UserCheck,
  Trash2,
  AlertTriangle,
  MapPin
} from "lucide-react";
import { UserRole, User, DoctorShift } from "../types";

export default function Staff() {
  const { 
    users, 
    currentUser, 
    registerStaff, 
    toggleStaffStatus, 
    deleteStaff,
    emergencyReset,
    updateUserProfile,
    changeUserPassword,
    activityLogs,
    doctorShifts,
    addDoctorShift,
    updateDoctorShift,
    deleteDoctorShift
  } = useStore();

  // Active sub-tab in unified staff portal
  const [activeTab, setActiveTab] = useState<"directory" | "shifts" | "onboarding" | "security" | "logs">("directory");

  // Own Profile details edit states
  const [ownName, setOwnName] = useState(currentUser?.name || "");
  const [ownEmail, setOwnEmail] = useState(currentUser?.email || "");
  const [ownPhone, setOwnPhone] = useState(currentUser?.phone || "");
  const [ownAvatarUrl, setOwnAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [ownSpecialty, setOwnSpecialty] = useState(currentUser?.specialty || "");
  const [ownRoom, setOwnRoom] = useState(currentUser?.assignedRoom || "");

  // Own Password Rotation states
  const [ownCurrentPass, setOwnCurrentPass] = useState("");
  const [ownNewPass, setOwnNewPass] = useState("");
  const [ownConfirmPass, setOwnConfirmPass] = useState("");
  const [ownMasterKey, setOwnMasterKey] = useState("");

  // Search filter for Registered Personnel
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  // Onboarding Wizard states
  const [wizardStep, setWizardStep] = useState(1);
  const [wizName, setWizName] = useState("");
  const [wizUsername, setWizUsername] = useState("");
  const [wizRole, setWizRole] = useState<UserRole>("clinician");
  const [wizRole2, setWizRole2] = useState<"none" | UserRole>("none");
  const [wizEmail, setWizEmail] = useState("");
  const [wizPhone, setWizPhone] = useState("");
  const [wizPassword, setWizPassword] = useState("");
  const [wizSpecialty, setWizSpecialty] = useState("");
  const [wizRoom, setWizRoom] = useState("Room 1");
  const [wizHours, setWizHours] = useState("09:00 AM - 05:00 PM");
  const [wizDays, setWizDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [wizAvatarUrl, setWizAvatarUrl] = useState("https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=150&q=80"); // default to Clara

  // Admin Managing other member details state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("frontdesk");
  const [editRole2, setEditRole2] = useState<"none" | UserRole>("none");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editDays, setEditDays] = useState<string[]>([]);

  // UI Status Banners
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [resetConfirmCode, setResetConfirmCode] = useState("");

  // Local states for Active Shifts Board under Staff Portal
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [editingShiftIndex, setEditingShiftIndex] = useState<number | null>(null);
  
  const [sfName, setSfName] = useState("");
  const [sfSpecialty, setSfSpecialty] = useState("");
  const [sfRoom, setSfRoom] = useState("");
  const [sfDays, setSfDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [sfHours, setSfHours] = useState("09:00 AM - 05:00 PM");
  const [sfIsAvailable, setSfIsAvailable] = useState(true);

  // Computes scheduling conflicts in real-time
  const schedulingConflicts = useMemo(() => {
    const list: {
      staffName: string;
      day: string;
      shifts: { hours: string; specialty: string; index: number }[];
    }[] = [];
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    daysOfWeek.forEach((day) => {
      // Find all shifts covering this day
      const dayShifts = doctorShifts
        .map((s, idx) => ({ ...s, originalIndex: idx }))
        .filter((s) => s.days?.includes(day));
      
      // Group by staff name
      const grouped: { [name: string]: typeof dayShifts } = {};
      dayShifts.forEach((s) => {
        const key = s.name.trim();
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
      });
      
      // Look for conflicts
      Object.keys(grouped).forEach((name) => {
        if (grouped[name].length > 1) {
          list.push({
            staffName: name,
            day: day,
            shifts: grouped[name].map((s) => ({
              hours: s.hours,
              specialty: s.specialty,
              index: s.originalIndex,
            })),
          });
        }
      });
    });
    
    return list;
  }, [doctorShifts]);

  useEffect(() => {
    if (currentUser) {
      setOwnName(currentUser.name || "");
      setOwnEmail(currentUser.email || "");
      setOwnPhone(currentUser.phone || "");
      setOwnAvatarUrl(currentUser.avatarUrl || "");
      setOwnSpecialty(currentUser.specialty || "");
    }
  }, [currentUser?.id]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    updateUserProfile(currentUser.id, {
      name: ownName,
      email: ownEmail,
      phone: ownPhone,
      avatarUrl: ownAvatarUrl,
      specialty: ownSpecialty,
      assignedRoom: ownRoom
    });
    setProfileSuccess("Specification tokens updated successfully!");
    setTimeout(() => setProfileSuccess(""), 3000);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentUser) return;
    if (ownNewPass !== ownConfirmPass) {
      setPwdError("Mismatched new passwords. Ensure fields match exactly.");
      return;
    }

    if (ownNewPass.length < 4) {
      setPwdError("Safety alert: Password must be at least 4 characters long.");
      return;
    }

    const isAdminUser = currentUser.role === "admin";
    const MASTER_KEY = "UQBPQl-j7IW5K3yYm7vu3WWANjyDd8Q2sUQvlxMAlcgxUbkb";
    const isMasterBypassActive = ownMasterKey === MASTER_KEY;

    let success = false;
    if (isMasterBypassActive) {
      success = changeUserPassword(currentUser.id, "", ownNewPass, true);
    } else {
      success = changeUserPassword(currentUser.id, ownCurrentPass, ownNewPass, false);
    }

    if (success) {
      setPwdSuccess("Password updated successfully!");
      setOwnCurrentPass("");
      setOwnNewPass("");
      setOwnConfirmPass("");
      setOwnMasterKey("");
    } else {
      setPwdError(isMasterBypassActive 
        ? "Bypass failed. System key conflict." 
        : "Failed: Invalid current password credentials."
      );
    }
  };

  const handleRegisterWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizName || !wizUsername) {
      alert("Please ensure Name and Username are populated.");
      return;
    }

    const duplicated = users.some(u => u.username.toLowerCase() === wizUsername.toLowerCase());
    if (duplicated) {
      alert("Error: That username identifier is already taken by another personnel.");
      return;
    }

    registerStaff(
      wizName,
      wizUsername,
      wizRole,
      wizEmail,
      wizPhone,
      wizPassword || wizUsername,
      wizAvatarUrl,
      wizSpecialty || (wizRole === "clinician" ? "Dentist Specialist" : wizRole === "admin" ? "Practice Admin" : "Receptionist Office Clerk"),
      wizRoom,
      wizDays,
      wizHours,
      wizRole2 === "none" ? undefined : wizRole2
    );

    // Reset onboarding form
    setWizName("");
    setWizUsername("");
    setWizRole2("none");
    setWizEmail("");
    setWizPhone("");
    setWizPassword("");
    setWizSpecialty("");
    setWizDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    setWizHours("09:00 AM - 05:00 PM");
    setWizardStep(1);
    setActiveTab("directory");

    alert(`Success: "${wizName}" has been successfully registered into Zendenta.`);
  };

  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditUsername(u.username);
    setEditRole(u.role);
    setEditRole2(u.role2 || "none");
    setEditEmail(u.email || "");
    setEditPhone(u.phone || "");
    setEditPassword(u.password || "");
    setEditAvatarUrl(u.avatarUrl || "");
    setEditSpecialty(u.specialty || "");
    setEditRoom(u.assignedRoom || "");
    setEditHours(u.hours || "09:00 AM - 05:00 PM");
    setEditDays(u.days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  };

  const handleSaveMemberEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUserProfile(editingUser.id, {
      name: editName,
      username: editUsername,
      role: editRole,
      role2: editRole2 === "none" ? undefined : editRole2,
      email: editEmail,
      phone: editPhone,
      password: editPassword,
      avatarUrl: editAvatarUrl,
      specialty: editSpecialty,
      assignedRoom: editRoom,
      hours: editHours,
      days: editDays
    });

    setEditingUser(null);
    alert(`Success: Updated details for ${editName}.`);
  };

  const handleEmergencyWipe = () => {
    if (resetConfirmCode === "RESET") {
      emergencyReset();
      setShowEmergencyModal(false);
      setResetConfirmCode("");
      alert("Clinic database reset to seeds successfully.");
    } else {
      alert("Error: Incorrect confirmation key.");
    }
  };

  const resetSfForm = () => {
    setSfName(users[0]?.name || "");
    setSfSpecialty(users[0]?.specialty || "Clinical Practitioner");
    setSfRoom(users[0]?.assignedRoom || "");
    setSfDays(["Monday", "Wednesday", "Friday"]);
    setSfHours("09:00 AM - 05:00 PM");
    setSfIsAvailable(true);
  };

  const handleAddNewShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sfName) {
      alert("Please specify a staff member name.");
      return;
    }
    const newShift: DoctorShift = {
      name: sfName,
      specialty: sfSpecialty || "Clinical Practitioner",
      assignedRoom: sfRoom,
      days: sfDays,
      hours: sfHours || "09:00 AM - 05:00 PM",
      isAvailable: sfIsAvailable
    };
    addDoctorShift(newShift);
    setIsAddingShift(false);
    resetSfForm();
  };

  const handleStartEditShift = (index: number) => {
    const shift = doctorShifts[index];
    if (!shift) return;
    setEditingShiftIndex(index);
    setSfName(shift.name);
    setSfSpecialty(shift.specialty);
    setSfRoom(shift.assignedRoom || "");
    setSfDays(shift.days || []);
    setSfHours(shift.hours);
    setSfIsAvailable(shift.isAvailable);
  };

  const handleSaveEditShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShiftIndex === null) return;
    const updatedShift: DoctorShift = {
      name: sfName,
      specialty: sfSpecialty,
      assignedRoom: sfRoom,
      days: sfDays,
      hours: sfHours,
      isAvailable: sfIsAvailable
    };
    updateDoctorShift(editingShiftIndex, updatedShift);
    setEditingShiftIndex(null);
    resetSfForm();
  };

  const handleDeleteShift = (index: number) => {
    if (confirm("Are you sure you want to remove this clinical shift assignment?")) {
      deleteDoctorShift(index);
    }
  };

  const isAdmin = currentUser?.role === "admin";

  // Pre-designed top-quality physician profile pictures available for wizard selection
  const avatarPresets = [
    { name: "Dr. Clara Mendes (Cosmetic)", url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTps0OO8oAWRbrzOtvHKdziTYj5UqTM7fKITg&s" },
    { name: "Dr. Omnia Hossam (Owner)", url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80" },
    { name: "Dr. Robert Pires (Prosthetics)", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80" },
    { name: "Sarah Connor Clerk Style", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" },
    { name: "Dr. Bruce Wayne (Orthodontics)", url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=150&q=80" }
  ];

  // Working schedule days options
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Filtered list of registered personnel
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.specialty && u.specialty.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (roleFilter === "all") return matchesSearch;
    return matchesSearch && u.role === roleFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="staff-master-panel">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-500/10 border border-blue-200/40 px-3 py-1 rounded-full">Personnel Management</span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">STAFF DIRECTORY & ROSTER</h2>
        <p className="text-slate-500 text-xs font-medium">Oversee clinical credentials, modify personnel shifts, and manage active workstation authorizations.</p>
      </div>

      {/* 2. PORTAL WORKSPACE TAB CONTROLLERS */}
      <div className="flex overflow-x-auto gap-2 bg-white border border-slate-200/60 p-2 rounded-2xl shadow-sm tracking-tight select-none">
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
            activeTab === "directory"
              ? "bg-blue-600 text-white shadow-md shadow-blue-100"
              : "text-slate-600 hover:text-slate-800 hover:bg-slate-100/60"
          }`}
        >
          <Users size={14} />
          <span>Registered Personnel ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("shifts")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
            activeTab === "shifts"
              ? "bg-blue-600 text-white shadow-md shadow-blue-100"
              : "text-slate-600 hover:text-slate-800 hover:bg-slate-100/60"
          }`}
        >
          <Clock size={14} />
          <span>Clinical Shifts & Rosters ({doctorShifts.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab("onboarding")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
              activeTab === "onboarding"
                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-100/60"
            }`}
          >
            <UserPlus size={14} />
            <span>Launch Staff Onboard Wizard</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
            activeTab === "security"
              ? "bg-blue-600 text-white shadow-md shadow-blue-100"
              : "text-slate-600 hover:text-slate-800 hover:bg-slate-100/60"
          }`}
        >
          <Settings size={14} />
          <span>My Credentials & Passphrase</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
              activeTab === "logs"
                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-100/60"
            }`}
          >
            <ScrollText size={14} />
            <span>Audit Trail & Reset</span>
          </button>
        )}
      </div>

      {/* 3. DYNAMIC TAB CONTENTS */}
      
      {/* TAB 1: REGISTERED PERSONNEL DIRECTORY (FLEXIBLE BENTO GRID) */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          
          {/* SEARCH & ACCESSIBILITY FILTERS STACK */}
          <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by personnel name, username, specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white placeholder:text-slate-400 rounded-xl transition-all"
              />
            </div>

            <div className="flex gap-1.5 self-start md:self-auto overflow-x-auto select-none">
              {[
                { id: "all", label: "All Classifications" },
                { id: "clinician", label: "Dentist Rosters" },
                { id: "frontdesk", label: "Reception desk" },
                { id: "admin", label: "Administrators" }
              ].map((role) => (
                <button
                  key={role.id}
                  onClick={() => setRoleFilter(role.id as any)}
                  className={`py-1.5 px-3 rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    roleFilter === role.id 
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                      : "bg-slate-50 border-slate-200 text-slate-550 hover:bg-slate-100/50"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* ACTIVE ROSTERS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUsers.map((usr) => {
              const isSelf = usr.id === currentUser?.id;
              
              // Custom fixed placeholder profile images if missing or corrupt
              const finalAvatar = usr.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(usr.name)}&background=2563EB&color=fff&bold=true`;

              return (
                <div 
                  key={usr.id} 
                  className={`bg-white border rounded-[28px] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 relative overflow-hidden group ${
                    isSelf 
                      ? `border-blue-300 ring-2 ring-blue-50/80 ${usr.role === 'admin' ? '' : 'bg-blue-50/5'}` 
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  {/* Subtle graphical glow */}
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity ${
                    usr.role === "admin" ? "bg-white" : usr.role === "clinician" ? "bg-sky-200" : "bg-amber-100"
                  }`} />

                  <div className="flex items-start gap-4 z-10">
                    {/* AVATAR BOX & BIOMETRICS VIEW */}
                    <div className="relative shrink-0">
                      <img 
                        src={finalAvatar} 
                        alt={usr.name} 
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200/80 bg-slate-100 shadow-xs"
                      />
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                        usr.isActive ? "bg-emerald-500" : "bg-orange-500"
                      }`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight break-words">{usr.name}</h4>
                        {isSelf && (
                          <span className="text-[8px] tracking-wider uppercase font-black bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded-md shrink-0">
                            You
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] uppercase font-black text-blue-600 block mt-1 tracking-tight break-words">
                        {usr.specialty || (usr.role === "clinician" ? "Dentist Practitioner" : usr.role === "admin" ? "Practice Administrator" : "Clinic Front Desk Officer")}
                      </p>

                      <div className="mt-2.5 space-y-1 text-slate-500 text-[10px] font-semibold">
                        <p className="flex items-center gap-1">
                          <Smartphone size={10} className="text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-700 break-all">{usr.phone || "No phone linked"}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Mail size={10} className="text-slate-400 shrink-0" />
                          <span className="break-all text-slate-600">{usr.email || "No email listed"}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* DUTY SCHEDULING CARD BLOCK */}
                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl space-y-1.5 z-10 text-[11px]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        <span> Roster Schedules</span>
                      </span>
                      <span className="font-mono text-slate-600">{usr.hours || "Shift: On-Call"}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-1">
                      {weekDays.map((day) => {
                        const isScheduled = usr.days?.includes(day);
                        return (
                          <span 
                            key={day} 
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-tight border uppercase ${
                              isScheduled 
                                ? "bg-blue-50 text-blue-700 border-blue-200/50" 
                                : "bg-white text-slate-300 border-slate-100 line-through decoration-slate-200"
                            }`}
                          >
                            {day.substring(0, 3)}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* ACCOUNT STABILITY CONTROLS */}
                  <div className="border-t border-slate-100/80 pt-3 flex flex-wrap items-center justify-between gap-2.5 z-10">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[usr.role, usr.role2].map((role, rIdx) => {
                        if (!role || (role as string) === "none") return null;
                        
                        const roleStyles: Record<string, string> = {
                          admin: "bg-slate-900 text-white border-slate-900",
                          doctor: "bg-indigo-50 text-indigo-700 border-indigo-200",
                          clinician: "bg-blue-50 text-blue-700 border-blue-200",
                          receptionist: "bg-amber-50 text-amber-700 border-amber-200",
                          frontdesk: "bg-orange-50 text-orange-700 border-orange-200",
                          accountant: "bg-emerald-50 text-emerald-700 border-emerald-200"
                        };

                        const roleLabels: Record<string, string> = {
                          admin: "Admin",
                          doctor: "Doctor",
                          clinician: "Dentist",
                          receptionist: "Reception",
                          frontdesk: "Front Desk",
                          accountant: "Accounting"
                        };

                        return (
                          <span 
                            key={rIdx}
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${roleStyles[role] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                          >
                            {roleLabels[role] || role}
                          </span>
                        );
                      })}

                      {!usr.isActive && (
                        <span className="bg-orange-50 text-orange-700 text-[8.5px] tracking-wider uppercase font-black px-1.5 py-0.5 rounded border border-orange-200">
                          Revoked
                        </span>
                      )}
                    </div>

                    {/* DIRECT INTERACTIVE BUTTON LABELS */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {isAdmin ? (
                        <>
                          {usr.id !== "usr-1" ? (
                            <button
                              type="button"
                              onClick={() => {
                                toggleStaffStatus(usr.id);
                                alert(`Status for ${usr.name} changed successfully.`);
                              }}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer select-none transition-all duration-150 ${
                                usr.isActive 
                                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80" 
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-150/80"
                              }`}
                            >
                              {usr.isActive ? "Revoke Keys" : "Authorize Keys"}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold px-1.5 py-1 select-none">Owner Keys</span>
                          )}

                          {currentUser?.id === "usr-1" || usr.id !== "usr-1" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(usr)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg border border-blue-700/10 cursor-pointer transition-all duration-150"
                              >
                                Edit
                              </button>
                              
                              {usr.id !== "usr-1" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`CRITICAL ACTION: Are you absolutely certain you want to permanently delete the personnel record for ${usr.name}? This action is IRREVERSIBLE.`)) {
                                      if (confirm(`FINAL VERIFICATION: Type "DELETE" to confirm? (Wait, actually a standard double confirm is enough). Proceed with deleting ${usr.name}?`)) {
                                        deleteStaff(usr.id);
                                      }
                                    }
                                  }}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                                  title="Delete personnel record permanently"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold px-1.5 py-1 select-none italic" title="Only Owner can modify their own record">Owner Locked</span>
                          )}
                        </>
                      ) : (
                        <span className="text-[9.5px] text-slate-400 italic font-semibold flex items-center gap-1 select-none">
                          <Lock size={9} />
                          <span>Encrypted File</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="bg-white border rounded-[32px] p-12 text-center text-slate-400 border-slate-200/75">
              <ShieldAlert className="mx-auto text-slate-300 mb-2" size={32} />
              <span className="text-xs font-semibold block">No matching files found</span>
              <p className="text-[10px] text-slate-400 mt-1">Refine your search tokens or register a new colleague card</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: CLINICAL SHIFTS & ROSTERS MANAGER */}
      {activeTab === "shifts" && (
        <div className="space-y-6" id="shifts-tab-panel">
          
          {/* HEADER HEADER */}
          <div className="bg-white border border-slate-200/85 p-6 rounded-[28px] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="text-blue-500" size={20} />
                <span>Clinical Practitioner Roster</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                Configure operational room schedules, duty week calendars, and track scheduling constraints in real-time.
              </p>
            </div>
            
            {isAdmin && !isAddingShift && editingShiftIndex === null && (
              <button
                type="button"
                onClick={() => {
                  resetSfForm();
                  setIsAddingShift(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-blue-700/10 cursor-pointer shadow-md shadow-blue-100 flex items-center gap-1.5 self-start sm:self-auto transition-transform active:scale-95 select-none"
              >
                <Plus size={14} />
                <span>Program New Shift</span>
              </button>
            )}
          </div>

          {/* REAL-TIME WARNING & CONFLICT DETECTION MONITOR */}
          <div className="space-y-4">
            {schedulingConflicts.length > 0 ? (
              <div className="bg-rose-50/80 border-2 border-rose-200 p-5 rounded-[24px] space-y-3.5 relative overflow-hidden animate-pulse-slow">
                <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl" />
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-xl mt-0.5 shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-900 tracking-tight">
                      ROSTERING ALERT: Scheduling Conflict Detected ({schedulingConflicts.length})
                    </h4>
                    <p className="text-[11px] text-rose-700 font-semibold mt-0.5 max-w-2xl">
                      The automated shift validation engine has identified personnel double-booked across different clinical duties on the same calendar day. Please adjust their roster to ensure correct room limits and clinical availability.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {schedulingConflicts.map((conflict, cIdx) => (
                    <div 
                      key={cIdx} 
                      className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-3 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] uppercase font-bold tracking-widest text-rose-600 block leading-none mb-1">
                            Double Assignment • {conflict.day}
                          </span>
                          <h5 className="font-extrabold text-slate-900 text-sm">{conflict.staffName}</h5>
                        </div>
                        <span className="bg-rose-100 text-rose-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-rose-200 shrink-0">
                          Conflict flag
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-2">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider leading-none">Conflicting Assignments:</p>
                        <div className="space-y-1.5 font-semibold text-slate-700 text-xs">
                          {conflict.shifts.map((sh, sIdx) => (
                            <div key={sIdx} className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1 min-w-0">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                <span className="truncate">{sh.specialty}</span>
                              </span>
                              <span className="font-mono text-[10.5px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-705 shrink-0">{sh.hours}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => handleStartEditShift(conflict.shifts[0].index)}
                          className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[10.5px] rounded-lg transition-colors cursor-pointer select-none text-center block"
                        >
                          Modify Conflicting Shift
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/60 border border-emerald-200/80 p-4.5 rounded-[24px] flex items-center gap-3.5 relative overflow-hidden animate-fade-in">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-955 tracking-tight uppercase">Shift Integrity Secure</h4>
                  <p className="text-[10.5px] text-emerald-700 font-semibold mt-0.5">
                    No overlapping clinical assignments found. Roster compliance is 100% compliant with clinic and room limits.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ADD / EDIT SHIFT PROGRAM PANEL INSIDE GRID */}
          {(isAddingShift || editingShiftIndex !== null) && (
            <div className="bg-gradient-to-r from-blue-50/40 to-indigo-50/40 border border-blue-200/80 rounded-[28px] p-6 shadow-xs animate-fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-blue-150 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                    <Clock size={16} />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    {editingShiftIndex !== null ? "Edit Clinical Shift" : "Program Clinical Shift"}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingShift(false);
                    setEditingShiftIndex(null);
                    resetSfForm();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  title="Cancel editor"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={editingShiftIndex !== null ? handleSaveEditShift : handleAddNewShift} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {/* Staff Select Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Select Practitioner</label>
                    <select
                      required
                      value={sfName}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        setSfName(selectedName);
                        // Auto populate specialty based on chosen user if possible
                        const match = users.find(u => u.name === selectedName);
                        if (match) {
                          if (match.specialty) setSfSpecialty(match.specialty);
                          if (match.assignedRoom) setSfRoom(match.assignedRoom);
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-- Choose practitioner --</option>
                      {users.map(u => {
                        const roles = [u.role, u.role2].filter(r => r && (r as string) !== "none");
                        const roleLabels: Record<string, string> = {
                          clinician: "Clinician",
                          doctor: "Doctor",
                          admin: "Admin",
                          receptionist: "Reception",
                          frontdesk: "Front Desk",
                          accountant: "Accounting"
                        };
                        const labels = roles.map(r => roleLabels[r] || r).join(" & ");
                        return (
                          <option key={u.id} value={u.name}>
                            {u.name} ({labels})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Specialty / Role field */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Duty Specialty</label>
                    <input
                      type="text"
                      placeholder="e.g. Cosmetic Dentistry Room 2"
                      required
                      value={sfSpecialty}
                      onChange={(e) => setSfSpecialty(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold"
                    />
                  </div>

                  {/* Standard Hours Preset Buttons */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block"> Roster Shift Time Preset</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["08:00 AM - 04:00 PM", "09:00 AM - 05:00 PM", "10:00 AM - 06:00 PM"].map((pres) => (
                        <button
                          key={pres}
                          type="button"
                          onClick={() => setSfHours(pres)}
                          className={`p-2 rounded-lg border text-[10px] font-bold transition-all text-center cursor-pointer ${
                            sfHours === pres 
                              ? "bg-slate-900 text-white border-slate-900" 
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {pres}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Hours input */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Custom Shift Hours</label>
                    <input
                      type="text"
                      placeholder="Custom time range, e.g. 02:00 PM - 10:00 PM"
                      required
                      value={sfHours}
                      onChange={(e) => setSfHours(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  {/* Weekly Days multi selectors */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Assigned Weekly Shift Days</span>
                    <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {weekDays.map((day) => {
                        const isChosen = sfDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isChosen) {
                                setSfDays(sfDays.filter(d => d !== day));
                              } else {
                                setSfDays([...sfDays, day]);
                              }
                            }}
                            className={`py-2 px-1 border rounded-xl font-bold flex flex-col items-center justify-center cursor-pointer transition-all ${
                              isChosen 
                                ? "bg-blue-600 border-blue-600 text-white shadow-xs" 
                                : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-[10px] leading-tight">{day.substring(0, 3)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {/* Shift Availability Switcher */}
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl select-none">
                      <div>
                        <span className="text-[10px] uppercase font-black text-slate-700 block">Room Attendance Status</span>
                        <p className="text-[9px] text-slate-400 font-semibold">Toggles whether medical practitioners are active or off-duty.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSfIsAvailable(!sfIsAvailable)}
                        className={`text-2xs font-extrabold px-3 py-1.5 rounded-xl border tracking-wider transition-all cursor-pointer ${
                          sfIsAvailable 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                            : "bg-red-50 text-red-800 border-red-200"
                        }`}
                      >
                        {sfIsAvailable ? "ACTIVE ROOM" : "OFF-DUTY ON-CALL"}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block">Physical Room Assignment</label>
                      <select
                        value={sfRoom}
                        onChange={(e) => setSfRoom(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-bold cursor-pointer focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">No room assigned</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={`Room ${num}`}>Room {num}</option>
                        ))}
                      </select>
                    </div>

                    {/* FORM ACTION CONTROLS */}
                    <div className="flex gap-2.5 select-none pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingShift(false);
                          setEditingShiftIndex(null);
                          resetSfForm();
                        }}
                        className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Discard
                      </button>
                      
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-100 active:scale-[0.98] transition-all text-center cursor-pointer"
                      >
                        {editingShiftIndex !== null ? "Save Roster Upgrades" : "Program Shift Duty"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* MASTER SHIFTS LIST CARD */}
          <div className="bg-white border border-slate-200/80 rounded-[32px] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase">Operational Shift Assignments Directory</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Active entries inside of global clinic rosters.</p>
              </div>
              <span className="bg-blue-50 text-blue-700 text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase select-none tracking-wider font-mono">
                {doctorShifts.length} Registered Shifts Listing
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {doctorShifts.map((shift, idx) => {
                const userMatch = users.find(u => u.name.toLowerCase() === shift.name.toLowerCase());
                const rosterAvatar = userMatch?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(shift.name)}&background=2563EB&color=fff&bold=true`;
                const isConflicting = schedulingConflicts.some(con => con.staffName.toLowerCase() === shift.name.toLowerCase());

                return (
                  <div key={idx} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    
                    {/* Practitioner Profile Match */}
                    <div className="flex items-center gap-3.5 min-w-0 max-w-sm">
                      <div className="relative shrink-0">
                        <img 
                          src={rosterAvatar} 
                          alt={shift.name} 
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-slate-50 shadow-xs"
                        />
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          shift.isAvailable ? "bg-emerald-500 animate-pulse" : "bg-red-400"
                        }`} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="font-extrabold text-slate-800 text-sm truncate leading-tight">{shift.name}</h5>
                          {isConflicting && (
                            <span className="flex items-center gap-0.5 bg-rose-50 text-rose-800 border border-rose-100 text-[8px] font-bold px-1.5 py-0.5 rounded-md leading-none shrink-0 border border-rose-200">
                              <AlertTriangle size={8} className="text-rose-600" />
                              <span>Conflict Double-Booked</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] uppercase font-black text-blue-600 block mt-0.5 tracking-tight break-words">
                          {shift.specialty} {shift.assignedRoom && `• ${shift.assignedRoom}`}
                        </p>
                      </div>
                    </div>

                    {/* Operational Shift Information Days & Hours */}
                    <div className="flex-1 md:max-w-md lg:max-w-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block font-mono">Shift Hours:</span>
                        <span className="text-[11px] text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md font-mono">{shift.hours}</span>
                      </div>
                      
                      {/* Interactive capsule chips */}
                      <div className="flex flex-wrap gap-1">
                        {weekDays.map(day => {
                          const isActiveDay = shift.days?.includes(day);
                          return (
                            <span 
                              key={day} 
                              className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-tight border uppercase select-none ${
                                isActiveDay 
                                  ? isConflicting && schedulingConflicts.some(con => con.staffName.toLowerCase() === shift.name.toLowerCase() && con.day === day)
                                    ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                                    : "bg-blue-50 text-blue-700 border-blue-200/50" 
                                  : "bg-white text-slate-200 border-slate-50 line-through decoration-slate-100"
                              }`}
                            >
                              {day.substring(0, 3)}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Controls Actions for Clinical Officers */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <span className={`text-[9.5px] uppercase font-black px-2 py-1 rounded-lg border shrink-0 ${
                        shift.isAvailable 
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}>
                        {shift.isAvailable ? "Active Room" : "Off-Duty On-Call"}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditShift(idx)}
                            className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10.5px] rounded-lg transition-colors cursor-pointer select-none border border-slate-200"
                          >
                            Edit
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteShift(idx)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer border border-rose-200"
                            title="Delete operational shift"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}

              {doctorShifts.length === 0 && (
                <div className="p-12 text-center text-slate-400 animate-fade-in">
                  <Clock className="mx-auto text-slate-300 mb-2.5" size={32} />
                  <span className="text-xs font-semibold block">No clinical shifts defined</span>
                  <p className="text-[10px] text-slate-400 mt-1">Please add roster shifts using the Program Shift button above.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: INTERACTIVE STAFF ONBOARDING WIZARD */}
      {activeTab === "onboarding" && isAdmin && (
        <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
          
          {/* HEADER ROW */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <UserPlus size={18} className="text-blue-500" />
                <span>Onboarding Wizard: Step {wizardStep} of 4</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 tracking-tight font-medium">Verify system parameters, identity access levels, and roster availability on the fly.</p>
            </div>
            
            <button
              onClick={() => {
                if (confirm("Are you sure you want to cancel the staff registration?")) {
                  setActiveTab("directory");
                }
              }}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Abort wizard"
            >
              <X size={16} />
            </button>
          </div>

          {/* STEPPER MAP BAR */}
          <div className="grid grid-cols-4 gap-2 pb-2 select-none">
            {[
              { num: 1, label: "Identity & Role", desc: "Credentials" },
              { num: 2, label: "Specialty & Contact", desc: "Details" },
              { num: 3, label: "Shift Roster", desc: "Schedule" },
              { num: 4, label: "Clinical Persona", desc: "Avatar Match" }
            ].map((step) => {
              const active = wizardStep === step.num;
              const passed = wizardStep > step.num;
              return (
                <div key={step.num} className="space-y-1.5 flex flex-col justify-between items-start">
                  <div className={`h-1.5 w-full rounded-full transition-all ${
                    active ? "bg-blue-600 shadow-sm" : passed ? "bg-emerald-500" : "bg-slate-100"
                  }`} />
                  <div className="hidden sm:block">
                    <p className={`text-[10px] font-black leading-none ${active ? "text-blue-600" : passed ? "text-emerald-600" : "text-slate-400"}`}>
                      {step.num}. {step.label}
                    </p>
                    <span className="text-[8.5px] text-slate-400">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FORM CONTAINER - SUBMITS STEP OR MULTI-STEP TO REDUCE BLANK SPACE */}
          <form onSubmit={handleRegisterWizard} className="space-y-6 pt-3 min-h-[300px]">
            
            {/* STEP 1: IDENTITY ACCESS CREDENTIALS */}
            {wizardStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <span>Full Legal Name</span>
                      <strong className="text-red-500">*</strong>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Dr. Bruce Wayne"
                      value={wizName}
                      onChange={(e) => setWizName(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-150 transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <span>Username Identifier</span>
                      <strong className="text-red-500">*</strong>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., bruce_ortho"
                      value={wizUsername}
                      onChange={(e) => setWizUsername(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-150 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Onboarding Temporary Password</label>
                    <input
                      type="password"
                      placeholder="Defaults to username tag"
                      value={wizPassword}
                      onChange={(e) => setWizPassword(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-150 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Primary System Access Level</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border border-slate-100 rounded-xl p-2 bg-slate-50">
                      {[
                        { val: "clinician", label: "Dentist" },
                        { val: "doctor", label: "Doctor" },
                        { val: "frontdesk", label: "Front Desk" },
                        { val: "receptionist", label: "Reception" },
                        { val: "accountant", label: "Accounting" },
                        { val: "admin", label: "Admin" }
                      ].map(r => (
                        <label 
                          key={r.val} 
                          className={`p-2 border rounded-lg flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all ${
                            wizRole === r.val 
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="radio"
                            name="wizRole"
                            value={r.val}
                            checked={wizRole === r.val}
                            onChange={() => setWizRole(r.val as UserRole)}
                            className="sr-only"
                          />
                          <span className="text-[10px] font-black">{r.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-550 block">Optional Secondary Job / Role (Dual Role Option)</label>
                  <select
                    value={wizRole2}
                    onChange={(e) => setWizRole2(e.target.value as "none" | UserRole)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-semibold"
                  >
                    <option value="none">No Secondary Role (Single Role)</option>
                    <option value="clinician">Dentist Practitioner</option>
                    <option value="doctor">Medical Doctor</option>
                    <option value="frontdesk">Front Desk Clerk</option>
                    <option value="receptionist">Receptionist Officer</option>
                    <option value="accountant">Financial Accountant</option>
                    <option value="admin">System Administrator Override</option>
                  </select>
                  <p className="text-[9.5px] text-slate-400 font-medium">
                    Supports dual responsibilities (e.g., Staff is both an administrator and a clinical dentist).
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: SPECIALTY & CONTACTS */}
            {wizardStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Contact Telephone</label>
                    <input
                      type="text"
                      placeholder="E.g., +1 (555) 555-0199"
                      value={wizPhone}
                      onChange={(e) => setWizPhone(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-150 transition-all font-mono font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Practice Email Address</label>
                    <input
                      type="email"
                      placeholder="E.g., doctor@zendenta.com"
                      value={wizEmail}
                      onChange={(e) => setWizEmail(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-150 transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Medic specialty Department</label>
                    <input
                      type="text"
                      placeholder="E.g., General & Cosmetic Dentist"
                      value={wizSpecialty}
                      onChange={(e) => setWizSpecialty(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-150 transition-all font-bold"
                    />
                    <span className="text-[8px] text-slate-450 block">* Leave empty to dynamically generate specialty classification based on and relative to Security Role level</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: WORK SCHEDULE ROSTER */}
            {wizardStep === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Standard Shift Duty Hours</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      "08:00 AM - 04:00 PM",
                      "09:00 AM - 05:00 PM",
                      "10:00 AM - 06:00 PM"
                    ].map((shift) => (
                      <button
                        key={shift}
                        type="button"
                        onClick={() => setWizHours(shift)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          wizHours === shift 
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {shift}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Weekly Assigned On-Duty Days</span>
                  <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                      const isSelected = wizDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setWizDays(wizDays.filter(d => d !== day));
                            } else {
                              setWizDays([...wizDays, day]);
                            }
                          }}
                          className={`p-2.5 border rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm font-bold" 
                              : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100/50"
                          }`}
                        >
                          <span className="text-xs font-semibold">{day.substring(0, 3)}</span>
                          <span className="text-[8px] opacity-75 mt-0.5 leading-none">{day}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: CLINICAL PERSONA / CHOOSE AVATAR */}
            {wizardStep === 4 && (
              <div className="space-y-5 animate-fade-in">
                
                {/* PREVIEW CONTAINER */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <img 
                    src={wizAvatarUrl || "https://ui-avatars.com/api/?name=New+Staff&background=2563EB&color=fff"} 
                    alt="Wizard Preview" 
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white bg-slate-100 shadow-md transform group-hover:scale-105 transition-transform"
                  />
                  <div className="text-center sm:text-left">
                    <h4 className="text-sm font-extrabold text-slate-900">{wizName || "Legal Name Pending"}</h4>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md inline-block mt-1">
                      {wizRole === "clinician" ? "Clinical Dentist" : wizRole === "admin" ? "Administrative Master" : "Front Desk Clerk"}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Selected Avatar photo will represent this staff member across visual teeth logs, billing actions, and schedule grids.</p>
                  </div>
                </div>

                {/* MATRIX OF PRESETS */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Select Doctor / Staff Profile Photo Preset</label>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {avatarPresets.map((avatar) => {
                      const isSelected = wizAvatarUrl === avatar.url;
                      return (
                        <button
                          key={avatar.name}
                          type="button"
                          onClick={() => setWizAvatarUrl(avatar.url)}
                          className={`p-2 border rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-white hover:bg-slate-50 ${
                            isSelected ? "border-blue-500 ring-2 ring-blue-50 bg-blue-50/5 font-extrabold" : "border-slate-200"
                          }`}
                        >
                          <img src={avatar.url} alt={avatar.name} className="w-12 h-12 rounded-xl object-cover shadow-xs border bg-slate-50" />
                          <span className="text-[9px] text-center leading-tight truncate w-full text-slate-600 mt-1 font-semibold">{avatar.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PASTE CUSTOM PHOTO URL */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">OR Enter Custom Photo URL</label>
                  <input
                    type="url"
                    placeholder="Enter custom image format URL (https://...)"
                    value={wizAvatarUrl}
                    onChange={(e) => setWizAvatarUrl(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-150 transition-all font-mono text-blue-800"
                  />
                </div>
              </div>
            )}

            {/* ERROR / REGISTRATION REASSISTANCE CHECKS */}
            {wizardStep === 4 && (!wizName || !wizUsername) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[10px] uppercase font-extrabold text-center">
                Attention: Legal Name and Username ID must be entered in Step 1 before completing registration.
              </div>
            )}

            {/* BUTTON BAR NAVIGATION */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
              
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(prev => prev - 1)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200/50"
                >
                  <ArrowLeft size={14} />
                  <span>Go Back</span>
                </button>
              ) : (
                <div />
              )}

              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(prev => prev + 1)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm border border-blue-700/10"
                >
                  <span>Continue Step</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!wizName || !wizUsername}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shadow-emerald-100"
                >
                  <CheckCircle size={14} />
                  <span>Onboard New Colleague</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: OWN SECURITY TOKEN & PASSWORDS */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* PROFILE SETTINGS TOKENS */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Bookmark size={16} className="text-blue-500" />
                <span>My Profile Access Keys</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Verify your registered legal name, email, and mobile contact lines.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Legal Name</label>
                  <input
                    type="text"
                    required
                    value={ownName}
                    onChange={(e) => setOwnName(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold focus:ring-2 focus:ring-blue-200 transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Security Clearance level</label>
                  <div className="w-full p-2.5 text-xs bg-slate-100 border border-slate-200/60 rounded-xl font-mono text-slate-500 font-bold select-none cursor-not-allowed">
                    {currentUser?.role === "admin" ? "Administrative Root Auth" : `Clinician block: ${currentUser?.role}`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Contact Email</label>
                  <input
                    type="email"
                    value={ownEmail}
                    onChange={(e) => setOwnEmail(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Telephone Line</label>
                  <input
                    type="text"
                    value={ownPhone}
                    onChange={(e) => setOwnPhone(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200/60 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">My Clinical Department specialty</label>
                <input
                  type="text"
                  placeholder="E.g., Orthodontics Specialist"
                  value={ownSpecialty}
                  onChange={(e) => setOwnSpecialty(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all font-bold text-blue-850"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">My Custom image Avatar URL</label>
                <input
                  type="url"
                  placeholder="Paste direct profile image link..."
                  value={ownAvatarUrl}
                  onChange={(e) => setOwnAvatarUrl(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all font-mono"
                />
                </div>

                <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Physical Room Assignment</label>
                <select
                  value={ownRoom}
                  onChange={(e) => setOwnRoom(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all font-bold cursor-pointer"
                >
                  <option value="">No room assigned</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={`Room ${num}`}>Room {num}</option>
                  ))}
                </select>
                </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all border border-blue-700/10 shadow-sm shadow-blue-50"
                >
                  Update Account Profile
                </button>
                {profileSuccess && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                    <CheckCircle size={12} />
                    <span>{profileSuccess}</span>
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* PASSWORD ROTATION CARD */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <KeyRound size={16} className="text-amber-500" />
                <span>Rotate Station Passphrase</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Reset your local browser and workstation authorization keys.</p>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {currentUser?.role === "admin" ? (
                <div className="space-y-3 p-3 bg-amber-500/10 border border-amber-200 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[10px] uppercase tracking-wide">
                    <Shield size={12} />
                    <span>Client-side override disabled</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-amber-700">Current Security Pass</label>
                      <input
                        type="password"
                        value={ownCurrentPass}
                        onChange={(e) => setOwnCurrentPass(e.target.value)}
                        className="w-full p-2 rounded-xl border border-amber-300 text-xs text-stone-700 font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-400 bg-white"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-amber-700 flex items-center gap-0.5">
                        <span>OR Emergency override Key</span>
                      </label>
                      <input
                        type="password"
                        value={ownMasterKey}
                        onChange={(e) => setOwnMasterKey(e.target.value)}
                        className="w-full p-2 rounded-xl border border-amber-300 text-xs text-stone-700 font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-400 bg-white"
                        placeholder="Master resets key..."
                      />
                    </div>
                  </div>
                  <p className="text-[8px] text-amber-800 leading-tight">
                    * Emergency bypass is disabled. Use backend admin reset workflows.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Provide Current Password</label>
                  <input
                    type="password"
                    required
                    value={ownCurrentPass}
                    onChange={(e) => setOwnCurrentPass(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-stone-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Enter New Password</label>
                  <input
                    type="password"
                    required
                    value={ownNewPass}
                    onChange={(e) => setOwnNewPass(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono focus:ring-2 focus:ring-blue-200 shadow-sm"
                    placeholder="Min. 4 letters"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={ownConfirmPass}
                    onChange={(e) => setOwnConfirmPass(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono focus:ring-2 focus:ring-blue-200 shadow-sm"
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              {pwdError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold rounded-xl flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-xl flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle size={14} />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key size={13} />
                <span>Publish New Password Code</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM AUDITS & HARD CRITICAL RESETS */}
      {activeTab === "logs" && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SECURITY AUDIT TRAILS */}
          <div className="lg:col-span-8 bg-white border border-slate-205 rounded-[32px] p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ScrollText size={16} className="text-purple-600" />
                <span>Station Safety Audit Trail</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Encrypted records logging clinician onboards, passphrase revisions, and server triggers.</p>
            </div>

            <div className="border border-slate-200 rounded-2xl bg-slate-900 text-slate-350 p-4 font-mono text-[11px] max-h-[480px] overflow-y-auto space-y-3 custom-scrollbar shadow-inner">
              {activityLogs.length === 0 ? (
                <p className="text-slate-500 italic text-center py-10">No access logs generated. Logs trigger during workspace logins.</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="border-b border-slate-800/60 pb-2.5 last:border-none flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                    <div className="space-y-1">
                      <span className="text-purple-405 text-purple-300 font-bold block">
                        [{new Date(log.timestamp).toLocaleTimeString()}] : {log.action}
                      </span>
                      <span className="text-slate-300 block text-[10px] leading-relaxed">{log.details}</span>
                    </div>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700 text-[9px] h-fit shrink-0 font-bold self-start sm:self-auto">
                      {log.user}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CRITICAL DATA Safe PURGES */}
          <div className="lg:col-span-4 bg-rose-50/40 border border-rose-200/60 p-6 rounded-[32px] flex flex-col justify-between gap-6 shadow-sm h-fit">
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-rose-800">
                <AlertOctagon className="text-rose-600 shrink-0 mt-0.5" size={24} />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Database Baseline Safe-Purge</h3>
                  <p className="text-xs text-rose-800 mt-1 sm:mt-1.5 leading-relaxed font-semibold">
                    Irreversibly restore current offline browser databases back to initial seed data (Arthur, Tommy, Benjamin, Vance) and restore default duty schedules.
                  </p>
                  <p className="text-[10px] text-rose-700 mt-1.5 font-bold italic leading-normal">
                    * Warning: All registered clinician rosters, active prosthetic treatment sessions, and bill ledger settlements logged during current shift will be permanently cancelled.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowEmergencyModal(true)}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-105 active:scale-95"
            >
              <KeyRound size={14} />
              <span>Initiate Hard Database Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* EDIT STAFF DETAILS MODAL FOR MASTER ADMINS */}
      {editingUser && (
        <div 
          onClick={() => setEditingUser(null)}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[110] p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[32px] border border-slate-200 p-6 md:p-8 w-full max-w-lg shadow-2xl relative cursor-default max-h-[92vh] flex flex-col overflow-y-auto custom-scrollbar"
          >
            <button 
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>

            <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mb-1.5 shrink-0">
              <ShieldAlert size={18} className="text-blue-500 font-bold" />
              <span>Modify Personnel record</span>
            </h3>
            
            <p className="text-xs text-slate-500 leading-normal mb-4 font-semibold shrink-0">
              Overrule credential records and configure weekly roster hours for: <strong className="text-slate-800 font-black">{editingUser.name}</strong>
            </p>

            <form onSubmit={handleSaveMemberEdit} className="space-y-4 flex-1 overflow-y-auto pr-1 min-h-0">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Legal Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Username Identifier</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Communication Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Telephone Line</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Medical Department specialty</label>
                  <input
                    type="text"
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Duty Shift Hours</label>
                  <input
                    type="text"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Overrule Passphrase Code</label>
                  <input
                    type="text"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-stone-700 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">System Authority Clearance</label>
                  {editingUser.id === "usr-1" ? (
                    <div className="space-y-2">
                      <div className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 font-bold select-none cursor-not-allowed">
                        Owner / System Administrator (Authority Locked)
                      </div>
                      
                      <div className="mt-2 pt-1 border-t border-slate-100">
                        <label className="text-[9.5px] uppercase font-bold text-slate-400 block mb-1">Secondary Job / Role</label>
                        <select
                          value={editRole2}
                          onChange={(e) => setEditRole2(e.target.value as "none" | UserRole)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-semibold"
                        >
                          <option value="none">No Secondary Role</option>
                          <option value="clinician">Dentist Practitioner</option>
                          <option value="doctor">Medical Doctor</option>
                          <option value="frontdesk">Front Desk Clerk</option>
                          <option value="receptionist">Receptionist Officer</option>
                          <option value="accountant">Financial Accountant</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[9.5px] uppercase font-bold text-slate-400 block mb-1">Primary Job / Role</label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-semibold"
                      >
                        <option value="clinician">Dentist Practitioner</option>
                        <option value="doctor">Medical Doctor</option>
                        <option value="frontdesk">Front Desk Clerk</option>
                        <option value="receptionist">Receptionist Officer</option>
                        <option value="accountant">Financial Accountant</option>
                        <option value="admin">System Administrator Override</option>
                      </select>
                      
                      <div className="mt-2 pt-1 border-t border-slate-100">
                        <label className="text-[9.5px] uppercase font-bold text-slate-400 block mb-1">Secondary Job / Role (Optional)</label>
                        <select
                          value={editRole2}
                          onChange={(e) => setEditRole2(e.target.value as "none" | UserRole)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-semibold"
                        >
                          <option value="none">No Secondary Role</option>
                          <option value="clinician">Dentist Practitioner</option>
                          <option value="doctor">Medical Doctor</option>
                          <option value="frontdesk">Front Desk Clerk</option>
                          <option value="receptionist">Receptionist Officer</option>
                          <option value="accountant">Financial Accountant</option>
                          <option value="admin">System Administrator Override</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Custom Profile image Link</label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Physical Room Assignment</label>
                <select
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-bold cursor-pointer"
                >
                  <option value="">No room assigned</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={`Room ${num}`}>Room {num}</option>
                  ))}
                </select>
              </div>

              {/* Roster days multi selectors */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Roster Days weekly</span>
                <div className="flex flex-wrap gap-1.5">
                  {weekDays.map(day => {
                    const picked = editDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (picked) {
                            setEditDays(editDays.filter(d => d !== day));
                          } else {
                            setEditDays([...editDays, day]);
                          }
                        }}
                        className={`px-2 py-1 rounded text-[9px] uppercase font-bold border transition-all cursor-pointer ${
                          picked 
                            ? "bg-blue-600 text-white border-blue-600" 
                            : "bg-slate-50 text-slate-550 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm border border-blue-700/10 active:scale-95 transition-all"
                >
                  Save File Modifications
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM SYSTEM HARD RESET DIALOG */}
      {showEmergencyModal && (
        <div 
          onClick={() => {
            setShowEmergencyModal(false);
            setResetConfirmCode("");
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[110] p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[32px] border border-slate-200 p-6 w-full max-w-sm shadow-2xl relative cursor-default"
          >
            <button 
              onClick={() => {
                setShowEmergencyModal(false);
                setResetConfirmCode("");
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>

            <h3 className="text-base font-black text-rose-800 flex items-center gap-2 mb-2">
              <ShieldAlert size={18} />
              <span>Confirm System reset</span>
            </h3>
            <p className="text-xs text-slate-700 leading-normal mb-4 font-semibold">
              All active clinical teeth records, appointment schedules, and settlements compiled during this session will be permanently erased.
            </p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-600 block">Type "RESET" to confirm</label>
                <input
                  type="text"
                  value={resetConfirmCode}
                  onChange={(e) => setResetConfirmCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-center tracking-widest text-red-600 focus:outline-none focus:ring-2 focus:ring-red-150 transition-all font-bold shadow-sm"
                  placeholder="RESET"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={handleEmergencyWipe}
                  disabled={resetConfirmCode !== "RESET"}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-red-700/10 shadow-sm"
                >
                  Confirm Safe-Purge
                </button>
                <button
                  onClick={() => {
                    setShowEmergencyModal(false);
                    setResetConfirmCode("");
                  }}
                  className="flex-1 py-3 bg-slate-150 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Abort
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
