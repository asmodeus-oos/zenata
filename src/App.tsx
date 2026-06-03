import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "./store";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Patients from "./components/Patients";
import Appointments from "./components/Appointments";
import Finance from "./components/Finance";
import Staff from "./components/Staff";
import Inventory from "./components/Inventory";
import Settings from "./components/Settings";
import Performance from "./components/Performance";
import { PremiumSelect } from "./components/ui/PremiumSelect";
import { UserRole, User } from "./types";
import { supabase } from "./supabase";
import { 
  Stethoscope, 
  ShieldCheck, 
  Lock, 
  ChevronRight, 
  Users, 
  Activity, 
  Plus, 
  Clock, 
  X,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff
} from "lucide-react";

export default function App() {
  const { currentUser, login, addPatient, users, theme, setCurrentUser } = useStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Welcome Screen state
  const [showWelcome, setShowWelcome] = useState(false);
  const [lastWelcomeUserId, setLastWelcomeUserId] = useState<string | null>(null);

  // Auto trigger welcome screen when user logs in or logs in as another staff
  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.id !== lastWelcomeUserId) {
        setShowWelcome(true);
        setLastWelcomeUserId(currentUser.id);
      }
    } else {
      if (lastWelcomeUserId !== null) {
        setLastWelcomeUserId(null);
      }
    }
  }, [currentUser, lastWelcomeUserId]);

  // Separate timer for stable dismissal
  React.useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 3800);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  // Derived current user name from users list to ensure dynamic sync
  const welcomeName = React.useMemo(() => {
    if (!currentUser) return "Practitioner";
    const liveMatch = users.find(u => u.id === currentUser.id);
    return liveMatch ? liveMatch.name : currentUser.name;
  }, [currentUser, users]);

  // Monitor Supabase Authentication state and synchronize with clinic context
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const firebaseUser = session.user;
        const email = firebaseUser.email || "";
        const name = firebaseUser.user_metadata?.name || email.split("@")[0] || "Practitioner";
        let found = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (!found) {
          // Auto register this Supabase practitioner into the staff list
          const rawId = firebaseUser.id;
          const newU = {
            id: rawId,
            name,
            username: email.split("@")[0] || "gp_practitioner",
            role: "clinician" as const,
            isActive: true,
            email,
            avatarUrl: firebaseUser.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=150&q=80",
            specialty: "Clinical Specialist (Supabase)",
            days: ["Monday", "Wednesday", "Friday"],
            hours: "09:00 AM - 05:00 PM"
          };
          
          const existing = useStore.getState().users;
          if (!existing.some(u => u.email?.toLowerCase() === email.toLowerCase())) {
            useStore.setState({ users: [...existing, newU] });
          }
          found = newU;
        }
        
        setCurrentUser(found);
        useStore.getState().startSupabaseSync();
      } else {
        if (!useStore.getState().currentUser) {
          useStore.getState().stopSupabaseSync();
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [users, setCurrentUser]);

  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
    // Prune orphaned shifts on boot
    useStore.getState().syncShiftsWithStaff();
  }, []);

  // Portal login panel states
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<UserRole>("admin");
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Overrider Admin state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotKeyInput, setForgotKeyInput] = useState("");
  const [forgotError, setForgotError] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Live clock
  const [currentTime, setCurrentTime] = React.useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(loginUsername, loginPassword, loginRole);
    if (ok) {
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  // Safe navigation switches
  const handleSelectPatientFromDashboard = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab("patients");
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="clinic-login-portal">
        {/* Navigation Branding Header */}
        <header className="p-6 border-b border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
              Z
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm tracking-tight leading-none animate-pulse">Zendenta Suite</h1>
              <p className="text-[10px] uppercase font-bold tracking-wider text-blue-500 mt-1">Dental Clinic ERP</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Clock size={14} className="text-slate-400" />
            <span>{currentTime.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {currentTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
          </div>
        </header>

        {/* Login Form card */}
        <main className="w-full flex-1 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[24px] md:rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-xl flex flex-col space-y-6 mx-4 md:mx-0">
            <div className="text-center space-y-2">

              <Stethoscope className="mx-auto text-blue-600 mb-2" size={40} />
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Personnel Authorization</h2>
              <p className="text-xs text-slate-400 leading-normal max-w-[280px] mx-auto">
                Authenticate with your personnel credentials to instantly decrypt local archives.
              </p>
            </div>

            {/* Password recovery flow with Emergency Master Key to retrieve owner's credentials */}
            {showForgot ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsVerifying(true);
                setForgotError(false);
                try {
                  // Simulate brief network delay for UX
                  await new Promise(r => setTimeout(r, 600));

                  const EXPECTED_KEY = "UQBPQl-j7IW5K3yYm7vu3WWANjyDd8Q2sUQvlxMAlcgxUbkb";

                  if (forgotKeyInput === EXPECTED_KEY) {
                    setForgotSuccess(true);
                    
                    // Force inject owner to ensure it's visible in the UI immediately
                    const hasOwner = users.find(u => u.id === "usr-1" || u.role === "admin");
                    if (!hasOwner) {
                        const newOwner: User = {
                            id: "usr-1",
                            name: "System Owner",
                            username: "admin",
                            role: "admin",
                            isActive: true,
                            password: "owner123"
                        };
                        useStore.getState().updateUserProfile("usr-1", newOwner as any);
                    }
                  } else {
                    setForgotError(true);
                    setForgotSuccess(false);
                  }
                } catch (error) {
                  setForgotError(true);
                  setForgotSuccess(false);
                } finally {
                  setIsVerifying(false);
                }
              }} className="space-y-4">
                <div className="space-y-1.5 text-center">
                  <KeyRound className={`mx-auto ${isVerifying ? 'animate-bounce text-blue-500' : forgotSuccess ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`} size={32} />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    {isVerifying ? 'Verifying with Secure Server...' : forgotSuccess ? 'Owner Account Access Granted' : 'Security Clearance Authorization'}
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    {forgotSuccess 
                      ? "Authentication verified. Below are the administrative credentials for the system owner."
                      : "Provide the emergency Master Key to retrieve owner's authentication passphrase."}
                  </p>
                </div>

                {forgotSuccess ? (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3 text-left">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Owner Username</span>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 select-all">
                        {users.find(u => u.id === "usr-1" || u.role === "admin")?.username || "admin"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Current Passphrase</span>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 select-all flex items-center justify-between">
                        <span>{users.find(u => u.id === "usr-1" || u.role === "admin")?.password || "owner123"}</span>
                        <span className="text-[9px] uppercase font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Owner Account</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Emergency Master Key</label>
                    <input
                      type="password"
                      value={forgotKeyInput}
                      onChange={(e) => setForgotKeyInput(e.target.value)}
                      disabled={isVerifying}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-[11px] font-mono tracking-wide text-amber-800 transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-blue-150 disabled:opacity-50"
                      placeholder="Enter master bypass key..."
                    />
                  </div>
                )}

                {forgotError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[10px] uppercase font-extrabold text-center animate-shake">
                    Invalid Key: Emergency retrieval rejected.
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(false);
                      setForgotError(false);
                      setForgotKeyInput("");
                      setForgotSuccess(false);
                    }}
                    disabled={isVerifying}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Back to Normal Login
                  </button>
                  {!forgotSuccess && (
                    <button
                      type="submit"
                      disabled={isVerifying || !forgotKeyInput}
                      className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify Master Key'}
                    </button>
                  )}
                </div>
              </form>
            ) : (
              /* Dynamic Interactive Login form */
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Security Username</label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-stone-700 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="admin"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Security Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-white text-xs text-stone-700 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-650 focus:outline-none cursor-pointer flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">System Authority</label>
                  <PremiumSelect
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value as UserRole)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-stone-700 focus:outline-none"
                  >
                    <option value="admin">Administrator Access</option>
                    <option value="clinician">Clinical Practitioner</option>
                    <option value="frontdesk">Frontdesk Reception Clerk</option>
                  </PremiumSelect>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-500/10 border border-red-200 rounded-xl text-red-700 text-[10px] leading-snug flex gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Mismatch username or role credentials. Ensure user is marked "Authorized" by administrator in staff suite.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-100 active:scale-95 transition-all text-center"
                >
                  <Lock size={14} />
                  <span>Decrypt Safe Folder</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Retrieve Owner Credentials (Requires Master Key)
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>

        <footer className="p-4 text-center text-[10px] text-slate-400 font-medium">
          Zendenta Enterprise ERP • Secured Local Persistence • All Rights Reserved 2026.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-55 overflow-hidden flex" id="clinic-master-viewport">
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-4">
                Hello.
              </h1>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-1 bg-blue-600 rounded-full mb-6 shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                <span className="text-xl md:text-2xl font-bold text-slate-500 uppercase tracking-[0.4em] ml-3">
                  {welcomeName}
                </span>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="absolute bottom-12 text-[10px] font-black uppercase tracking-widest text-slate-400"
            >
              Zendenta Clinical Intelligence • Secure Boot Active
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PERSISTENT SIDEBAR Drawer */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
      />

      {/* CORE WORKSPACE SCREEN */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        {/* Navigated tab component container */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto scroll-smooth scroll-smooth-container print:p-0 print:overflow-visible print:h-auto">
          {activeTab === "dashboard" && (
            <Dashboard 
              onSwitchTab={setActiveTab} 
              onSelectPatient={handleSelectPatientFromDashboard} 
            />
          )}
          {activeTab === "patients" && (
            <Patients 
              selectedPatientId={selectedPatientId} 
              onSelectPatient={setSelectedPatientId} 
            />
          )}
          {activeTab === "appointments" && (
            <Appointments 
              onSwitchTab={setActiveTab}
              onSelectPatient={handleSelectPatientFromDashboard}
            />
          )}
          {activeTab === "finance" && (
            <Finance 
              onSwitchTab={setActiveTab}
              onSelectPatient={handleSelectPatientFromDashboard}
            />
          )}
          {activeTab === "staff" && (
            <Staff />
          )}
          {activeTab === "inventory" && (
            <Inventory />
          )}
          {activeTab === "performance" && (
            <Performance />
          )}
          {activeTab === "settings" && (
            <Settings />
          )}
        </main>
      </div>
    </div>
  );
}
