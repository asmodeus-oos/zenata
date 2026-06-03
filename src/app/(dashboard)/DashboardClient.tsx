"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  UserCheck, 
  Activity,
  HeartPulse,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Package,
  RefreshCw,
  Bell,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { PremiumSelect } from "@/components/ui/PremiumSelect";

interface DashboardClientProps {
  currentUser: any;
  patients: any[];
  appointments: any[];
  financialRecords: any[];
  inventory: any[];
  onSwitchTab?: (tab: string) => void;
  onSelectPatient?: (pId: string) => void;
  updateInventoryAction?: (id: string, data: any) => Promise<void>;
}

export default function DashboardClient({ 
  currentUser,
  patients,
  appointments,
  financialRecords,
  inventory,
  onSwitchTab,
  onSelectPatient,
  updateInventoryAction
}: DashboardClientProps) {
  const [activityFilter, setActivityFilter] = useState<"all" | "Filling" | "Extraction" | "Prosthetic">("all");

  // Dynamic state for low inventory tracking background checks
  const [lastCheckTime, setLastCheckTime] = useState<string>("");
  const [isCheckRunning, setIsCheckRunning] = useState<boolean>(false);
  const [activeShortagesCount, setActiveShortagesCount] = useState<number>(0);
  const [sessionMutedItemIds, setSessionMutedItemIds] = useState<string[]>([]);
  const [isAlertsPanelOpen, setIsAlertsPanelOpen] = useState<boolean>(true);
  const [successToastMessage, setSuccessToastMessage] = useState<string | null>(null);

  const updateInventoryItem = async (id: string, data: any) => {
    if (updateInventoryAction) await updateInventoryAction(id, data);
  };

  // Background check simulator / compiler diagnostics runner
  const triggerBackgroundCheck = useCallback(() => {
    setIsCheckRunning(true);
    // Simulate diagnostic latency to demonstrate background checking activity to user
    const timer = setTimeout(() => {
      const shortages = inventory ? inventory.filter(item => item.quantity <= item.minQty) : [];
      setActiveShortagesCount(shortages.length);
      const now = new Date();
      setLastCheckTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsCheckRunning(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [inventory]);

  // Reactive Background watcher triggers on any inventory state changes
  useEffect(() => {
    const unsub = triggerBackgroundCheck();
    return () => {
      if (unsub) unsub();
    };
  }, [inventory, triggerBackgroundCheck]);

  // Extract items that are below threshold and not manually muted in session
  const criticalItems = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter(item => item.quantity <= item.minQty && !sessionMutedItemIds.includes(item.id));
  }, [inventory, sessionMutedItemIds]);

  const totalPatientsCount = patients.length;
  const activeAppointments = useMemo(() => {
    return appointments.filter(a => a.status === "Scheduled");
  }, [appointments]);

  // Format currency
  const formatCurrency = useCallback((val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  }, []);

  // Financial Calculators
  const financialStats = useMemo(() => {
    let totalRevenue = 0;
    let pendingDues = 0;

    // Sum from Ledger Payments
    financialRecords.forEach(record => {
      totalRevenue += record.paidAmount;
    });

    const isProstheticRecord = (name: string) => {
      const lower = name.toLowerCase();
      return (
        lower.includes("zirconia") ||
        lower.includes("e-max") ||
        lower.includes("porcelain") ||
        lower.includes("bridge") ||
        lower.includes("denture") ||
        lower.includes("crown") ||
        lower.includes("prosthetic")
      );
    };

    // Sum from Patients' Prosthetics & non-prosthetic Remaining Amounts
    patients.forEach(pat => {
      const prostOwed = pat.prostheticsRecords?.reduce((sum, pr) => sum + (pr.remainingAmount || 0), 0) || 0;
      const nonProstOwed = financialRecords
        .filter(f => f.patientId === pat.id && f.remainingAmount > 0 && !isProstheticRecord(f.procedureName))
        .reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0;
      pendingDues += (prostOwed + nonProstOwed);
    });

    return { totalRevenue, pendingDues };
  }, [financialRecords, patients]);

  // Current Day Booking Queue Analytics
  const todayStr = new Date().toISOString().split('T')[0]; // Use real-time system date
  const liveTodayQueue = useMemo(() => {
    return appointments
      .filter(a => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, todayStr]);

  const statsList = useMemo(() => [
    {
      label: "Total Patient Base",
      value: totalPatientsCount,
      change: "All registered records",
      icon: Users,
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      label: "Live Booking Queue",
      value: liveTodayQueue.length,
      change: `${liveTodayQueue.filter(a => ["Scheduled", "Waiting", "In chair"].includes(a.status)).length} active/pending today`,
      icon: Clock,
      color: "bg-amber-50 text-amber-600 border-amber-100"
    },
    {
      label: "Total Clinic Revenue",
      value: formatCurrency(financialStats.totalRevenue),
      change: "All integrated works",
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    {
      label: "Outstanding Ledgers",
      value: formatCurrency(financialStats.pendingDues),
      change: "Uncollected clinical balances",
      icon: TrendingUp,
      color: "bg-rose-50 text-rose-600 border-rose-100"
    }
  ], [totalPatientsCount, liveTodayQueue, financialStats, formatCurrency]);

  // Prepare chart data for Procedure Distributions
  const chartDataByProcedure = useMemo(() => {
    const counts: { [key: string]: number } = {
      "Consultation": 0,
      "Filling": 0,
      "Extraction": 0,
      "Crown & Prosthetic": 0,
      "Orthodontic": 0,
      "Hygiene/Clean": 0
    };

    appointments.forEach(a => {
      if (counts[a.procedureType] !== undefined) {
        counts[a.procedureType]++;
      } else {
        counts[a.procedureType] = 1;
      }
    });

    return Object.keys(counts).map(key => ({
      name: key,
      Volume: counts[key]
    }));
  }, [appointments]);

  const recentRevenueChartData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    // Generate actual daily totals from financial records for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Calculate revenue for this specific day from financialRecords
      const dayRevenue = financialRecords
        .filter(r => r.date === dateKey && r.type !== "expense")
        .reduce((sum, r) => sum + r.paidAmount, 0);

      data.push({ 
        date: i === 0 ? `${dateLabel} (Today)` : dateLabel, 
        Revenue: dayRevenue 
      });
    }
    
    return data;
  }, [financialRecords]);

  const rollingWeeklyRevenue = useMemo(() => {
    return recentRevenueChartData.reduce((sum, day) => sum + day.Revenue, 0);
  }, [recentRevenueChartData]);

  const recentActivities = useMemo(() => {
    const list: Array<{
      patientName: string;
      patientId: string;
      procedureType: string;
      type: "Filling" | "Extraction" | "Prosthetic";
      date: string;
      notes: string;
    }> = [];

    patients.forEach(p => {
      p.fillingRecords.forEach(f => {
        list.push({
          patientName: p.name,
          patientId: p.id,
          procedureType: `${f.material} Filling (Tooth ${f.toothNumber})`,
          type: "Filling",
          date: f.date,
          notes: f.notes || ""
        });
      });
      p.extractionRecords.forEach(e => {
        list.push({
          patientName: p.name,
          patientId: p.id,
          procedureType: `${e.type} Extraction (Tooth ${e.toothNumber})`,
          type: "Extraction",
          date: e.date,
          notes: e.reason || ""
        });
      });
      p.prostheticsRecords.forEach(pr => {
        list.push({
          patientName: p.name,
          patientId: p.id,
          procedureType: `${pr.prostheticType} Crown Prep (Tooth ${pr.toothNumber})`,
          type: "Prosthetic",
          date: pr.date,
          notes: pr.notes || ""
        });
      });
    });

    const filtered = activityFilter === "all"
      ? list
      : list.filter(item => item.type === activityFilter);

    return filtered
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [patients, activityFilter]);

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-module-container">
      {/* Header and greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-600/10 border border-blue-200/50 px-3 py-1.5 rounded-full select-none">
            Clinical HQ
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2.5">
            Welcome back, {currentUser?.name}
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Active Clinician Session • Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • Local Persisted Cache is synchronised.
          </p>
        </div>

        {/* Quick Help Status */}
        <div className={`flex items-center gap-3 border border-slate-200/80 p-3.5 rounded-[20px] shadow-sm ${currentUser?.role === 'admin' ? 'bg-white' : 'bg-slate-50'}`}>
          <ShieldCheck className="text-emerald-500" size={20} />
          <div>
            <span className="text-xs font-bold text-slate-800 block">Zendenta Offline Security</span>
            <span className="text-[11px] text-slate-500 block">Staff Role: <strong className="capitalize text-blue-600">{currentUser?.role}</strong></span>
          </div>
        </div>
      </div>

      {/* Toast feedback for instant actions */}
      <AnimatePresence>
        {successToastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 p-4 bg-emerald-650 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 max-w-sm"
          >
            <CheckCircle2 size={18} className="shrink-0" />
            <div className="flex-1 text-xs font-bold">{successToastMessage}</div>
            <button 
              onClick={() => setSuccessToastMessage(null)}
              className="text-white/80 hover:text-white font-extrabold text-xs ml-2 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsList.map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={idx} 
              className="frosted-glass-card frosted-glass-card-hover p-6 rounded-[28px] flex items-center justify-between relative overflow-hidden"
            >
              <div className="space-y-1.5 z-10">
                <span className="text-xs font-semibold text-slate-500 tracking-wide block">{stat.label}</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight block">{stat.value}</span>
                <span className="text-[10px] text-slate-400 block font-medium">{stat.change}</span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border z-10 ${stat.color}`}>
                <IconComponent size={22} />
              </div>
              {/* Subtle visual gradient background indicator */}
              <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-blue-500/5 rounded-full blur-xl" />
            </div>
          );
        })}
      </div>

      {/* Dynamic Queue and Quick Scheduler view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Queue for Today */}
        <div className="lg:col-span-2 frosted-glass-panel rounded-[32px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <HeartPulse size={18} className="text-blue-500" />
                <span>Today's Live Queue</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time scheduling for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <button
              onClick={() => onSwitchTab("appointments")}
              className="text-xs font-bold text-blue-600 hover:text-blue-750 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Schedule Wizard</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {liveTodayQueue.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <Calendar size={32} className="text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 font-semibold text-sm">No bookings scheduled for today.</p>
              <p className="text-xs text-slate-400 mt-1">Click Schedule Wizard to record a booking.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {liveTodayQueue.map(app => {
                const isSelected = app.status === "Completed";
                return (
                  <div 
                    key={app.id} 
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isSelected 
                        ? "bg-slate-50 border-slate-200/60 opacity-75" 
                        : "bg-white border-slate-200 hover:bg-slate-50/50 hover:border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-700 flex flex-col items-center justify-center font-bold text-xs select-none">
                        <span className="text-[10px] text-blue-500 font-bold leading-none">TIME</span>
                        <span className="text-slate-800 font-black text-sm">{app.time}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => onSelectPatient(app.patientId)}
                            className="font-bold text-slate-800 text-sm hover:text-blue-600 hover:underline transition-all text-left truncate"
                          >
                            {app.patientName}
                          </button>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                            {app.procedureType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Phone: {app.patientPhone || "N/A"}</p>
                        <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">"{app.notes || 'No doctor comments recorded.'}"</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <span className="text-xs text-slate-500 font-medium tracking-tight">Assigned: <strong>{app.doctorName ? app.doctorName.replace("Dr. ", "") : "Practitioner"}</strong></span>
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg ${
                        app.status === "Scheduled" 
                          ? "bg-amber-100 text-amber-700 border border-amber-200" 
                          : app.status === "Waiting"
                          ? "bg-sky-100 text-sky-700 border border-sky-200"
                          : app.status === "In chair"
                          ? "bg-blue-600 text-white border border-blue-700 shadow-sm"
                          : app.status === "Completed"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Treatment Distribution Pie/Bar */}
        <div className="frosted-glass-panel rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <Activity size={18} className="text-blue-500" />
              <span>Demographic Procedures</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-medium">Volume aggregate of all booking cards</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartDataByProcedure} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#64748B" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="#64748B" />
                <Tooltip />
                <Bar dataKey="Volume" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[10px] text-slate-400 leading-snug pt-3 border-t border-white/60 mt-3 font-medium">
            Clinical revenue is calculated from finalized ledger payments. Update availability in the Roster.
          </div>
        </div>
      </div>

      {/* Revenue trend line (Full width for executive clarity) */}
      <div className="frosted-glass-panel rounded-[32px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              <span>Revenue Trend & Collected Dues</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Aggregate ledger earnings across the last 7 days of clinical activity</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-tight">7-Day Collection Total</span>
            <span className="text-xl font-black text-emerald-600 block leading-none mt-1">
              {formatCurrency(rollingWeeklyRevenue)}
            </span>
          </div>
        </div>
        <div className="h-48 sm:h-64 md:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={recentRevenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#64748B" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748B" />
              <Tooltip formatter={(value) => `$${value}`} />
              <Area type="monotone" dataKey="Revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Balanced Grid: Low Stock Warnings (Watchdog) & Recent Clinical Feed side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Warehouse Watchdog low stock tracker panel */}
        <div className="frosted-glass-panel rounded-[32px] p-6 shadow-sm flex flex-col justify-between" id="dashboard-warehouse-watchdog-panel">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package size={18} className="text-rose-500" />
                <span>Warehouse Watchdog</span>
              </h3>
              <button
                onClick={triggerBackgroundCheck}
                disabled={isCheckRunning}
                className="p-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 active:scale-95"
              >
                <RefreshCw size={11} className={isCheckRunning ? "animate-spin text-blue-600" : "text-slate-450"} />
                <span>{isCheckRunning ? "Scrutinizing..." : "Verify Stock Limit"}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4 font-medium">
              Background tracking safety limits. Scanned logs: <strong className="font-semibold text-slate-600 font-mono text-[11px]">{lastCheckTime || "Evaluating..."}</strong>
            </p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px] pr-1 custom-scrollbar">
            {criticalItems.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center space-y-2 h-full min-h-[180px]">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full">
                  <CheckCircle2 size={24} />
                </div>
                <p className="font-bold text-xs text-slate-700">All Supplies Secured</p>
                <p className="text-[10px] text-slate-400 max-w-xs px-4">
                  No active shortages. System confirms all medical packaging resins, anesthetizing vials, complex crowns are fully stocked on primary clinic shelves.
                </p>
              </div>
            ) : (
              criticalItems.map((item) => {
                const isOutOfStock = item.quantity === 0;
                const percent = Math.min((item.quantity / Math.max(1, item.minQty * 1.5)) * 100, 100);
                const replenishmentQty = 25;
                
                return (
                  <div 
                    key={item.id} 
                    className="p-3.5 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between gap-3 shadow-xs hover:border-rose-250 transition-all group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[8.5px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          isOutOfStock ? "bg-rose-600 text-white animate-pulse" : "bg-amber-100 text-amber-805 text-amber-800"
                        }`}>
                          {isOutOfStock ? "Critical Empty" : "Low Supply Limit"}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">ID: {item.id}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800 pt-0.5">{item.name}</h4>
                      
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-extrabold">
                          <span>Quantity: <strong className={isOutOfStock ? "text-rose-600" : "text-amber-600"}>{item.quantity} {item.unit}</strong></span>
                          <span>Safety limit: {item.minQty} {item.unit}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${isOutOfStock ? "w-0" : "bg-gradient-to-r from-rose-500 to-amber-500"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        onClick={() => {
                          updateInventoryItem(item.id, { quantity: item.quantity + replenishmentQty });
                          setSuccessToastMessage(`Replenished "${item.name}" by +${replenishmentQty} ${item.unit}. Sound level restored!`);
                          triggerBackgroundCheck();
                          setTimeout(() => setSuccessToastMessage(null), 4000);
                        }}
                        type="button"
                        className="flex-1 py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black cursor-pointer transition-all flex items-center justify-center gap-1 active:scale-95 border border-transparent shadow-xs"
                      >
                        <Package size={11} className="shrink-0" />
                        <span>Restock (+25)</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setSessionMutedItemIds(prev => [...prev, item.id]);
                        }}
                        type="button"
                        className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-[9px] font-extrabold text-slate-600 cursor-pointer transition-all active:scale-95"
                        title="Snooze warning for this browser session"
                      >
                        <span>Snooze</span>
                      </button>

                      <button
                        onClick={() => {
                          onSwitchTab("inventory");
                        }}
                        type="button"
                        className="p-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[9px] font-bold border border-blue-200/50 cursor-pointer transition-all active:scale-95"
                      >
                        <span>Manage</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-[10px] text-slate-400 leading-snug pt-3 border-t border-white/60 mt-3 font-medium">
            Warehouse health threshold warnings trigger notifications in real-time.
          </div>
        </div>

        {/* Recent Clinical Activity Widget */}
        <div className="frosted-glass-panel rounded-[32px] p-6 shadow-sm flex flex-col justify-between" id="recent-activity-card">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-blue-500 animate-pulse" />
                <span>Recent Activity</span>
              </h3>
              <PremiumSelect
                id="activity-type-filter"
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value as any)}
                className="bg-white border border-slate-200 hover:border-slate-350 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-105 transition-all cursor-pointer shadow-sm"
              >
                <option value="all">All</option>
                <option value="Filling">Filling</option>
                <option value="Extraction">Extraction</option>
                <option value="Prosthetic">Prosthetic</option>
              </PremiumSelect>
            </div>
            <p className="text-xs text-slate-400 mb-4 font-medium">
              Latest {activityFilter === "all" ? "5" : ""} completed {activityFilter !== "all" ? activityFilter.toLowerCase() : ""} interventions
            </p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px] pr-1 custom-scrollbar">
            {recentActivities.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Activity className="mx-auto text-slate-300 mb-2" size={24} />
                <p className="font-semibold text-xs text-slate-500">No completed clinical procedures yet.</p>
              </div>
            ) : (
              recentActivities.map((act, index) => {
                let borderAccent = "border-l-blue-500";
                let bgClass = "bg-blue-50/20";
                let badgeColor = "bg-blue-50 text-blue-700 border-blue-100";
                
                if (act.type === "Filling") {
                  borderAccent = "border-l-indigo-500";
                  bgClass = "bg-indigo-50/20";
                  badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-100";
                } else if (act.type === "Extraction") {
                  borderAccent = "border-l-rose-500";
                  bgClass = "bg-rose-50/20";
                  badgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                } else if (act.type === "Prosthetic") {
                  borderAccent = "border-l-amber-500";
                  bgClass = "bg-amber-50/20";
                  badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                }

                return (
                  <div 
                    key={index} 
                    className={`p-3.5 ${bgClass} border border-slate-200/80 border-l-4 ${borderAccent} hover:border-slate-350 hover:bg-white rounded-2xl transition-all shadow-sm hover:shadow flex flex-col gap-1.5`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => onSelectPatient(act.patientId)}
                        className="font-extrabold text-slate-800 text-xs hover:text-blue-600 hover:underline transition-all text-left cursor-pointer truncate max-w-[120px]"
                        title={act.patientName}
                      >
                        {act.patientName}
                      </button>
                      <span className="text-[9px] text-slate-400 font-bold font-mono bg-white border border-slate-150 px-2 py-0.5 rounded-md shrink-0">
                        {act.date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-bold text-slate-700 font-sans truncate">
                        {act.procedureType}
                      </div>
                      <span className={`text-[8px] font-extrabold uppercase tracking-widest border px-1.5 py-0.2 rounded-md shrink-0 ${badgeColor}`}>
                        {act.type}
                      </span>
                    </div>
                    {act.notes && (
                      <p className="text-[10px] text-slate-500 italic font-semibold line-clamp-1 bg-white/50 px-2 py-0.5 rounded border border-slate-100">
                        "{act.notes}"
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="text-[10px] text-slate-400 leading-snug pt-3 border-t border-white/60 mt-3 font-medium">
            Procedure logs are populated live upon operational completion.
          </div>
        </div>
      </div>
    </div>
  );
}
