import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useStore } from "../store";
import { ZendentaLogo } from "./ZendentaLogo";
import ProviderBreakdownTable from "./ProviderBreakdownTable";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  Activity, 
  ArrowUpRight, 
  Award,
  TrendingDown,
  ChevronRight,
  Sparkles,
  Percent,
  CalendarCheck,
  Printer,
  X
} from "lucide-react";

function CountUp({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) {
  const [count, setCount] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let frameId: number;
    const duration = 400; // Snappier duration
    const startVal = 0;
    const diff = value - startVal;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(startVal + easeProgress * diff);
      
      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };
    
    frameId = window.requestAnimationFrame(step);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [value]);

  if (isCurrency) {
    return <span>${count.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
  }
  return <span>{Math.round(count).toLocaleString("en-US")}</span>;
}

export default function Performance() {
  const { users, appointments, financialRecords, patients } = useStore();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Flexible timeframe states (Today, Last 7 Days, This Month, All Time, Custom Range)
  const [perfTimeFilter, setPerfTimeFilter] = useState<"today" | "last_7_days" | "this_month" | "all" | "custom_range">("custom_range");
  const [customPeriodStart, setCustomPeriodStart] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customPeriodEnd, setCustomPeriodEnd] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  });

  // Keep internal input states so we only trigger immediate calculations once both dates are selected
  const [startDateInput, setStartDateInput] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDateInput, setEndDateInput] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    setStartDateInput(customPeriodStart);
  }, [customPeriodStart]);

  useEffect(() => {
    setEndDateInput(customPeriodEnd);
  }, [customPeriodEnd]);

  const TODAY_STR = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  
  const CURRENT_MONTH_STR = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const handleQuickSelect = useCallback((range: "this_month" | "last_30_days" | "ytd" | "last_quarter") => {
    const today = new Date();
    const format = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    if (range === "this_month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setCustomPeriodStart(format(start));
      setCustomPeriodEnd(format(end));
      setPerfTimeFilter("this_month");
    } else if (range === "last_30_days") {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 29);
      setCustomPeriodStart(format(past30));
      setCustomPeriodEnd(format(today));
      setPerfTimeFilter("custom_range");
    } else if (range === "ytd") {
      const start = new Date(today.getFullYear(), 0, 1);
      setCustomPeriodStart(format(start));
      setCustomPeriodEnd(format(today));
      setPerfTimeFilter("custom_range");
    } else if (range === "last_quarter") {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const startMonth = currentQuarter * 3 - 3;
      const start = new Date(today.getFullYear(), startMonth, 1);
      const end = new Date(today.getFullYear(), startMonth + 3, 0);
      setCustomPeriodStart(format(start));
      setCustomPeriodEnd(format(end));
      setPerfTimeFilter("custom_range");
    }
  }, []);

  // Compute start/end dates for calculations - driven dynamically by custom range inputs
  const getFilterDates = useMemo(() => {
    return { start: customPeriodStart, end: customPeriodEnd };
  }, [customPeriodStart, customPeriodEnd]);

  // Filter appointments and financial records according to the active timeframe
  const filteredAppointments = useMemo(() => {
    const dates = getFilterDates;
    const activeAppts = appointments.filter(a => a.date >= dates.start && a.date <= dates.end);
    
    // Also include completed sessions from patients
    const sessionAppts: any[] = [];
    patients.forEach(p => {
      if (p.sessions) {
        p.sessions.forEach(s => {
          if (s.date >= dates.start && s.date <= dates.end) {
            sessionAppts.push({
              id: s.id,
              patientId: p.id,
              patientName: p.name,
              doctorName: s.doctorName,
              date: s.date,
              time: s.time,
              procedureType: s.procedureType,
              status: "Completed",
              notes: s.notes
            });
          }
        });
      }
    });

    return [...activeAppts, ...sessionAppts];
  }, [appointments, patients, getFilterDates]);

  const filteredFinancials = useMemo(() => {
    const dates = getFilterDates;
    return financialRecords.filter(rec => rec.date >= dates.start && rec.date <= dates.end);
  }, [financialRecords, getFilterDates]);

  // Readable descriptor label of range filter
  const getFilterLabel = useCallback(() => {
    return `${customPeriodStart} to ${customPeriodEnd}`;
  }, [customPeriodStart, customPeriodEnd]);

  // Identify practice providers (Practitioners, admins, or staff with clinical appointments)
  const doctors = useMemo(() => {
    // Get unique doctor names from appointments AND historical sessions to capture all active practitioners
    const apptDocNames = new Set(appointments.map(a => a.doctorName));
    
    patients.forEach(p => {
      if (p.sessions) {
        p.sessions.forEach(s => apptDocNames.add(s.doctorName));
      }
    });

    return users.filter(u => 
      u.isActive && 
      (u.role === "clinician" || u.role === "admin" || apptDocNames.has(u.name))
    );
  }, [users, appointments, patients]);

  // If no doctor selected yet, default to the first one available
  const activeDocId = selectedDoctorId || doctors[0]?.id || "";
  const activeDoc = useMemo(() => {
    return doctors.find(d => d.id === activeDocId);
  }, [doctors, activeDocId]);

  // Precompute associated doctor names by patientId
  const patientToDocsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    filteredAppointments.forEach(appt => {
      let set = map.get(appt.patientId);
      if (!set) {
        set = new Set();
        map.set(appt.patientId, set);
      }
      set.add(appt.doctorName);
    });
    return map;
  }, [filteredAppointments]);

  // Precompute patient database index for fast lookup
  const patientByIdMap = useMemo(() => {
    const map = new Map<string, typeof patients[0]>();
    patients.forEach(p => {
      map.set(p.id, p);
    });
    return map;
  }, [patients]);

  // Pre-filter expenses to Supplies Consumption category
  const filteredSuppliesExpenses = useMemo(() => {
    return filteredFinancials.filter(rec => 
      rec.type === "expense" && 
      rec.expenseCategory === "Supplies Consumption"
    );
  }, [filteredFinancials]);

  // Precompute appointments by doctor name for O(1) procedural status checks
  const appointmentsByDoctorMap = useMemo(() => {
    const map = new Map<string, typeof appointments>();
    doctors.forEach(doc => {
      map.set(doc.name, []);
    });

    const normalizeName = (n: string) => n.toLowerCase().replace(/^dr\.?\s+/i, "").trim();

    filteredAppointments.forEach(appt => {
      const apptDocNameNorm = normalizeName(appt.doctorName);
      
      // Find matching doctor by normalized name
      const matchingDoc = doctors.find(d => normalizeName(d.name) === apptDocNameNorm);
      
      if (matchingDoc) {
        const list = map.get(matchingDoc.name);
        if (list) {
          list.push(appt);
        }
      }
    });
    return map;
  }, [doctors, filteredAppointments]);

  // Precompute gross income by doctor name to avoid nested F * D loops
  const incomeByDoctorMap = useMemo(() => {
    const map = new Map<string, number>();
    doctors.forEach(doc => {
      map.set(doc.name, 0);
    });

    const normalizeName = (n: string) => n.toLowerCase().replace(/^dr\.?\s+/i, "").trim();

    filteredFinancials.forEach(rec => {
      if (rec.type === "expense") return;
      
      // PRIORITY 1: Use explicit doctorId if stored in the record
      if (rec.doctorId) {
        const doc = doctors.find(d => d.id === rec.doctorId);
        if (doc) {
          const cur = map.get(doc.name) || 0;
          map.set(doc.name, cur + rec.paidAmount);
          return;
        }
      }

      // PRIORITY 2: Fallback to appointment-based share (for legacy or patient-level payments)
      const setOfDocs = patientToDocsMap.get(rec.patientId);
      if (setOfDocs && setOfDocs.size > 0) {
        const uniqueDocsCount = setOfDocs.size;
        const share = rec.paidAmount / uniqueDocsCount;
        setOfDocs.forEach(docName => {
          const docNameNorm = normalizeName(docName);
          const matchingDoc = doctors.find(d => normalizeName(d.name) === docNameNorm);
          
          if (matchingDoc) {
            const cur = map.get(matchingDoc.name) || 0;
            map.set(matchingDoc.name, cur + share);
          }
        });
      }
    });
    return map;
  }, [doctors, filteredFinancials, patientToDocsMap]);

  // Precompute consumption/material expenses by doctor name
  const consumptionsByDoctorMap = useMemo(() => {
    const map = new Map<string, typeof filteredSuppliesExpenses>();
    doctors.forEach(doc => {
      map.set(doc.name, []);
    });

    const normalizeName = (n: string) => n.toLowerCase().replace(/^dr\.?\s+/i, "").trim();

    filteredSuppliesExpenses.forEach(rec => {
      doctors.forEach(doc => {
        const docNorm = normalizeName(doc.name);
        if (rec.procedureName.toLowerCase().includes(`by ${docNorm}`) || 
            rec.procedureName.toLowerCase().includes(docNorm) ||
            (rec.notes && rec.notes.toLowerCase().includes(docNorm))) {
          map.get(doc.name)?.push(rec);
        }
      });
    });
    return map;
  }, [doctors, filteredSuppliesExpenses]);

  // Compute Performance Analytics for all doctors
  const doctorStats = useMemo(() => {
    return doctors.map(doc => {
      // 1. Treated Patients (Unique Patients who had appointments with this doctor)
      const docAppts = appointmentsByDoctorMap.get(doc.name) || [];
      const uniquePatientIds = Array.from(new Set(docAppts.map(a => a.patientId)));
      const treatedCount = uniquePatientIds.length;

      // 2. Income Generated (From precomputed map)
      const income = incomeByDoctorMap.get(doc.name) || 0;

      // 3. Expenses (Material / Stock Consumption from precomputed map)
      const consumptions = consumptionsByDoctorMap.get(doc.name) || [];
      const stockExpense = consumptions.reduce((sum, c) => sum + c.totalCost, 0);

      // Net margin
      const netProfit = income - stockExpense;
      const marginRate = income > 0 ? ((netProfit / income) * 100) : 0;

      return {
        id: doc.id,
        name: doc.name,
        role: doc.role,
        email: doc.email || "N/A",
        phone: doc.phone || "N/A",
        treatedCount,
        income,
        stockExpense,
        netProfit,
        marginRate,
        appointmentsCount: docAppts.length,
        consumptions,
        completedCount: docAppts.filter(a => a.status === "Completed" || a.status === "Done").length,
        uniquePatients: uniquePatientIds.map(pid => patientByIdMap.get(pid)).filter(Boolean) as typeof patients
      };
    });
  }, [doctors, appointmentsByDoctorMap, incomeByDoctorMap, consumptionsByDoctorMap, patientByIdMap]);

  const activeStats = useMemo(() => {
    return doctorStats.find(ds => ds.id === activeDocId);
  }, [doctorStats, activeDocId]);

  // Global aggregate metrics for headers
  const totalPracticeIncome = useMemo(() => {
    return doctorStats.reduce((sum, d) => sum + d.income, 0);
  }, [doctorStats]);

  const totalPracticeExpenses = useMemo(() => {
    return doctorStats.reduce((sum, d) => sum + d.stockExpense, 0);
  }, [doctorStats]);

  const totalPracticeAppointments = useMemo(() => {
    return doctorStats.reduce((sum, d) => sum + d.appointmentsCount, 0);
  }, [doctorStats]);

  // Memoized action triggers
  const handleSelectDoctorId = useCallback((id: string) => {
    setSelectedDoctorId(id);
  }, []);

  const handleAuditOperator = useCallback((id: string) => {
    setSelectedDoctorId(id);
    const element = document.getElementById("practice-doctor-report-card") || document.getElementById("performance-module-viewport");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDateInput(val);
    if (val && endDateInput) {
      setCustomPeriodStart(val);
      setCustomPeriodEnd(endDateInput);
      setPerfTimeFilter("custom_range");
    }
  }, [endDateInput]);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEndDateInput(val);
    if (startDateInput && val) {
      setCustomPeriodStart(startDateInput);
      setCustomPeriodEnd(val);
      setPerfTimeFilter("custom_range");
    }
  }, [startDateInput]);

  return (
    <>
      <div className="space-y-6 animate-fade-in print:hidden" id="performance-module-viewport">
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-600/10 border border-emerald-200/50 px-3 py-1 rounded-full">Clinical Analytics</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">PRACTITIONER PERFORMANCE</h2>
          <p className="text-slate-500 text-xs font-medium">Track doctor treatment outcomes, proportional income allocations, and automatic stock expense logging.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3" id="performance-header-controls">
          {/* Quick-Select Date Range Buttons */}
          <div className="flex flex-wrap bg-slate-50 border border-slate-200/55 p-1.5 rounded-2xl gap-1">
            {[
              { id: "this_month", label: "This Month" },
              { id: "last_30_days", label: "Last 30 Days" },
              { id: "ytd", label: "Year to Date" },
              { id: "last_quarter", label: "Last Quarter" }
            ].map((qs) => {
              let isActive = false;
              const today = new Date();
              const format = (d: Date) => {
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              };
              const todayStr = format(today);

              if (qs.id === "this_month") {
                const start = format(new Date(today.getFullYear(), today.getMonth(), 1));
                const end = format(new Date(today.getFullYear(), today.getMonth() + 1, 0));
                isActive = customPeriodStart === start && customPeriodEnd === end;
              } else if (qs.id === "last_30_days") {
                const past30 = new Date(today);
                past30.setDate(today.getDate() - 29);
                isActive = customPeriodStart === format(past30) && customPeriodEnd === todayStr;
              } else if (qs.id === "ytd") {
                const start = format(new Date(today.getFullYear(), 0, 1));
                isActive = customPeriodStart === start && customPeriodEnd === todayStr;
              } else if (qs.id === "last_quarter") {
                const currentQuarter = Math.floor(today.getMonth() / 3);
                const startMonth = currentQuarter * 3 - 3;
                const start = format(new Date(today.getFullYear(), startMonth, 1));
                const end = format(new Date(today.getFullYear(), startMonth + 3, 0));
                isActive = customPeriodStart === start && customPeriodEnd === end;
              }

              return (
                <button
                  key={qs.id}
                  type="button"
                  onClick={() => handleQuickSelect(qs.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-805 bg-white border border-slate-200/60 hover:bg-slate-50"
                  }`}
                >
                  {qs.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Picker Widget */}
          <div className="flex items-center gap-2 bg-white border border-slate-200/60 p-2.5 rounded-2xl shadow-sm" id="performance-range-filter-card">
            <div className="flex items-center gap-1.5 px-2 border-r border-slate-100 shrink-0">
              <CalendarCheck className="text-blue-500 shrink-0" size={13} />
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Range Filter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                id="performance-header-date-picker-start"
                type="date"
                value={startDateInput}
                onChange={handleStartDateChange}
                className="text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-101 border border-slate-200 rounded-xl px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                title="Start Date"
              />
              <span className="text-slate-300 text-[10px] font-bold">to</span>
              <input
                id="performance-header-date-picker-end"
                type="date"
                value={endDateInput}
                onChange={handleEndDateChange}
                className="text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-101 border border-slate-200 rounded-xl px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                title="End Date"
              />
            </div>
          </div>

          {/* Practice Performance Ticker Cards */}
          <div className="flex gap-3 bg-white border border-slate-200/60 p-2.5 rounded-2xl shadow-sm" id="performance-ticker-cards">
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="px-3 py-1 text-center border-r border-slate-100"
              id="performance-ticker-revenue"
            >
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Total Share Revenue</span>
              <div className="text-xs font-extrabold text-emerald-600">${totalPracticeIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="px-3 py-1 text-center"
              id="performance-ticker-expenses"
            >
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Stock Consumed Value</span>
              <div className="text-xs font-extrabold text-rose-500">${totalPracticeExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Timeframe selector bar */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-[28px] shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Timeframe Filter:</span>
          <div className="flex flex-wrap bg-slate-50 p-1 rounded-2xl border border-slate-200 gap-1">
            {[
              { id: "today", label: "Today" },
              { id: "last_7_days", label: "Last 7 Days" },
              { id: "this_month", label: "This Month" },
              { id: "all", label: "All Time" },
              { id: "custom_range", label: "Custom Range" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "today") {
                    setCustomPeriodStart(TODAY_STR);
                    setCustomPeriodEnd(TODAY_STR);
                    setPerfTimeFilter("today");
                  } else if (tab.id === "last_7_days") {
                    const today = new Date(TODAY_STR + "T00:00:00");
                    const pastIdx = new Date(today);
                    pastIdx.setDate(today.getDate() - 6);
                    const format = (d: Date) => d.toISOString().split("T")[0];
                    setCustomPeriodStart(format(pastIdx));
                    setCustomPeriodEnd(TODAY_STR);
                    setPerfTimeFilter("last_7_days");
                  } else if (tab.id === "this_month") {
                    setCustomPeriodStart(`${CURRENT_MONTH_STR}-01`);
                    setCustomPeriodEnd(`${CURRENT_MONTH_STR}-31`);
                    setPerfTimeFilter("this_month");
                  } else if (tab.id === "all") {
                    setCustomPeriodStart(`${new Date().getFullYear()}-01-01`);
                    setCustomPeriodEnd(`${new Date().getFullYear()}-12-31`);
                    setPerfTimeFilter("all");
                  } else if (tab.id === "custom_range") {
                    setPerfTimeFilter("custom_range");
                  }
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  perfTimeFilter === tab.id ||
                  (tab.id === "custom_range" && perfTimeFilter === "custom_range")
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Custom Selection Inputs info or additional actions */}
        <div className="flex items-center gap-3 w-full lg:w-auto self-stretch lg:self-auto justify-start lg:justify-end">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 border border-slate-200/65 px-4 py-2 rounded-xl w-full sm:w-auto shadow-inner text-[11px] font-bold text-slate-500">
            <span>Filtering Date Range: </span>
            <span className="text-blue-600 font-extrabold">{customPeriodStart} to {customPeriodEnd}</span>
          </div>
        </div>
      </div>

      {/* Practice Administrative Executive Summary Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-200/80 space-y-4"
        id="administrative-summary-section"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-650" />
              <span>Administrative Executive Review: Provider Breakdown</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Live practice breakdown of total revenue, procedure execution counts, and calculated net margin yields by clinician.
            </p>
          </div>
          <span className="text-[9.5px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full shrink-0">
            {doctorStats.length} Registered Providers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctorStats.map((ds) => {
            const isSelected = ds.id === activeDocId;
            return (
              <div 
                key={`admin-summary-${ds.id}`}
                onClick={() => handleAuditOperator(ds.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] hover:shadow-md ${
                  isSelected 
                    ? "bg-slate-50/80 border-indigo-500 ring-2 ring-indigo-500/10" 
                    : "bg-white border-slate-200/60 hover:border-slate-300"
                }`}
              >
                {/* Provider Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                     <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-705 text-xs shrink-0 select-none">
                       {ds.name.replace("Dr. ", "").charAt(0)}
                     </div>
                     <div className="min-w-0">
                       <strong className="text-xs text-slate-805 font-bold block truncate">{ds.name}</strong>
                       <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider truncate">
                         {ds.role === "admin" ? "Chief Practitioner" : "Associate"}
                       </span>
                     </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                    ds.marginRate >= 75 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : ds.marginRate >= 50 
                      ? "bg-blue-50 text-blue-700 border-blue-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {ds.marginRate.toFixed(1)}% Yield
                  </span>
                </div>

                {/* Performance Metrics Rows */}
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100/60 pt-3 text-center">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">Total Revenue</span>
                    <strong className="text-[11.5px] font-black text-emerald-600 block mt-0.5">
                      ${ds.income.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </strong>
                  </div>
                  <div className="border-x border-slate-100">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">Procedures</span>
                    <strong className="text-[11.5px] font-black text-slate-700 block mt-0.5">
                      {ds.appointmentsCount} Appts
                    </strong>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">Net Profit</span>
                    <strong className="text-[11.5px] font-black text-indigo-700 block mt-0.5">
                      ${ds.netProfit.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </strong>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 pt-2 font-medium">
                  <span>Completed: {ds.completedCount} / {ds.appointmentsCount}</span>
                  <span className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5">
                    Analyze report &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Grid Layout: Providers list & Core Report Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Providers Selector Row/Card */}
        <div className="lg:col-span-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-200/60 space-y-4"
          >
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Clinical Operators</h3>
              <p className="text-[10px] text-slate-400">Select doctor to decrypt treatment and material balances.</p>
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {doctorStats.map((ds) => {
                const isSelected = ds.id === activeDocId;
                return (
                  <button
                    key={ds.id}
                    onClick={() => handleSelectDoctorId(ds.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected 
                        ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-100 text-white"
                        : "bg-white border-slate-200/60 text-slate-800 hover:bg-slate-50 hover:shadow-sm"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className={`text-xs block truncate ${isSelected ? "text-white" : "text-slate-800"}`}>{ds.name}</strong>
                        {ds.netProfit > 1200 && (
                          <Sparkles size={11} className={isSelected ? "text-amber-300" : "text-amber-500"} />
                        )}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block mt-0.5 ${isSelected ? "text-blue-200" : "text-blue-500"}`}>
                        {ds.role === "admin" ? "Chief Practitioner / Admin" : "Associate Practitioner"}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-[11px] font-black block ${isSelected ? "text-white" : "text-slate-800"}`}>
                        ${ds.income.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </span>
                      <span className={`text-[8.5px] block font-semibold ${isSelected ? "text-blue-250" : "text-slate-400"}`}>
                        {ds.treatedCount} Patients
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
          
          {/* Quick Informational Box */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/60 rounded-[28px] p-5 space-y-2.5 shadow-sm"
          >
            <h4 className="text-[11px] font-bold uppercase text-blue-800 tracking-wider flex items-center gap-1.5">
              <Award size={13} className="text-blue-600" />
              <span>Multi-Care Attribution Logic</span>
            </h4>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              When patients consult multiple practitioners, clinical earnings are split proportionally. Any items marked "Used" in the <strong>Inventory Suite</strong> trigger immediate unit-price expenses logged on behalf of the utilizing operator.
            </p>
          </motion.div>
        </div>

        {/* Right Side: Doctor Financial Report Card */}
        <div className="lg:col-span-8 space-y-6">
          {activeStats ? (
            <div className="space-y-6" id="practice-doctor-report-card">
              
              {/* Profile Card Summary & Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200/60 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/40 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-black tracking-widest text-blue-600 uppercase block">Provider Dossier</span>
                    <h3 className="text-lg font-black text-slate-850 mt-0.5">{activeStats.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[10px] font-bold uppercase mt-1">
                      <span>{activeStats.email}</span>
                      <span>•</span>
                      <span>{activeStats.phone}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="h-fit py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10.5px] font-extrabold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                      id="generate-practitioner-pdf-btn"
                    >
                      <Printer size={13} />
                      <span>Print PDF Report</span>
                    </button>
                    <div className="h-fit py-1.5 px-3 bg-slate-50 rounded-xl border border-slate-200/50 text-[10.5px] font-black text-slate-600 flex items-center gap-1.5 shadow-sm">
                      <CalendarCheck size={12} className="text-slate-500" />
                      <span>Logged Schedule: {activeStats.appointmentsCount} Appts</span>
                    </div>
                  </div>
                </div>

                {/* Primary Stats Grid */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100"
                >
                  <motion.div
                    key={`${activeStats.id}-treated-${customPeriodStart}-${customPeriodEnd}`}
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-slate-50/75 p-3.5 border border-slate-200/50 rounded-2xl flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-1 text-slate-400">
                      <Users size={12} />
                      <span className="text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Patients Treated</span>
                    </div>
                    <div className="text-lg font-black text-slate-800 tracking-tight mt-1.5">
                      <CountUp value={activeStats.treatedCount} />
                    </div>
                    <span className="text-[8.5px] text-slate-400 block mt-1">Unique patients cared for</span>
                  </motion.div>

                  <motion.div
                    key={`${activeStats.id}-income-${customPeriodStart}-${customPeriodEnd}`}
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-emerald-50/30 p-3.5 border border-emerald-100 rounded-2xl flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-1 text-emerald-700">
                      <DollarSign size={12} />
                      <span className="text-[9.5px] font-bold uppercase text-emerald-700 tracking-wider">Gross Income</span>
                    </div>
                    <div className="text-lg font-black text-emerald-700 tracking-tight mt-1.5">
                      <CountUp value={activeStats.income} isCurrency={true} />
                    </div>
                    <span className="text-[8.5px] text-emerald-700/60 block mt-1">Attributed practice share</span>
                  </motion.div>

                  <motion.div
                    key={`${activeStats.id}-stock-${customPeriodStart}-${customPeriodEnd}`}
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-rose-50/20 p-3.5 border border-rose-100 rounded-2xl flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-1 text-rose-700">
                      <Package size={12} />
                      <span className="text-[9.5px] font-bold uppercase text-rose-700 tracking-wider">Stock Usage cost</span>
                    </div>
                    <div className="text-lg font-black text-rose-600 tracking-tight mt-1.5">
                      <CountUp value={activeStats.stockExpense} isCurrency={true} />
                    </div>
                    <span className="text-[8.5px] text-rose-500 block mt-1">Values of assets consumed</span>
                  </motion.div>

                  <motion.div
                    key={`${activeStats.id}-profit-${customPeriodStart}-${customPeriodEnd}`}
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-indigo-50/30 p-3.5 border border-indigo-100 rounded-2xl flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-1 text-indigo-700">
                      <TrendingUp size={12} />
                      <span className="text-[9.5px] font-bold uppercase text-indigo-700 tracking-wider">Practice Profit</span>
                    </div>
                    <div className="text-lg font-black text-indigo-700 tracking-tight mt-1.5">
                      <CountUp value={activeStats.netProfit} isCurrency={true} />
                    </div>
                    <span className="text-[8.5px] text-indigo-700/60 block mt-1">Net provider accounting yield</span>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Grid: Treated Patients Table and Supply Ledger usage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Treated Patients List Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-[28px] p-5 border border-slate-200/60 shadow-sm flex flex-col space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Treated Patients Cared For</h4>
                      <p className="text-[9px] text-slate-400">Active clinic registries matching treatment loops.</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 overflow-y-auto max-h-[300px] pr-1 space-y-2.5 flex-1 custom-scrollbar">
                    {activeStats.uniquePatients.map((pat: any, idx: number) => (
                      <motion.div
                        key={`${activeStats.id}-pat-${pat.id || idx}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        className="pt-2.5 first:pt-0 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <strong className="text-xs text-slate-800 font-bold block truncate">{pat.name}</strong>
                          <span className="text-[9px] text-slate-400 font-medium">DOB: {pat.dob} • Risk: {pat.riskLevel || "Low"}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 py-0.5 px-2 rounded-lg">
                          Active file
                        </span>
                      </motion.div>
                    ))}
                    {activeStats.uniquePatients.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-xs shadow-none">
                        No patient dental files associated with this doctor yet.
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Supplies / Stock Consumed Expenses breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-[28px] p-5 border border-slate-200/60 shadow-sm flex flex-col space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Supplies Consumption Expenses</h4>
                      <p className="text-[9px] text-slate-400">Materials used during clinical treatments by practitioner.</p>
                    </div>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                      {activeStats.consumptions.length} Uses logged
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 overflow-y-auto max-h-[300px] pr-1 space-y-2.5 flex-1 custom-scrollbar">
                    {activeStats.consumptions.map((exp: any, idx: number) => {
                      // Grab descriptive name of supply from procedureName e.g., "Materials Consumption: 3 Tubes of Composite Resin (A2) (by Dr. Practitioner)"
                      const displayName = exp.procedureName
                        .replace("Materials Consumption: ", "")
                        .split(" (by ")[0];

                      return (
                        <div key={exp.id || idx} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <strong className="text-xs text-slate-800 font-bold block truncate" title={displayName}>{displayName}</strong>
                            <span className="text-[9px] text-slate-400 block font-mono">Date Logged: {exp.date}</span>
                          </div>
                          <span className="text-xs font-black text-rose-500 shrink-0">
                            -${exp.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                    {activeStats.consumptions.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-xs text-slate-400 flex flex-col justify-center items-center">
                        <span className="text-slate-300 mb-1 leading-normal font-medium">No stock consumed yet.</span>
                        <span className="text-[9px] text-slate-400 block max-w-[200px] text-center">To see usage reports, click "Use" button on stock items and assign this doctor!</span>
                      </div>
                    )}
                  </div>
                </motion.div>

              </div>
              
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-12 text-center text-slate-400 font-medium">
              No clinical practitioner stats computed. Make sure staff has registered shifts and treatment logs.
            </div>
          )}
        </div>

      </div>

      {/* PRACTICE-WIDE PROVIDER BREAKDOWNS & COMPARATIVE ANALYSIS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        id="provider-breakdowns-panel"
      >
        <ProviderBreakdownTable
          doctorStats={doctorStats as any}
          totalPracticeIncome={totalPracticeIncome}
          totalPracticeAppointments={totalPracticeAppointments}
          handleAuditOperator={handleAuditOperator}
        />
      </motion.div>
    </div>

    {isReportModalOpen && activeStats && (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsReportModalOpen(false);
          }
        }}
        className="fixed inset-0 bg-slate-900/60 flex items-start justify-center z-[150] p-4 overflow-y-auto cursor-pointer animate-fade-in print:absolute print:inset-0 print:bg-white print:p-0"
        id="printable-report-overlay"
      >
        <div className="bg-white rounded-[32px] p-8 w-full max-w-4xl border border-slate-200 shadow-2xl relative cursor-default space-y-6 my-8 print:m-0 print:p-0 print:border-none print:shadow-none print:w-full">
          
          {/* Modal Controls - hidden on print */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Printer size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Report Print Desk</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Preview the practitioner analytical ledger before physical printing.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-100 transition-all cursor-pointer"
              >
                <Printer size={13} />
                <span>Execute Print / Save PDF</span>
              </button>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                title="Close Preview"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* PRINT CONTAINER WRAPPER */}
          <div className="space-y-6">
            
            {/* Header clinic info */}
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <ZendentaLogo size={50} />
                <div>
                  <h1 className="text-base font-black tracking-tight text-slate-900 font-display">Zendenta Premium Dentistry</h1>
                  <p className="text-[9.5px] text-slate-500 font-semibold block">742 Evergreen Terrace, Dental District, CA</p>
                  <p className="text-[8.5px] text-slate-400 font-semibold block">Tel: +1 555-DENTIST • license #DE-{new Date().getFullYear()}-94B • Secure ERP Certified</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md">Audit Document</span>
                <div className="text-[9px] text-slate-400 font-mono mt-1">Generated: {new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC</div>
              </div>
            </div>

            {/* Title Banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
              <h2 className="text-sm font-black text-slate-850 uppercase tracking-widest font-display">CLINICAL PRACTITIONER PERFORMANCE DIRECTIVE</h2>
              <p className="text-[10px] text-slate-400 font-semibold">Proportional Income Shares • Dynamic Asset Depreciation Metrics</p>
              <div className="text-[9px] text-blue-600 font-extrabold uppercase mt-1">Audit Timeframe: {getFilterLabel()}</div>
            </div>

            {/* Practitioner Bio Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 border border-slate-200/50 p-4 rounded-2xl">
              <div>
                <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider block">Practitioner Name</span>
                <strong className="text-xs font-extrabold text-slate-800 block mt-0.5">{activeStats.name}</strong>
              </div>
              <div>
                <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider block">Security Credentials</span>
                <span className="text-xs font-semibold text-slate-700 block mt-0.5 capitalize">{activeStats.role} Access</span>
              </div>
              <div>
                <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider block">Primary Contact</span>
                <span className="text-xs font-mono text-slate-700 block mt-0.5">{activeStats.phone}</span>
              </div>
              <div>
                <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider block">Appointments Log</span>
                <span className="text-xs font-extrabold text-blue-600 block mt-0.5">{activeStats.appointmentsCount} Registered Sessions</span>
              </div>
            </div>

            {/* Financial Highlight Blocks */}
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-slate-200 p-4 rounded-2xl text-center bg-white shadow-sm">
                <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Gross Treated Income</span>
                <div className="text-base font-black text-emerald-600 mt-1">
                  ${activeStats.income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[8.5px] text-slate-400 block mt-0.5">Attributed proportional patient fees</span>
              </div>
              <div className="border border-slate-200 p-4 rounded-2xl text-center bg-white shadow-sm">
                <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Stock Assets Consumed</span>
                <div className="text-base font-black text-rose-500 mt-1">
                  -${activeStats.stockExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[8.5px] text-slate-400 block mt-0.5">Supplies used during procedures</span>
              </div>
              <div className="border border-indigo-200 p-4 rounded-2xl text-center bg-indigo-50/20 shadow-sm">
                <span className="text-[9px] font-bold uppercase text-indigo-700 block tracking-wider">Calculated Net Margin</span>
                <div className="text-base font-black text-indigo-700 mt-1">
                  ${activeStats.netProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[8.5px] text-indigo-500 block mt-0.5">Yield: {activeStats.marginRate.toFixed(1)}% efficiency rating</span>
              </div>
            </div>

            {/* Treated Patients Detail Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h4 className="text-[10.5px] uppercase font-black text-slate-800 tracking-wider">Active Patient Registry ({activeStats.uniquePatients.length})</h4>
                <span className="text-[8.5px] text-slate-400 font-semibold font-mono">Detailed records matching patient file ids</span>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-x-auto custom-scrollbar bg-white">
                <table className="w-full text-left border-collapse text-[10px] min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-2.5">Patient Name</th>
                      <th className="p-2.5">DOB / Gender</th>
                      <th className="p-2.5">Primary Contact</th>
                      <th className="p-2.5">Risk Profile</th>
                      <th className="p-2.5">Clinical Orthodontic Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeStats.uniquePatients.map((pat: any, i: number) => (
                      <tr key={pat.id || i} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800">{pat.name}</td>
                        <td className="p-2.5 font-semibold text-slate-600">{pat.dob} • <span className="capitalize">{pat.gender}</span></td>
                        <td className="p-2.5 font-mono text-slate-600">{pat.phone}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-center block w-fit border ${
                            pat.riskLevel === "High" 
                              ? "bg-rose-50 text-rose-600 border-rose-100" 
                              : pat.riskLevel === "Moderate"
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }`}>
                            {pat.riskLevel || "Low"}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500 font-medium max-w-xs truncate" title={pat.orthoNotes || "No outstanding clinical notes."}>
                          {pat.orthoNotes || "No outstanding case file notes."}
                        </td>
                      </tr>
                    ))}
                    {activeStats.uniquePatients.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">
                          No patient records registered for treatment under this practitioner yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Material Supplies used by this clinician */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h4 className="text-[10.5px] uppercase font-black text-slate-800 tracking-wider">Materials Consumption Logging ({activeStats.consumptions.length})</h4>
                <span className="text-[8.5px] text-slate-400 font-semibold font-mono">Deducted stock item transactions and dynamic cost audit</span>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-x-auto custom-scrollbar bg-white">
                <table className="w-full text-left border-collapse text-[10px] min-w-[550px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-2.5">Stock Item Descriptive Name</th>
                      <th className="p-2.5">Date Processed</th>
                      <th className="p-2.5">Transaction Remarks</th>
                      <th className="p-2.5 text-right">Attributed Expense</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeStats.consumptions.map((exp: any, i: number) => {
                      const displayName = exp.procedureName
                        .replace("Materials Consumption: ", "")
                        .split(" (by ")[0];

                      return (
                        <tr key={exp.id || i} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-800">{displayName}</td>
                          <td className="p-2.5 font-mono text-slate-600">{exp.date}</td>
                          <td className="p-2.5 text-slate-500 font-medium max-w-sm truncate" title={exp.notes}>
                            {exp.notes || "Auto-logged supply batch consumption expense transaction."}
                          </td>
                          <td className="p-2.5 font-black text-rose-500 text-right">
                            -${exp.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                    {activeStats.consumptions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400 font-medium">
                          No stock or material depletion transactions logged by this practitioner.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Sign-off block (Bottom of PDF) */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-[10px]">
              <div className="space-y-12">
                <div className="border-t-2 border-slate-200 pt-1.5 w-64">
                  <span className="font-extrabold text-slate-700 uppercase block tracking-wider">Operator Endorsement Signature</span>
                  <span className="text-slate-400 block">Verified by: {activeStats.name}</span>
                </div>
              </div>
              <div className="space-y-12 flex flex-col items-end">
                <div className="border-t-2 border-slate-200 pt-1.5 w-64 text-right self-end">
                  <span className="font-extrabold text-slate-700 uppercase block tracking-wider">Chief Medical Audit Director</span>
                  <span className="text-slate-400 block">Date Signed: _______________</span>
                </div>
              </div>
            </div>

            {/* Professional Footer text */}
            <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[8.5px] text-slate-400 font-semibold font-mono">
              <span>ZENDENTA SUITE SECURITIES • DOCUMENT ID: #REP-{activeStats.id.slice(0,8).toUpperCase()}-{new Date().getFullYear()}</span>

              <span>AUTHENTIC ENCRYPTED REPORT INDEX • PAGE 1 OF 1</span>
            </div>

          </div>
        </div>
      </div>
    )}
    </>
  );
}
