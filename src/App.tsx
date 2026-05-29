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
import { UserRole } from "./types";
import { auth } from "./firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
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
  KeyRound
} from "lucide-react";

export default function App() {
  const { currentUser, login, addPatient, users, theme, setCurrentUser } = useStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Welcome Screen state
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Auto trigger welcome screen when user logs in
  React.useEffect(() => {
    if (currentUser && !hasShownWelcome) {
      setShowWelcome(true);
      setHasShownWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 3200);
      return () => clearTimeout(timer);
    }
  }, [currentUser, hasShownWelcome]);

  // Monitor Firebase Authentication state and synchronize with clinic context
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || "";
        const name = firebaseUser.displayName || "Dr. Guest";
        let found = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (!found) {
          // Auto register this Firebase practitioner into the staff list
          const rawId = `usr-${firebaseUser.uid}`;
          const newU = {
            id: rawId,
            name,
            username: email.split("@")[0] || "gp_practitioner",
            role: "clinician" as const,
            isActive: true,
            email,
            avatarUrl: firebaseUser.photoURL || "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=150&q=80",
            specialty: "Clinical Specialist (Firebase)",
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
        useStore.getState().startFirestoreSync();
      } else {
        if (!useStore.getState().currentUser) {
          useStore.getState().stopFirestoreSync();
        }
      }
    });
    return () => unsubscribe();
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

  // Google Sign-In state handler
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Overrider Admin state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotKeyInput, setForgotKeyInput] = useState("");
  const [forgotError, setForgotError] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Live clock
  const [currentTime, setCurrentTime] = React.useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const MASTER_KEY = "UQBPQl-j7IW5K3yYm7vu3WWANjyDd8Q2sUQvlxMAlcgxUbkb";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(loginUsername, loginPassword, loginRole);
    if (ok) {
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Authentication error: ", err);
      setGoogleError(err?.message || "Authentication aborted by user.");
    } finally {
      setIsGoogleLoading(false);
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

            {/* Password reset flow with Emergency Master Key bypass */}
            {showForgot ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (forgotKeyInput === MASTER_KEY) {
                  useStore.getState().adminResetPassword("usr-1", "owner123");
                  setForgotSuccess(true);
                  setForgotError(false);
                } else {
                  setForgotError(true);
                  setForgotSuccess(false);
                }
              }} className="space-y-4">
                <div className="space-y-1.5 text-center">
                  <KeyRound className={`mx-auto animate-pulse ${forgotSuccess ? 'text-emerald-500' : 'text-amber-500'}`} size={32} />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    {forgotSuccess ? 'Root Auth Restored' : 'Reset Managed by Backend'}
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    {forgotSuccess 
                      ? "Administrative bypass successful. Primary owner password has been reset to default: 'owner123'."
                      : "Password resets are disabled in the client UI. Contact an administrator or provide Emergency Master Key."}
                  </p>
                </div>

                {!forgotSuccess && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Emergency Master Key</label>
                    <input
                      type="text"
                      value={forgotKeyInput}
                      onChange={(e) => setForgotKeyInput(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-[11px] font-mono tracking-wide text-amber-800 transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-blue-150"
                      placeholder="Enter master bypass key..."
                    />
                  </div>
                )}

                {forgotError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[10px] uppercase font-extrabold text-center">
                    Invalid Key: Emergency reset rejected.
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(false);
                      setForgotError(false);
                      setForgotKeyInput("");
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Back to Normal Login
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Submit Request
                  </button>
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
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-stone-700 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">System Authority</label>
                  <select
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value as UserRole)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-stone-700 focus:outline-none"
                  >
                    <option value="admin">Administrator Access</option>
                    <option value="clinician">Clinical Practitioner</option>
                    <option value="frontdesk">Frontdesk Reception Clerk</option>
                  </select>
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

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-[9px] font-bold text-slate-400 tracking-wider">Or secure with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-100 disabled:opacity-50"
                >
                  <svg className="h-4 w-4 mr-1 shrink-0" viewBox="0 0 24 24" width="16" height="16">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  {isGoogleLoading ? (
                    <span className="animate-pulse">Authorizing Google profile...</span>
                  ) : (
                    <span>Sign In with Google Identity</span>
                  )}
                </button>

                {googleError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[10px] leading-snug flex gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{googleError}</span>
                  </div>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Forgot Password? Request Secure Reset
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-1 bg-blue-600 rounded-full mb-6" />
                <span className="text-xl md:text-2xl font-bold text-slate-500 uppercase tracking-[0.3em] ml-2">
                  {currentUser?.name || "Practitioner"}
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
