import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Eye,
  EyeOff,
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
  MapPin,
  Phone,
  Stethoscope,
  Calculator,
  User as LucideUser,
  ChevronDown,
  ExternalLink
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
  const [avatarInputMode, setAvatarInputMode] = useState<"link" | "file">("link");

  // States for rich Duty Shift Hours time picker in Edit Modal
  const [fromHour, setFromHour] = useState("09");
  const [fromMinute, setFromMinute] = useState("00");
  const [fromAmpm, setFromAmpm] = useState("AM");
  const [toHour, setToHour] = useState("05");
  const [toMinute, setToMinute] = useState("00");
  const [toAmpm, setToAmpm] = useState("PM");

  // Helper functions for hours and minutes increments/decrements
  const incrementHourFunc = (prev: string) => {
    let h = parseInt(prev, 10);
    if (isNaN(h)) h = 12;
    h = h === 12 ? 1 : h + 1;
    return String(h).padStart(2, "0");
  };

  const decrementHourFunc = (prev: string) => {
    let h = parseInt(prev, 10);
    if (isNaN(h)) h = 12;
    h = h === 1 ? 12 : h - 1;
    return String(h).padStart(2, "0");
  };

  const incrementMinuteFunc = (prev: string) => {
    let m = parseInt(prev, 10);
    if (isNaN(m)) m = 59;
    m = m === 59 ? 0 : m + 1;
    return String(m).padStart(2, "0");
  };

  const decrementMinuteFunc = (prev: string) => {
    let m = parseInt(prev, 10);
    if (isNaN(m)) m = 0;
    m = m === 0 ? 59 : m - 1;
    return String(m).padStart(2, "0");
  };

  // Keyboard typing handlers (allowing intermediate values and validating on blur)
  const handleHourChange = (valStr: string, setHour: (h: string) => void) => {
    const digits = valStr.replace(/\D/g, "");
    if (digits === "") {
      setHour("");
      return;
    }
    const val = parseInt(digits, 10);
    if (digits === "0" || digits === "00") {
      setHour("0");
    } else if (val >= 1 && val <= 12) {
      setHour(digits.slice(0, 2));
    }
  };

  const handleHourBlur = (hourVal: string, setHour: (h: string) => void, defaultVal = "09") => {
    let h = parseInt(hourVal, 10);
    if (isNaN(h) || h < 1 || h > 12) {
      setHour(defaultVal);
    } else {
      setHour(String(h).padStart(2, "0"));
    }
  };

  const handleMinuteChange = (valStr: string, setMinute: (m: string) => void) => {
    const digits = valStr.replace(/\D/g, "");
    if (digits === "") {
      setMinute("");
      return;
    }
    const val = parseInt(digits, 10);
    if (digits === "0" || digits === "00" || (val >= 0 && val <= 59)) {
      setMinute(digits.slice(0, 2));
    }
  };

  const handleMinuteBlur = (minVal: string, setMinute: (m: string) => void, defaultVal = "00") => {
    let m = parseInt(minVal, 10);
    if (isNaN(m) || m < 0 || m > 59) {
      setMinute(defaultVal);
    } else {
      setMinute(String(m).padStart(2, "0"));
    }
  };

  // Callback refs to handle non-passive wheel scrolling event listeners
  const fromHourCleanup = useRef<{ node: HTMLInputElement; handler: (e: WheelEvent) => void } | null>(null);
  const fromHourRefCallback = useCallback((node: HTMLInputElement | null) => {
    if (fromHourCleanup.current) {
      fromHourCleanup.current.node.removeEventListener("wheel", fromHourCleanup.current.handler);
      fromHourCleanup.current = null;
    }
    if (node) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const isUp = e.deltaY < 0;
        setFromHour(isUp ? incrementHourFunc : decrementHourFunc);
      };
      node.addEventListener("wheel", handleWheel, { passive: false });
      fromHourCleanup.current = { node, handler: handleWheel };
    }
  }, []);

  const fromMinCleanup = useRef<{ node: HTMLInputElement; handler: (e: WheelEvent) => void } | null>(null);
  const fromMinRefCallback = useCallback((node: HTMLInputElement | null) => {
    if (fromMinCleanup.current) {
      fromMinCleanup.current.node.removeEventListener("wheel", fromMinCleanup.current.handler);
      fromMinCleanup.current = null;
    }
    if (node) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const isUp = e.deltaY < 0;
        setFromMinute(isUp ? incrementMinuteFunc : decrementMinuteFunc);
      };
      node.addEventListener("wheel", handleWheel, { passive: false });
      fromMinCleanup.current = { node, handler: handleWheel };
    }
  }, []);

  const toHourCleanup = useRef<{ node: HTMLInputElement; handler: (e: WheelEvent) => void } | null>(null);
  const toHourRefCallback = useCallback((node: HTMLInputElement | null) => {
    if (toHourCleanup.current) {
      toHourCleanup.current.node.removeEventListener("wheel", toHourCleanup.current.handler);
      toHourCleanup.current = null;
    }
    if (node) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const isUp = e.deltaY < 0;
        setToHour(isUp ? incrementHourFunc : decrementHourFunc);
      };
      node.addEventListener("wheel", handleWheel, { passive: false });
      toHourCleanup.current = { node, handler: handleWheel };
    }
  }, []);

  const toMinCleanup = useRef<{ node: HTMLInputElement; handler: (e: WheelEvent) => void } | null>(null);
  const toMinRefCallback = useCallback((node: HTMLInputElement | null) => {
    if (toMinCleanup.current) {
      toMinCleanup.current.node.removeEventListener("wheel", toMinCleanup.current.handler);
      toMinCleanup.current = null;
    }
    if (node) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const isUp = e.deltaY < 0;
        setToMinute(isUp ? incrementMinuteFunc : decrementMinuteFunc);
      };
      node.addEventListener("wheel", handleWheel, { passive: false });
      toMinCleanup.current = { node, handler: handleWheel };
    }
  }, []);

  React.useEffect(() => {
    setEditHours(`${fromHour}:${fromMinute} ${fromAmpm} - ${toHour}:${toMinute} ${toAmpm}`);
  }, [fromHour, fromMinute, fromAmpm, toHour, toMinute, toAmpm]);

  // UI Status Banners
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // States for password visibility eye icon toggles
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showMasterKey, setShowMasterKey] = useState(false);

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
    setAvatarInputMode("link");

    // Parse hours string like "09:00 AM - 05:00 PM"
    const hoursStr = u.hours || "09:00 AM - 05:00 PM";
    const parts = hoursStr.split(" - ");
    if (parts.length === 2) {
      const fromParts = parts[0].split(" ");
      const toParts = parts[1].split(" ");
      
      if (fromParts.length === 2) {
        const fromTime = fromParts[0].split(":");
        if (fromTime.length === 2) {
          setFromHour(fromTime[0]);
          setFromMinute(fromTime[1]);
        }
        setFromAmpm(fromParts[1]);
      }
      
      if (toParts.length === 2) {
        const toTime = toParts[0].split(":");
        if (toTime.length === 2) {
          setToHour(toTime[0]);
          setToMinute(toTime[1]);
        }
        setToAmpm(toParts[1]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMemberEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    let fh = fromHour;
    let fm = fromMinute;
    let th = toHour;
    let tm = toMinute;

    if (!fh || isNaN(parseInt(fh, 10))) fh = "09";
    if (!fm || isNaN(parseInt(fm, 10))) fm = "00";
    if (!th || isNaN(parseInt(th, 10))) th = "05";
    if (!tm || isNaN(parseInt(tm, 10))) tm = "00";

    fh = String(parseInt(fh, 10)).padStart(2, "0");
    fm = String(parseInt(fm, 10)).padStart(2, "0");
    th = String(parseInt(th, 10)).padStart(2, "0");
    tm = String(parseInt(tm, 10)).padStart(2, "0");

    const finalHours = `${fh}:${fm} ${fromAmpm} - ${th}:${tm} ${toAmpm}`;

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
      hours: finalHours,
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
    { name: "Clinical Specialist 1", url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTps0OO8oAWRbrzOtvHKdziTYj5UqTM7fKITg&s" },
    { name: `${currentUser?.name || "Practice Owner"} (Owner)`, url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80" },
    { name: "Clinical Specialist 2", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80" },
    { name: "Administrative Staff", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" },
    { name: "Clinical Specialist 3", url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=150&q=80" }
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
          <span>Registered Personnel & Rosters ({users.length})</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredUsers.map((usr) => {
              const isOwner = usr.id === "usr-1";
              const isSelf = currentUser?.id === usr.id;
              
              // Handle default avatars and color generation
              const avatarBg = "2563EB";
              const finalAvatar = usr.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(usr.name)}&background=${avatarBg}&color=fff&bold=true`;

              const roleIcons: Record<string, any> = {
                admin: Shield,
                doctor: Stethoscope,
                clinician: Stethoscope,
                receptionist: Briefcase,
                frontdesk: Briefcase,
                accountant: Calculator
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
                <motion.div
                  key={usr.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  className={`relative flex flex-col p-6 gap-6 bg-white/90 backdrop-blur-2xl rounded-[32px] transition-all duration-300 group overflow-hidden ${
                    isSelf 
                      ? 'border border-blue-400/40 shadow-[0_16px_40px_-12px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/10' 
                      : 'border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1'
                  }`}
                >
                  {/* Header Section */}
                  <div className="flex items-start justify-between">
                    <div className="relative">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="w-20 h-20 rounded-full border-[3px] border-white shadow-sm overflow-hidden bg-slate-100 ring-1 ring-slate-200/50"
                      >
                        <img src={finalAvatar} alt={usr.name} className="w-full h-full object-cover" />
                      </motion.div>
                      <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-[3px] border-white shadow-sm flex items-center justify-center ${usr.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        {usr.isActive ? <div className="w-2 h-2 bg-white rounded-full" /> : <div className="w-2.5 h-0.5 bg-white rounded-full" />}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {isSelf && (
                          <span className="px-3 py-1 rounded-full bg-blue-50/80 text-blue-600 border border-blue-200/50 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            You
                          </span>
                        )}
                        {isOwner && (
                          <span className="px-3 py-1 rounded-full bg-indigo-50/80 text-indigo-600 border border-indigo-200/50 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                            <Shield size={11} className="text-indigo-500" />
                            Owner
                          </span>
                        )}
                      </div>
                      
                      {usr.assignedRoom && (
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer shadow-xs active:scale-95">
                          <MapPin size={12} className="text-blue-500" />
                          {usr.assignedRoom}
                          <ChevronDown size={11} className="text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Information Section */}
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[22px] font-bold text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                      {usr.name}
                    </h3>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                      {usr.specialty || (usr.role === "clinician" ? "Dentist Practitioner" : usr.role === "admin" ? "Practice Owner & Specialist" : "Clinic Front Desk Officer")}
                    </p>
                  </div>

                  {/* Contact Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a 
                      href={usr.phone ? `tel:${usr.phone}` : '#'} 
                      onClick={e => !usr.phone && e.preventDefault()} 
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${usr.phone ? 'bg-slate-50/50 border-slate-100 hover:bg-blue-50/50 hover:border-blue-200/50 group/contact cursor-pointer shadow-xs' : 'bg-slate-50/30 border-transparent opacity-60 cursor-not-allowed'}`}
                    >
                      <div className={`p-2 rounded-xl ${usr.phone ? 'bg-white shadow-xs text-blue-500' : 'bg-slate-100 text-slate-400'}`}>
                        <Phone size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</span>
                        <span className="text-[12px] font-bold text-slate-700 truncate">{usr.phone || "Missing"}</span>
                      </div>
                    </a>
                    <a 
                      href={usr.email ? `mailto:${usr.email}` : '#'} 
                      onClick={e => !usr.email && e.preventDefault()} 
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${usr.email ? 'bg-slate-50/50 border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-200/50 group/contact cursor-pointer shadow-xs' : 'bg-slate-50/30 border-transparent opacity-60 cursor-not-allowed'}`}
                    >
                      <div className={`p-2 rounded-xl ${usr.email ? 'bg-white shadow-xs text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                        <Mail size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                        <span className="text-[12px] font-bold text-slate-700 truncate">{usr.email || "Missing"}</span>
                      </div>
                    </a>
                  </div>

                  {/* Availability Scheduler Card */}
                  <div className="flex flex-col p-4 rounded-[24px] bg-slate-50/80 border border-slate-100/50 gap-4 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock size={14} className="text-blue-500" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Availability</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 bg-white px-2.5 py-1 rounded-full shadow-xs border border-slate-200/40 font-mono">
                        {usr.hours || "On-Call"}
                      </span>
                    </div>

                    {/* Day Segmented Control */}
                    <div className="flex items-center gap-1 p-1 bg-slate-200/40 rounded-xl border border-slate-200/20">
                      {weekDays.map(day => {
                        const isActive = usr.days?.includes(day);
                        return (
                          <div 
                            key={day} 
                            className="relative flex-1 flex justify-center items-center py-1.5 z-0"
                          >
                            {isActive && (
                              <motion.div 
                                layoutId={`active-day-${usr.id}`}
                                className="absolute inset-0 bg-white rounded-lg shadow-xs z-[-1]"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                            <span className={`text-[9px] font-black transition-all ${
                              isActive ? 'text-blue-600' : 'text-slate-400'
                            }`}>
                              {day.substring(0, 3).toUpperCase()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    </div>

                    {/* Roles & Action Section */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/60 mt-auto">
                    {/* Role Collection */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[usr.role, usr.role2].map((role, rIdx) => {
                        if (!role || (role as string) === "none") return null;
                        const Icon = roleIcons[role] || LucideUser;

                        return (
                          <div key={rIdx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/50 text-slate-600 shadow-3xs">
                            <Icon size={12} className="text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{roleLabels[role] || role}</span>
                          </div>
                        );
                      })}

                      {!usr.isActive && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/50 shadow-3xs">
                          <AlertTriangle size={11} className="text-rose-500" />
                          <span className="text-[10px] font-black uppercase tracking-tight">Revoked</span>
                        </div>
                      )}
                    </div>

                    {/* Administrative Action Icons */}
                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(usr)}
                            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-100 hover:bg-blue-700 transition-all cursor-pointer active:scale-90"
                            title="Edit Personnel Profile"
                          >
                            <Settings size={18} />
                          </button>
                          {!isOwner && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete personnel record for ${usr.name}?`)) {
                                  deleteStaff(usr.id);
                                }
                              }}
                              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all cursor-pointer active:scale-90"
                              title="Remove Personnel"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                          <Lock size={16} />
                        </div>
                      )}
                    </div>
                    </div>

                </motion.div>
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

      {/* TAB: CLINICAL SHIFTS & ROSTERS MANAGER (Merged into Colleague Cards) */}
      {false && (
        <div className="space-y-6 mt-8 pt-8 border-t border-slate-200 animate-fade-in" id="shifts-tab-panel">
          
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
                      placeholder="E.g., Dr. Full Name"
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

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Physical Room Assignment</label>
                    <select
                      value={wizRoom}
                      onChange={(e) => setWizRoom(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-150 transition-all font-bold cursor-pointer"
                    >
                      <option value="">No room assigned</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={`Room ${num}`}>Room {num}</option>
                      ))}
                    </select>
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
        <div className="space-y-6">
          {/* Redesigned Session Info Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <img 
                  src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=150&q=80"} 
                  alt={currentUser?.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-700/50 shadow-md animate-fade-in"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">{currentUser?.name}</h2>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[9px] uppercase font-black tracking-wider rounded border border-blue-500/30">
                    {currentUser?.role || "staff"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">@{currentUser?.username} • Active Operator Session</p>
              </div>
            </div>

            <div className="flex items-center gap-5 relative z-10 text-right">
              <div className="hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Access Clearance</span>
                <span className="text-xs font-black text-slate-200 block mt-0.5 font-mono">
                  {currentUser?.role === "admin" ? "SECURE_ROOT_AUTHORITY" : "CLINICAL_STAFF_AUTH"}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Session Key Status</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 justify-end mt-0.5">
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>SYSTEM_SECURED</span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Password Rotation Card */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-[32px] p-8 shadow-sm space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <KeyRound size={20} className="text-blue-600" />
                    <span>Update Station Passphrase</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Change your workstation passphrase for security clearance compliance.</p>
                </div>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-5">
                {currentUser?.role === "admin" ? (
                  <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wide">
                      <Shield size={16} className="text-blue-500" />
                      <span>Identity Re-Verification Required</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Current Security Pass</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                            <Lock size={14} />
                          </span>
                          <input
                            type={showCurrentPass ? "text" : "password"}
                            value={ownCurrentPass}
                            onChange={(e) => setOwnCurrentPass(e.target.value)}
                            className="w-full pl-9 pr-9 p-2.5 rounded-xl border border-slate-200 text-xs text-stone-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white focus:border-blue-500 font-bold"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-0.5">
                          <span>OR Emergency reset Key</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                            <Key size={14} />
                          </span>
                          <input
                            type={showMasterKey ? "text" : "password"}
                            value={ownMasterKey}
                            onChange={(e) => setOwnMasterKey(e.target.value)}
                            className="w-full pl-9 pr-9 p-2.5 rounded-xl border border-slate-200 text-xs text-stone-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white focus:border-blue-500 font-bold"
                            placeholder="Master resets key..."
                          />
                          <button
                            type="button"
                            onClick={() => setShowMasterKey(!showMasterKey)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showMasterKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-tight">
                      * Change password requires providing your current credentials or the Master reset passphrase.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Provide Current Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Lock size={14} />
                      </span>
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        required
                        value={ownCurrentPass}
                        onChange={(e) => setOwnCurrentPass(e.target.value)}
                        className="w-full pl-9 pr-9 p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-stone-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm font-bold"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Enter New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Lock size={14} />
                      </span>
                      <input
                        type={showNewPass ? "text" : "password"}
                        required
                        value={ownNewPass}
                        onChange={(e) => setOwnNewPass(e.target.value)}
                        className="w-full pl-9 pr-9 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono focus:ring-2 focus:ring-blue-500 shadow-sm font-bold"
                        placeholder="Min. 4 letters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Confirm New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Lock size={14} />
                      </span>
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        required
                        value={ownConfirmPass}
                        onChange={(e) => setOwnConfirmPass(e.target.value)}
                        className="w-full pl-9 pr-9 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono focus:ring-2 focus:ring-blue-500 shadow-sm font-bold"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {pwdError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-pulse">
                    <ShieldAlert size={16} />
                    <span>{pwdError}</span>
                  </div>
                )}

                {pwdSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle size={16} />
                    <span>{pwdSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl active:scale-98 transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <Key size={14} />
                  <span>Publish New Passphrase Code</span>
                </button>
              </form>
            </div>

            {/* Right Column: Security overview / checklist / stats */}
            <div className="lg:col-span-5 space-y-6">
              {/* Session Security Card */}
              <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-sm space-y-5">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Shield size={16} className="text-indigo-500" />
                  <span>Session Shield Status</span>
                </h4>
                
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <Lock size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Passphrase Encryption</span>
                        <span className="text-xs font-bold text-slate-700">AES-256 Client Session</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] uppercase font-black rounded-lg">ACTIVE</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                        <ShieldAlert size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Clearing Authority</span>
                        <span className="text-xs font-bold text-slate-700">
                          {currentUser?.role === "admin" ? "ROOT ACCESS" : "STAFF USER"}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] uppercase font-black rounded-lg">GRANTED</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                        <ScrollText size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Device Fingerprint</span>
                        <span className="text-xs font-bold text-slate-700 font-mono">browser-session-keys</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[9px] uppercase font-black rounded-lg">VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* Safety Policy Rules */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/60 rounded-[32px] p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-500" />
                  <span>Security Recommendations</span>
                </h4>
                <ul className="space-y-2 text-[11px] text-blue-800/80 font-medium">
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Use a unique passphrase that is not shared across other clinic systems or personal accounts.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Avoid using sequential characters (e.g., "1234") or easily guessable dates/names.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Rotate passwords at least every 90 days to maintain high security compliance.</span>
                  </li>
                </ul>
              </div>
            </div>
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
                    Irreversibly restore current offline browser databases back to a clean baseline and restore default duty schedules.
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
      <AnimatePresence>
      {editingUser && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setEditingUser(null)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4 cursor-pointer"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/95 backdrop-blur-2xl rounded-[32px] border border-white/60 p-6 md:p-8 w-full max-w-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.15)] relative cursor-default max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between shrink-0 mb-6 border-b border-slate-100/60 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldAlert size={20} className="text-blue-500" />
                  Modify Personnel Record
                </h3>
                <p className="text-[13px] text-slate-500 font-medium mt-1">
                  Managing credentials and scheduling for <strong className="text-slate-800 font-bold">{editingUser.name}</strong>
                </p>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100/50 hover:bg-slate-200/50 cursor-pointer p-2 rounded-full transition-colors active:scale-90"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form id="edit-staff-form" onSubmit={handleSaveMemberEdit} className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              
              {/* Identity & Contact Card */}
              <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-5 space-y-4 shadow-inner">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <LucideUser size={14} /> Identity & Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Legal Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200/60 rounded-xl text-[13px] text-slate-800 font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-3xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Username Identifier</label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200/60 rounded-xl text-[13px] text-slate-800 font-mono font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-3xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Communication Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200/60 rounded-xl text-[13px] text-slate-800 font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-3xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Telephone Line</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200/60 rounded-xl text-[13px] text-slate-800 font-mono font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-3xs"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Assignment Card */}
              <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-5 space-y-4 shadow-inner">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Briefcase size={14} /> Role & Assignment
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Primary Role</label>
                    <div className="relative">
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="w-full px-4 py-3 bg-white border border-slate-200/60 rounded-xl text-[13px] text-slate-800 font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-3xs appearance-none cursor-pointer"
                      >
                        <option value="clinician">Clinical Dentist</option>
                        <option value="doctor">Medical Doctor</option>
                        <option value="receptionist">Reception Staff</option>
                        <option value="frontdesk">Front Desk Check-in</option>
                        <option value="accountant">Financial Accountant</option>
                        <option value="admin">System Administrator</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Secondary Role (Optional)</label>
                    <div className="relative">
                      <select
                        value={editRole2}
                        onChange={(e) => setEditRole2(e.target.value as "none" | UserRole)}
                        className="w-full px-4 py-3 bg-white border border-slate-200/60 rounded-xl text-[13px] text-slate-800 font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-3xs appearance-none cursor-pointer"
                      >
                        <option value="none">-- None --</option>
                        <option value="clinician">Clinical Dentist</option>
                        <option value="doctor">Medical Doctor</option>
                        <option value="receptionist">Reception Staff</option>
                        <option value="frontdesk">Front Desk Check-in</option>
                        <option value="accountant">Financial Accountant</option>
                        <option value="admin">System Administrator</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Medical Specialty</label>
                    <input
                      type="text"
                      value={editSpecialty}
                      onChange={(e) => setEditSpecialty(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200/60 rounded-xl text-[13px] text-slate-800 font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-3xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Assigned Clinic Room</label>
                    <input
                      type="text"
                      value={editRoom}
                      onChange={(e) => setEditRoom(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200/60 rounded-xl text-[13px] text-slate-800 font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-3xs"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule & Availability Card */}
              <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-5 space-y-4 shadow-inner">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Calendar size={14} /> Schedule & Availability
                </h4>
                
                {/* Time Picker Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">From Time</label>
                    <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200/60 shadow-3xs">
                      <div className="flex flex-col items-center">
                        <button type="button" onClick={() => setFromHour(incrementHourFunc)} className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer">▲</button>
                        <input ref={fromHourRefCallback} type="text" value={fromHour} onChange={(e) => handleHourChange(e.target.value, setFromHour)} onBlur={() => handleHourBlur(fromHour, setFromHour, "09")} className="w-9 text-center text-sm font-black text-slate-800 focus:outline-none cursor-ns-resize bg-transparent" />
                        <button type="button" onClick={() => setFromHour(decrementHourFunc)} className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer">▼</button>
                      </div>
                      <span className="text-slate-300 font-black text-sm">:</span>
                      <div className="flex flex-col items-center">
                        <button type="button" onClick={() => setFromMinute(incrementMinuteFunc)} className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer">▲</button>
                        <input ref={fromMinRefCallback} type="text" value={fromMinute} onChange={(e) => handleMinuteChange(e.target.value, setFromMinute)} onBlur={() => handleMinuteBlur(fromMinute, setFromMinute, "00")} className="w-9 text-center text-sm font-black text-slate-800 focus:outline-none cursor-ns-resize bg-transparent" />
                        <button type="button" onClick={() => setFromMinute(decrementMinuteFunc)} className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer">▼</button>
                      </div>
                      <button type="button" onClick={() => setFromAmpm(fromAmpm === "AM" ? "PM" : "AM")} className="ml-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black uppercase rounded-lg transition-colors cursor-pointer">
                        {fromAmpm}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">To Time</label>
                    <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200/60 shadow-3xs">
                      <div className="flex flex-col items-center">
                        <button type="button" onClick={() => setToHour(incrementHourFunc)} className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer">▲</button>
                        <input ref={toHourRefCallback} type="text" value={toHour} onChange={(e) => handleHourChange(e.target.value, setToHour)} onBlur={() => handleHourBlur(toHour, setToHour, "05")} className="w-9 text-center text-sm font-black text-slate-800 focus:outline-none cursor-ns-resize bg-transparent" />
                        <button type="button" onClick={() => setToHour(decrementHourFunc)} className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer">▼</button>
                      </div>
                      <span className="text-slate-300 font-black text-sm">:</span>
                      <div className="flex flex-col items-center">
                        <button type="button" onClick={() => setToMinute(incrementMinuteFunc)} className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer">▲</button>
                        <input ref={toMinRefCallback} type="text" value={toMinute} onChange={(e) => handleMinuteChange(e.target.value, setToMinute)} onBlur={() => handleMinuteBlur(toMinute, setToMinute, "00")} className="w-9 text-center text-sm font-black text-slate-800 focus:outline-none cursor-ns-resize bg-transparent" />
                        <button type="button" onClick={() => setToMinute(decrementMinuteFunc)} className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer">▼</button>
                      </div>
                      <button type="button" onClick={() => setToAmpm(toAmpm === "AM" ? "PM" : "AM")} className="ml-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black uppercase rounded-lg transition-colors cursor-pointer">
                        {toAmpm}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Day Segmented Control */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Working Days</label>
                  <div className="flex items-center p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200/30 gap-1 overflow-x-auto">
                    {weekDays.map((day) => {
                      const isActive = editDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isActive) {
                              setEditDays(editDays.filter(d => d !== day));
                            } else {
                              setEditDays([...editDays, day]);
                            }
                          }}
                          className="relative flex-1 min-w-[40px] flex justify-center items-center py-2.5 rounded-xl cursor-pointer transition-colors z-0 focus:outline-none"
                        >
                          {isActive && (
                            <motion.div 
                              layoutId="active-day-edit"
                              className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <span className={`text-[11px] font-bold z-10 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                            {day.substring(0, 3)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Security Card */}
              <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-5 space-y-4 shadow-inner">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Lock size={14} /> Security
                </h4>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Overrule Passphrase Code</label>
                  <input
                    type="text"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200/60 rounded-xl text-[13px] text-slate-800 font-mono font-semibold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all outline-none shadow-3xs"
                  />
                </div>
              </div>
              
            </form>

            {/* Modal Footer */}
            <div className="pt-6 mt-2 border-t border-slate-100/60 flex items-center justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setEditingUser(null)}
                className="px-6 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[13px] transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="edit-staff-form"
                className="flex-1 sm:flex-none sm:px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] transition-all cursor-pointer shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] active:scale-95 flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Save Modifications
              </button>
            </div>
            
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

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
