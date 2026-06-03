# Staff Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely redesign the Staff Directory card in `src/components/Staff.tsx` from scratch following iOS 26 / VisionOS inspired aesthetic.

**Architecture:** Replacing the legacy `filteredUsers.map` block with a premium glass-morphic `StaffCard` implementation. Leveraging Tailwind CSS v4 and Framer Motion for high-fidelity animations and depth.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React.

---

### Task 1: Update Lucide React Imports

**Files:**
- Modify: `src/components/Staff.tsx:1-36`

- [ ] **Step 1: Add missing icons to the imports**

```tsx
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
  User,
  ChevronDown,
  ExternalLink
} from "lucide-react";
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Staff.tsx
git commit -m "style: add new icons for staff card redesign"
```

### Task 2: Implement the Redesigned Staff Card

**Files:**
- Modify: `src/components/Staff.tsx:810-1050` (approximate range for the card mapping)

- [ ] **Step 1: Replace the old card implementation with the new VisionOS/iOS inspired design**

```tsx
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
                      <p className="text-[13px] text-slate-500 font-semibold tracking-wide uppercase text-[10px] text-slate-400 mt-1">
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
                              className={`flex-1 flex justify-center items-center py-1.5 rounded-lg text-[9px] font-black transition-all ${
                                isActive ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400'
                              }`}
                            >
                              {day.substring(0, 3).toUpperCase()}
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
                          const Icon = roleIcons[role] || User;

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
                              className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-100 hover:bg-blue-700 transition-all cursor-pointer active:scale-90"
                              title="Edit Personnel Profile"
                            >
                              <Settings size={16} />
                            </button>
                            {!isOwner && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete personnel record for ${usr.name}?`)) {
                                    deleteStaff(usr.id);
                                  }
                                }}
                                className="flex items-center justify-center w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all cursor-pointer active:scale-90"
                                title="Remove Personnel"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                            <Lock size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Staff.tsx
git commit -m "feat: implement redesigned staff directory card with VisionOS/iOS aesthetic"
```

### Task 3: Final Verification

**Files:**
- Test: Manual Verification in Browser

- [ ] **Step 1: Verify the visual layout**
   - Check light mode appearance (Background #F5F7FA).
   - Check dark mode appearance (if applicable).
   - Check responsiveness (Mobile stacking).

- [ ] **Step 2: Verify interactions**
   - Hover effects on cards.
   - Hover effects on contact cards.
   - Press effect on action buttons.

- [ ] **Step 3: Verify data wiring**
   - Correct name and specialty displayed.
   - Correct icons for roles.
   - Correct shift hours and days highlighting.
