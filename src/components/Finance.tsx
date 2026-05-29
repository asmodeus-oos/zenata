import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useStore } from "../store";
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  CheckCircle, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight,
  Receipt, 
  Printer, 
  X,
  FileSpreadsheet,
  AlertCircle,
  Zap,
  Droplet,
  Flame,
  Globe,
  Phone,
  Home,
  FileText,
  User,
  PlusCircle,
  HelpCircle,
  Sliders,
  Sparkles,
  Calendar,
  ShieldAlert
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";

export interface FinanceProps {
  onSwitchTab?: (tab: string) => void;
  onSelectPatient?: (pId: string | null) => void;
}

export default function Finance({ onSwitchTab, onSelectPatient }: FinanceProps) {
  const { financialRecords, patients, addExpense, addPayment, users, appointments } = useStore();

  // Helper to find patient's phone number
  const getPatientPhone = (rec: any) => {
    if (rec.type === "expense") return "—";
    const foundPatient = patients.find(p => p.id === rec.patientId || p.name === rec.patientName);
    return foundPatient ? foundPatient.phone : "N/A";
  };

  // Helper to find treating doctor or staff member
  const getAssociatedDoctorOrStaff = (rec: any) => {
    if (rec.type === "expense") {
      if (rec.procedureName.includes("Materials Consumption:") || rec.procedureName.includes("Consumption")) {
        const match = rec.procedureName.match(/\(by ([^\)]+)\)/);
        if (match && match[1]) return match[1];
      }
      if (rec.procedureName.includes("Payroll Salary -")) {
        return rec.procedureName.replace("Payroll Salary - ", "").split(" (")[0];
      }
      if (rec.doctorId) {
        const found = users.find(u => u.id === rec.doctorId);
        if (found) return found.name;
      }
      return "Clinic Admin";
    }

    const patientAppts = appointments.filter(a => a.patientId === rec.patientId);
    const dateMatch = patientAppts.find(a => a.date === rec.date);
    if (dateMatch) return dateMatch.doctorName;
    if (patientAppts.length > 0) return patientAppts[0].doctorName;
    return "Dr. Clara Mendes";
  };

  // Format helper for calendar strings
  const formatPeriodLabel = (val: string) => {
    if (!val) return "N/A";
    if (val.length === 7) { // YYYY-MM
      const [year, month] = val.split("-");
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const mIdx = parseInt(month, 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        return `${months[mIdx]} ${year}`;
      }
    }
    return val; // e.g. YYYY-MM-DD
  };

  // Dashboard Filters
  const [timeFilter, setTimeFilter] = useState<"Day" | "Month" | "All Time">("Month");
  const [ledgerFilter, setLedgerFilter] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);

  // Awaiting Settlements States
  const [settlementSearch, setSettlementSearch] = useState("");
  const [settlementFilter, setSettlementFilter] = useState<"all" | "high-debt" | "medically-critical">("all");
  const [settlementSort, setSettlementSort] = useState<"debt-desc" | "debt-asc" | "name">("debt-desc");

  // Form states - Pay Staff Salary
  const [selectedStaffId, setSelectedStaffId] = useState<string>(users[0]?.id || "");
  const [payrollType, setPayrollType] = useState<"Monthly" | "Daily">("Monthly");
  const [salaryMonth, setSalaryMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryNote, setSalaryNote] = useState("");

  // Form states - Pay Utility Bill
  const [selectedUtilityType, setSelectedUtilityType] = useState<string>("Electricity");
  const [utilityPeriod, setUtilityPeriod] = useState<"Monthly" | "Daily">("Monthly");
  const [utilityMonth, setUtilityMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [utilityAmount, setUtilityAmount] = useState("");
  const [utilityProvider, setUtilityProvider] = useState("");
  const [utilityNote, setUtilityNote] = useState("");

  // Form states - Extra Costs
  const [selectedExtraCategory, setSelectedExtraCategory] = useState<string>("Maintenance");
  const [customExtraCategory, setCustomExtraCategory] = useState("");
  const [extraPeriod, setExtraPeriod] = useState<"Specific Day" | "Monthly">("Specific Day");
  const [extraDate, setExtraDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [extraAmount, setExtraAmount] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [extraCostScope, setExtraCostScope] = useState<"Clinic" | "Doctor">("Clinic");
  const [extraSelectedDoctorId, setExtraSelectedDoctorId] = useState<string>("");

  // Dynamic Doctors list for attribution selector
  const availableDoctors = useMemo(() => {
    return users.filter(u => 
      u.isActive && 
      (u.role === "doctor" || u.role === "clinician" || u.role2 === "doctor" || u.role2 === "clinician")
    );
  }, [users]);

  // Sync selected doctor ID if list changes or becomes invalid
  React.useEffect(() => {
    if (availableDoctors.length > 0) {
      const isValid = availableDoctors.some(d => d.id === extraSelectedDoctorId);
      if (!isValid) {
        setExtraSelectedDoctorId(availableDoctors[0].id);
      }
    }
  }, [availableDoctors, extraSelectedDoctorId]);

  // Action feedback states (simple notifications)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showStatus = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Base dates matching dataset timeline
  const TODAY_STR = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  
  const CURRENT_MONTH_STR = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Filter records based on Timeline Filter
  const recordsInTimeline = useMemo(() => {
    return financialRecords.filter(r => {
      if (timeFilter === "Day") {
        return r.date === TODAY_STR;
      }
      if (timeFilter === "Month") {
        return r.date.startsWith(CURRENT_MONTH_STR);
      }
      return true; // All Time
    });
  }, [financialRecords, timeFilter]);

  // Income summary calculation
  const totalIncome = useMemo(() => {
    return recordsInTimeline
      .filter(r => r.type !== "expense")
      .reduce((sum, r) => sum + r.paidAmount, 0);
  }, [recordsInTimeline]);

  // Expenses summary calculation
  const totalExpenses = useMemo(() => {
    return recordsInTimeline
      .filter(r => r.type === "expense")
      .reduce((sum, r) => sum + r.totalCost, 0);
  }, [recordsInTimeline]);

  // Record Counts
  const incomeItemsCount = useMemo(() => {
    return recordsInTimeline.filter(r => r.type !== "expense").length;
  }, [recordsInTimeline]);

  const expenseItemsCount = useMemo(() => {
    return recordsInTimeline.filter(r => r.type === "expense").length;
  }, [recordsInTimeline]);

  // Net cash-flow percentage representation
  const netRatioValues = useMemo(() => {
    const sumAll = totalIncome + totalExpenses;
    if (sumAll === 0) return { incomePct: 0, expensePct: 0 };
    return {
      incomePct: Math.round((totalIncome / sumAll) * 100),
      expensePct: Math.round((totalExpenses / sumAll) * 100)
    };
  }, [totalIncome, totalExpenses]);

  // Sorted ledger timeline
  const ledgerTimelineRecords = useMemo(() => {
    return recordsInTimeline
      .filter(r => {
        const query = searchQuery.toLowerCase();
        const matchesQuery = 
          r.patientName.toLowerCase().includes(query) ||
          r.procedureName.toLowerCase().includes(query) ||
          r.receiptNo.toLowerCase().includes(query) ||
          (r.notes && r.notes.toLowerCase().includes(query)) ||
          (r.expenseCategory && r.expenseCategory.toLowerCase().includes(query));
        return matchesQuery;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [recordsInTimeline, searchQuery]);

  // Ledger filter categorization (All / Income / Expense)
  const filteredLedgerRecords = useMemo(() => {
    return ledgerTimelineRecords.filter(rec => {
      if (ledgerFilter === "all") return true;
      if (ledgerFilter === "income") return rec.type !== "expense";
      if (ledgerFilter === "expense") return rec.type === "expense";
      return true;
    });
  }, [ledgerTimelineRecords, ledgerFilter]);

  // Chart data generation supporting Net Pure Revenue
  const chartData = useMemo(() => {
    if (recordsInTimeline.length === 0) {
      // Clean baseline for fresh installations
      return [
        { date: "Baseline", "Balance": 0, revenue: 0, expense: 0 }
      ];
    }

    // Sort chronologically ascending
    const chronoRecords = [...recordsInTimeline].sort((a, b) => a.date.localeCompare(b.date));
    let progressiveSum = 0;
    
    return chronoRecords.map(rec => {
      const isExpense = rec.type === "expense";
      const diff = isExpense ? -rec.totalCost : rec.paidAmount;
      progressiveSum += diff;
      
      const formattedDate = rec.date.substring(5); // Show MM-DD for cleaner presentation
      return {
        date: formattedDate || rec.date,
        "Balance": progressiveSum,
        revenue: isExpense ? 0 : rec.paidAmount,
        expense: isExpense ? rec.totalCost : 0,
        label: rec.procedureName
      };
    });
  }, [recordsInTimeline]);

  // Selected invoice overlay
  const activeReceipt = useMemo(() => {
    return financialRecords.find(r => r.id === activeReceiptId) || null;
  }, [financialRecords, activeReceiptId]);

  // Form Submissions
  const handlePayStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(salaryAmount);
    if (!selectedStaffId) {
      showStatus("Please pick a staff member.", "error");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      showStatus("Please provide a valid salary amount.", "error");
      return;
    }

    const staffObj = users.find(u => u.id === selectedStaffId);
    const staffName = staffObj ? staffObj.name : "Staff Member";
    const staffRole = staffObj ? staffObj.role : "Personnel";

    const resolvedDate = payrollType === "Daily" ? salaryMonth : (salaryMonth.includes("-") ? `${salaryMonth}-01` : TODAY_STR);

    addExpense({
      procedureName: `Payroll Salary - ${staffName} (${staffRole})`,
      totalCost: amountNum,
      date: resolvedDate,
      expenseType: "payroll",
      expenseCategory: `Payroll - ${staffName}`,
      periodType: payrollType === "Monthly" ? "Monthly" : "Daily",
      notes: salaryNote || `Processed salary payment for period of ${formatPeriodLabel(salaryMonth)}`
    });

    setSalaryAmount("");
    setSalaryNote("");
    showStatus(`Salary of $${amountNum} successfully processed for ${staffName}.`);
  };

  const handlePayUtility = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(utilityAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showStatus("Please enter a valid bill amount.", "error");
      return;
    }

    const resolvedDate = utilityPeriod === "Daily" ? utilityMonth : (utilityMonth.includes("-") ? `${utilityMonth}-01` : TODAY_STR);

    addExpense({
      procedureName: `Utility - ${selectedUtilityType} Bill`,
      totalCost: amountNum,
      date: resolvedDate,
      expenseType: "utility",
      expenseCategory: `Utility - ${selectedUtilityType}`,
      periodType: utilityPeriod,
      notes: utilityNote || `Bill payment for ${selectedUtilityType}. Provider: ${utilityProvider || "Standard"}. Period: ${formatPeriodLabel(utilityMonth)}`
    });

    setUtilityAmount("");
    setUtilityProvider("");
    setUtilityNote("");
    showStatus(`Utility Bill of $${amountNum} for ${selectedUtilityType} logged successfully.`);
  };

  const handlePayExtra = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(extraAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showStatus("Please enter a valid expense weight amount.", "error");
      return;
    }

    const categoryText = selectedExtraCategory === "Other" && customExtraCategory.trim()
      ? customExtraCategory.trim()
      : selectedExtraCategory;

    let formattedDate = TODAY_STR;
    if (extraPeriod === "Specific Day") {
      formattedDate = extraDate;
    } else {
      formattedDate = extraDate.includes("-") ? `${extraDate}-01` : TODAY_STR;
    }

    const doctorMatch = extraCostScope === "Doctor" ? availableDoctors.find(u => u.id === extraSelectedDoctorId) : null;
    const attributionNote = doctorMatch ? ` (Attributed to: ${doctorMatch.name})` : "";

    addExpense({
      procedureName: `Extra Cost - ${categoryText}`,
      totalCost: amountNum,
      date: formattedDate,
      expenseType: "extra",
      expenseCategory: `Extra - ${categoryText}`,
      periodType: extraPeriod === "Monthly" ? "Monthly" : "Specific Day",
      notes: (extraNote || `Extra clinic expense categorized under ${categoryText}`) + attributionNote,
      doctorId: extraCostScope === "Doctor" ? extraSelectedDoctorId : undefined
    });

    const attributionLabel = doctorMatch ? `attributed to ${doctorMatch.name}` : "attributed to Whole Clinic";

    setExtraAmount("");
    setCustomExtraCategory("");
    setExtraNote("");
    showStatus(`Extra cost of $${amountNum} (${attributionLabel}) successfully registered.`);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Compute outstanding balances per patient
  const patientsWithOutstandingBalances = useMemo(() => {
    return patients.map(p => {
      const prostOwed = p.prostheticsRecords?.reduce((sum, pr) => sum + (pr.remainingAmount || 0), 0) || 0;
      const finOwed = financialRecords
        .filter(f => f.patientId === p.id && f.remainingAmount > 0)
        .reduce((sum, f) => sum + (f.remainingAmount || 0), 0) || 0;
      
      const totalOwed = Math.max(prostOwed, finOwed);
      
      const patientAppointments = appointments.filter(a => a.patientId === p.id);
      const lastAppt = patientAppointments.length > 0 
        ? [...patientAppointments].sort((a,b) => b.date.localeCompare(a.date))[0]
        : null;
      
      const lastVisitDate = lastAppt ? lastAppt.date : (p.prostheticsRecords?.[0]?.date || p.createdAt.split("T")[0]);
      const lastVisitProc = lastAppt ? lastAppt.procedureType : (p.prostheticsRecords?.[0]?.prostheticType ? `${p.prostheticsRecords[0].prostheticType} Prep` : "Initial Intake");

      const oweDetails = p.prostheticsRecords?.filter(pr => pr.remainingAmount > 0).map(pr => `${pr.prostheticType} (Tooth ${pr.toothNumber})`).join(", ") || "General Treatment Plan";

      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        email: p.email,
        dob: p.dob,
        gender: p.gender,
        allergies: p.allergies,
        riskLevel: p.riskLevel,
        oweDetails,
        totalOwed,
        lastVisitDate,
        lastVisitProc
      };
    }).filter(item => item.totalOwed > 0);
  }, [patients, financialRecords, appointments]);

  // Filtered and sorted outstanding balances for redesigned Awaiting Settlements section
  const filteredSettlements = useMemo(() => {
    let list = [...patientsWithOutstandingBalances];

    // 1. Search Query
    if (settlementSearch.trim()) {
      const q = settlementSearch.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.oweDetails.toLowerCase().includes(q)
      );
    }

    // 2. Segment Filter
    if (settlementFilter === "high-debt") {
      list = list.filter(p => p.totalOwed >= 500);
    } else if (settlementFilter === "medically-critical") {
      list = list.filter(p => p.riskLevel === "High" || (p.allergies && p.allergies !== "None"));
    }

    // 3. Sort
    list.sort((a, b) => {
      if (settlementSort === "debt-desc") {
        return b.totalOwed - a.totalOwed;
      }
      if (settlementSort === "debt-asc") {
        return a.totalOwed - b.totalOwed;
      }
      if (settlementSort === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list;
  }, [patientsWithOutstandingBalances, settlementSearch, settlementFilter, settlementSort]);

  const totalUncollectedOutstanding = useMemo(() => {
    return patientsWithOutstandingBalances.reduce((sum, p) => sum + p.totalOwed, 0);
  }, [patientsWithOutstandingBalances]);

  // Predefined utilities list
  const utilitiesConfig = [
    { label: "Electricity", icon: Zap, color: "text-amber-500 bg-amber-50 border-amber-200" },
    { label: "Water", icon: Droplet, color: "text-blue-500 bg-blue-50 border-blue-200" },
    { label: "Gas", icon: Flame, color: "text-orange-500 bg-orange-50 border-orange-200" },
    { label: "Internet", icon: Globe, color: "text-indigo-500 bg-indigo-50 border-indigo-200" },
    { label: "Phone", icon: Phone, color: "text-emerald-500 bg-emerald-50 border-emerald-200" },
    { label: "Rent", icon: Home, color: "text-purple-500 bg-purple-50 border-purple-200" },
    { label: "Other", icon: FileText, color: "text-slate-500 bg-slate-50 border-slate-200" }
  ];

  // Predefined extra cost tags
  const extraCategories = [
    "Maintenance",
    "Equipment Repair",
    "Marketing",
    "Software / Subscription",
    "Transportation",
    "Training",
    "Office Supplies",
    "Cleaning",
    "Insurance",
    "Other"
  ];

  return (
    <div className="space-y-8 animate-fade-in" id="finance-management-workspace">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Management</h2>
          <p className="text-slate-500 text-xs font-semibold mt-0.5">
            Track income, expense, payroll and utilities by day, month, or all time
          </p>
        </div>

        {/* Success/Error Toasts */}
        {statusMessage && (
          <div className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-bounce ${
            statusMessage.type === "success" 
              ? "bg-emerald-50 border border-emerald-200/80 text-emerald-800" 
              : "bg-rose-50 border border-rose-200/80 text-rose-800"
          }`}>
            <CheckCircle size={16} />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Timeline Filter Switch */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/40">
          {(["Day", "Month", "All Time"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setTimeFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                timeFilter === tab 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Stats & Summary Cards Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Total Income KPI Card */}
        <div className="lg:col-span-4 bg-white border border-slate-250/70 p-6 rounded-[28px] shadow-sm relative overflow-hidden flex flex-col justify-between h-44">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Income</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-100">
              {incomeItemsCount} items
            </span>
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">{formatCurrency(totalIncome)}</h3>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${netRatioValues.incomePct}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold block pt-1.5">{netRatioValues.incomePct}% of total flow</span>
          </div>
          <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 opacity-20 pointer-events-none">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Total Expenses KPI Card */}
        <div className="lg:col-span-4 bg-white border border-slate-250/70 p-6 rounded-[28px] shadow-sm relative overflow-hidden flex flex-col justify-between h-44">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-100">
              {expenseItemsCount} items
            </span>
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">{formatCurrency(totalExpenses)}</h3>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${netRatioValues.expensePct}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold block pt-1.5">{netRatioValues.expensePct}% of total flow</span>
          </div>
          <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 opacity-20 pointer-events-none">
            <TrendingDown size={22} />
          </div>
        </div>

        {/* Pay Staff Salary Fast Launcher Panel */}
        <div className="lg:col-span-4 bg-white border border-slate-250/70 rounded-[28px] p-6 shadow-sm flex flex-col justify-between h-auto row-span-2">
          <div className="space-y-1.5 border-b border-slate-150 pb-3.5 mb-2.5">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-blue-500" />
              <span>Pay Staff</span>
            </h4>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <DollarSign size={16} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">Pay Staff Salary</span>
                <span className="text-[10px] text-slate-400 font-medium block">Manually process a salary payment for any staff member</span>
              </div>
            </div>
          </div>

          <form onSubmit={handlePayStaff} className="space-y-3.5 flex-1 flex flex-col justify-between">
            <div>
              {/* Select Staff Member Grid */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Select Staff Member</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {users.map(u => {
                    const isSelected = selectedStaffId === u.id;
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => setSelectedStaffId(u.id)}
                        className={`text-left p-1.5 border rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-blue-50 border-blue-400 font-extrabold shadow-sm" 
                            : "bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-600"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] uppercase">
                          {u.name.substring(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[10px] font-bold block truncate text-slate-800">{u.name}</span>
                          <span className="text-[8px] text-slate-400 capitalize block leading-none">{u.role}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Payment and Daily Payment toggle */}
              <div className="space-y-1.5 mt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Type</span>
                <div className="flex p-0.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setPayrollType("Monthly");
                      setSalaryMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
                    }}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                      payrollType === "Monthly" 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Monthly Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayrollType("Daily");
                      setSalaryMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`);
                    }}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                      payrollType === "Daily" 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Daily Payment
                  </button>
                </div>
              </div>

              {/* Month/Year and Salary Amount input Row */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <label htmlFor="salaryMonth" className="text-[10px] font-bold text-slate-400 uppercase block">
                    {payrollType === "Monthly" ? "Pay Month" : "Pay Date"}
                  </label>
                  <div className="relative">
                    <input
                      id="salaryMonth"
                      type={payrollType === "Monthly" ? "month" : "date"}
                      value={salaryMonth}
                      onChange={(e) => setSalaryMonth(e.target.value)}
                      className="w-full text-[10px] font-bold p-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="salaryAmount" className="text-[10px] font-bold text-slate-400 uppercase block">Salary Amount</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-400 font-bold">$</span>
                    <input
                      id="salaryAmount"
                      type="number"
                      value={salaryAmount}
                      onChange={(e) => setSalaryAmount(e.target.value)}
                      className="w-full pl-6 pr-2 text-[10px] font-bold p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Note (optional) */}
              <div className="space-y-1 mt-3">
                <label htmlFor="salaryNote" className="text-[10px] font-bold text-slate-400 uppercase block">Note (optional)</label>
                <textarea
                  id="salaryNote"
                  rows={2}
                  value={salaryNote}
                  onChange={(e) => setSalaryNote(e.target.value)}
                  className="w-full text-[10px] p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold resize-none"
                  placeholder="e.g. Includes performance bonus"
                />
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-[0.98] mt-3"
            >
              Process Salary Payment
            </button>
          </form>
        </div>

        {/* 3. BIG GRAPH: NET PURE REVENUE CHART */}
        <div className="lg:col-span-8 bg-white border border-slate-250/70 rounded-[28px] p-6 shadow-sm flex flex-col justify-between h-72">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Trend Graph</span>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">Net Pure Revenue</h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-blue-600 block">{formatCurrency(totalIncome - totalExpenses)}</span>
              <span className="text-[8px] text-slate-450 block font-semibold">Net Accumulation Period</span>
            </div>
          </div>

          {/* Area Chart visualization of balance flow */}
          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.00}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94A3B8", fontWeight: "bold" }} stroke="#E2E8F0" />
                <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} stroke="#E2E8F0" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "10px", fontSize: "11px" }}
                  formatter={(value: any) => [`$${value}`, "Aggregated Sum"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="Balance" 
                  stroke="#2563EB" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-4 text-[9px] font-bold text-slate-450 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block" />
              <span>Incomes: {formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 block" />
              <span>Expenses: {formatCurrency(totalExpenses)}</span>
            </div>
          </div>

        </div>

      </div>

      {/* REDESIGNED SECTION FOR OUTSTANDING / REMAINING PAYMENTS */}
      <div className="bg-white border border-slate-250/70 rounded-[32px] p-6 shadow-sm space-y-6" id="due-payments-ledger">
        
        {/* Top Header & Visual KPI Row */}
        <div className="border-b border-slate-150 pb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-indigo-600 tracking-wider bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5 inline-block font-sans">Awaiting Settlements Hub</span>
            <h3 className="font-black text-slate-900 text-lg tracking-tight flex items-center gap-2">
              <Clock className="text-amber-500 animate-pulse" size={18} />
              <span>Outstanding Patient Balances Workspace</span>
            </h3>
            <p className="text-slate-500 text-xs font-semibold">Evaluate uncollected fees, search clinical billing debtors, and jump to physical charts to apply payments.</p>
          </div>
          
          {/* Section KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 self-stretch lg:self-auto">
            <div className="bg-amber-50/60 border border-amber-200/50 p-2 px-3.5 rounded-2xl flex flex-col justify-center min-w-[120px]">
              <span className="text-[8.5px] font-black uppercase text-slate-400">Total Uncollected</span>
              <span className="text-sm font-black text-amber-900 font-mono">${totalUncollectedOutstanding.toLocaleString()}</span>
            </div>
            <div className="bg-indigo-50/60 border border-indigo-200/50 p-2 px-3.5 rounded-2xl flex flex-col justify-center min-w-[110px]">
              <span className="text-[8.5px] font-black uppercase text-slate-400">Awaiting Files</span>
              <span className="text-sm font-black text-indigo-900">{patientsWithOutstandingBalances.length} files</span>
            </div>
            <div className="bg-rose-50/60 border border-rose-200/50 p-2 px-3.5 rounded-2xl flex flex-col justify-center col-span-2 sm:col-span-1 min-w-[110px]">
              <span className="text-[8.5px] font-black uppercase text-slate-400">High Debt Count</span>
              <span className="text-sm font-black text-rose-900">
                {patientsWithOutstandingBalances.filter(p => p.totalOwed >= 500).length} cases
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Search Control Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
          
          {/* Direct Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-[11px] text-slate-400 pointer-events-none" size={14} />
            <input
              type="text"
              placeholder="Search debtor name, contact phone, or treatment plan..."
              value={settlementSearch}
              onChange={(e) => setSettlementSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white placeholder:text-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {settlementSearch && (
              <button 
                onClick={() => setSettlementSearch("")}
                className="absolute right-2.5 top-2 hover:bg-slate-100 p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                type="button"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Segmentation tabs */}
            <div className="flex bg-white p-0.5 border border-slate-200 rounded-xl">
              {(["all", "high-debt", "medically-critical"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSettlementFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    settlementFilter === tab 
                      ? "bg-amber-600 text-white shadow-sm" 
                      : "text-slate-650 hover:text-slate-900"
                  }`}
                >
                  {tab === "all" ? "All" : tab === "high-debt" ? "High Debt" : "Alerts"}
                </button>
              ))}
            </div>

            {/* Sorter Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[9px] uppercase font-black text-slate-400">Sort:</span>
              <select
                value={settlementSort}
                onChange={(e) => setSettlementSort(e.target.value as any)}
                className="text-[10px] bg-transparent border-none text-slate-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="debt-desc">Highest Debt</option>
                <option value="debt-asc">Lowest Debt</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

        </div>

        {/* Redesigned Card Grid Layout - Refactored for better balance */}
        {filteredSettlements.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/40 rounded-3xl border border-dashed border-slate-200">
            <CheckCircle className="mx-auto text-emerald-500 mb-2 animate-bounce" size={32} />
            <h4 className="text-sm font-black text-slate-800">Clear Records Account</h4>
            <p className="text-xs text-slate-400 max-w-[320px] mx-auto mt-1">No outstanding patient balance folders match the selected criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredSettlements.map(p => {
              const isHighDebt = p.totalOwed >= 500;
              const isHighRisk = p.riskLevel === "High";
              
              return (
                <motion.div 
                  layout
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    if (onSelectPatient) onSelectPatient(p.id);
                    if (onSwitchTab) onSwitchTab("patients");
                  }}
                  className="group bg-white border border-slate-200/80 rounded-[28px] p-4 sm:p-5 hover:shadow-xl hover:border-blue-200/60 transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden"
                >
                  {/* Sidebar Status Indicator */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${isHighDebt ? 'bg-rose-500' : 'bg-amber-500'} z-20`} />

                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${isHighDebt ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  
                  {/* Hybrid Header Area */}
                  <div className="flex items-center justify-between gap-3 relative z-10 px-0.5 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Initials Avatar */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm border ${
                        isHighDebt ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[14px] font-black text-slate-900 truncate tracking-tight">{p.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight truncate min-w-0">ID: {p.id.substring(0, 8)}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200 shrink-0"></span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase truncate min-w-0">{calculateAge(p.dob)}Y • {p.gender[0]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-lg font-black font-mono leading-none ${isHighDebt ? 'text-rose-600' : 'text-amber-600'}`}>
                        ${p.totalOwed.toLocaleString()}
                      </div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mt-1">Uncollected</span>
                    </div>
                  </div>

                  {/* Segmented Progress Bar */}
                  <div className="flex gap-1 mt-4 mb-4">
                    <span className={`flex-1 h-1 rounded-full ${isHighDebt ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                    <span className="flex-1 h-1 rounded-full bg-slate-100"></span>
                    <span className="flex-1 h-1 rounded-full bg-slate-100"></span>
                  </div>

                  {/* Clinical Context Block */}
                  <div className="bg-slate-50 border border-slate-150/50 p-3.5 rounded-2xl mb-5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Outstanding Treatment Context</span>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic line-clamp-2">
                      "{p.oweDetails || "Pending financial settlement for clinical restorative work."}"
                    </p>
                  </div>

                  {/* Dual Action Buttons */}
                  <div className="flex items-center gap-2 mt-auto">
                    <button className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2">
                      <Phone size={12} className="text-slate-400" />
                      <span>Call Patient</span>
                    </button>
                    <button className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2">
                      <CreditCard size={12} />
                      <span>Settle ${p.totalOwed.toLocaleString()}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. UTILITIES AND EXTRA COSTS FORMS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="utilities-extras-split">
        
        {/* Pay Utilities Section */}
        <div className="bg-white border border-slate-250/70 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-150 pb-3">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Utilities Section</span>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                <span>Pay Utility Bill</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Record electricity, water, gas, and other utility payments</p>
            </div>

            <form onSubmit={handlePayUtility} className="space-y-4">
              {/* Utility selector with modern colorful icons in grid */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Utility Type</span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {utilitiesConfig.map(cfg => {
                    const isSelected = selectedUtilityType === cfg.label;
                    const IconComponent = cfg.icon;
                    return (
                      <button
                        type="button"
                        key={cfg.label}
                        onClick={() => setSelectedUtilityType(cfg.label)}
                        className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 text-[9px] font-extrabold transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-blue-50 border-blue-400 text-blue-800 font-black shadow-sm" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`p-1 rounded-lg border flex items-center justify-center ${cfg.color}`}>
                          <IconComponent size={13} />
                        </div>
                        <span className="truncate max-w-full text-[8px] sm:text-[9px] text-center leading-none">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Segmented Payment Period */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Period</span>
                <div className="flex p-0.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPeriod("Monthly");
                      setUtilityMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
                    }}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                      utilityPeriod === "Monthly" 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityPeriod("Daily");
                      setUtilityMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`);
                    }}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                      utilityPeriod === "Daily" 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Daily
                  </button>
                </div>
              </div>

              {/* Amount and Year Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="utilityMonth" className="text-[10px] font-bold text-slate-400 uppercase block">
                    {utilityPeriod === "Monthly" ? "Bill Month" : "Bill Date"}
                  </label>
                  <input
                    id="utilityMonth"
                    type={utilityPeriod === "Monthly" ? "month" : "date"}
                    value={utilityMonth}
                    onChange={(e) => setUtilityMonth(e.target.value)}
                    className="w-full text-[10px] font-semibold p-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="utilityAmount" className="text-[10px] font-bold text-slate-400 uppercase block">Amount</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-[10px] font-black text-slate-450">$</span>
                    <input
                      id="utilityAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={utilityAmount}
                      onChange={(e) => setUtilityAmount(e.target.value)}
                      className="w-full pl-6 pr-2 text-[10px] font-semibold p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Provider */}
              <div className="space-y-1">
                <label htmlFor="utilityProvider" className="text-[10px] font-bold text-slate-400 uppercase block">Provider (optional)</label>
                <input
                  id="utilityProvider"
                  type="text"
                  value={utilityProvider}
                  onChange={(e) => setUtilityProvider(e.target.value)}
                  className="w-full text-[10px] p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  placeholder="e.g. City Power Company"
                />
              </div>

              {/* Optional Notes */}
              <div className="space-y-1">
                <label htmlFor="utilityNote" className="text-[10px] font-bold text-slate-400 uppercase block">Note (optional)</label>
                <textarea
                  id="utilityNote"
                  rows={2}
                  value={utilityNote}
                  onChange={(e) => setUtilityNote(e.target.value)}
                  className="w-full text-[10px] p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold resize-none"
                  placeholder="e.g. Bill includes late fee"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Record Utility Payment
              </button>
            </form>
          </div>
        </div>

        {/* Extra Costs Section */}
        <div className="bg-white border border-slate-250/70 rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-150 pb-3">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Extra Costs</span>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                <FileText size={16} className="text-purple-500" />
                <span>Add Extra Cost</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Log other clinic expenses not covered by payroll or utilities</p>
            </div>

            <form onSubmit={handlePayExtra} className="space-y-4">
              
              {/* Category selector capsules tag links */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                <div className="flex flex-wrap gap-1.5">
                  {extraCategories.map(cat => {
                    const isSelected = selectedExtraCategory === cat;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setSelectedExtraCategory(cat)}
                        className={`px-3 py-1.5 border rounded-xl text-[9px] font-extrabold transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-purple-100 border-purple-400 text-purple-800 font-bold" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Show Custom category entry text input if "Other" is picked */}
              {selectedExtraCategory === "Other" && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Custom Category Name</span>
                  <input
                    type="text"
                    value={customExtraCategory}
                    onChange={(e) => setCustomExtraCategory(e.target.value)}
                    className="w-full text-[10px] p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-400 font-semibold"
                    placeholder="Or type custom category..."
                  />
                </div>
              )}

              {/* Cost Attribution Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Cost Attribution</span>
                <div className="flex p-0.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setExtraCostScope("Clinic")}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                      extraCostScope === "Clinic" 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Whole Clinic
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtraCostScope("Doctor")}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                      extraCostScope === "Doctor" 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Specific Doctor
                  </button>
                </div>
              </div>

              {/* Specific Doctor Selector */}
              {extraCostScope === "Doctor" && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Assign to Doctor</span>
                  <select
                    value={extraSelectedDoctorId}
                    onChange={(e) => setExtraSelectedDoctorId(e.target.value)}
                    className="w-full text-[10px] p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold bg-white cursor-pointer"
                  >
                    {availableDoctors.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.specialty})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Period Toggle */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Period</span>
                <div className="flex p-0.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setExtraPeriod("Specific Day");
                      setExtraDate(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`);
                    }}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                      extraPeriod === "Specific Day" 
                        ? "bg-purple-600 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Specific Day
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExtraPeriod("Monthly");
                      setExtraDate(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
                    }}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                      extraPeriod === "Monthly" 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Day/Month/Year and Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="extraDate" className="text-[10px] font-bold text-slate-400 uppercase block">
                    {extraPeriod === "Specific Day" ? "Select Date" : "Select Month"}
                  </label>
                  <input
                    id="extraDate"
                    type={extraPeriod === "Specific Day" ? "date" : "month"}
                    value={extraDate}
                    onChange={(e) => setExtraDate(e.target.value)}
                    className="w-full text-[10px] font-semibold p-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="extraAmount" className="text-[10px] font-bold text-slate-400 uppercase block">Amount</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-[10px] font-black text-slate-450">$</span>
                    <input
                      id="extraAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={extraAmount}
                      onChange={(e) => setExtraAmount(e.target.value)}
                      className="w-full pl-6 pr-2 text-[10px] font-semibold p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label htmlFor="extraNote" className="text-[10px] font-bold text-slate-400 uppercase block">Note (optional)</label>
                <textarea
                  id="extraNote"
                  rows={3}
                  value={extraNote}
                  onChange={(e) => setExtraNote(e.target.value)}
                  className="w-full text-[10px] p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold resize-none"
                  placeholder="e.g. Replaced dental chair upholstery"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Record Extra Cost
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* 5. BOTTOM TRANSACTIONS LEDGER */}
      <div className="bg-white border border-slate-250/70 rounded-[32px] p-6 shadow-sm flex flex-col justify-between" id="transactions-ledger-panel">
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-blue-600" />
                <span>Transactions Ledger</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Double Entry Clinical Log</span>
            </div>

            {/* Income versus Expense Segment Filter & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              
              {/* Search query field */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 text-slate-400" size={12} />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-xl text-[10px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-bold placeholder:text-slate-400"
                />
              </div>

              {/* Segment Toggle Buttons */}
              <div className="flex bg-slate-50 p-0.5 border border-slate-200 rounded-xl">
                {(["all", "income", "expense"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setLedgerFilter(mode)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                      ledgerFilter === mode 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    {mode === "all" ? "All Flow" : mode}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Table display */}
          <div className="w-full overflow-x-auto custom-scrollbar pb-2">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-150 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                  <th className="py-2.5">Label Event Description</th>
                  <th className="py-2.5">Patient Number</th>
                  <th className="py-2.5">Treating Practitioner</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Method</th>
                  <th className="py-2.5 text-right">Sum Weight</th>
                  <th className="py-2.5 text-right">Invoicing Doc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-650 font-bold">
                {filteredLedgerRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <AlertCircle className="mx-auto text-slate-300 mb-1" size={24} />
                      <span className="text-xs font-semibold">No transactions found match these filters.</span>
                    </td>
                  </tr>
                ) : (
                  filteredLedgerRecords.map(rec => {
                    const isExpense = rec.type === "expense";
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                        
                        {/* Event / Description */}
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                              isExpense 
                                ? "bg-rose-50 border-rose-100 text-rose-500" 
                                : "bg-emerald-50 border-emerald-100 text-emerald-500"
                            }`}>
                              {isExpense ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-800 block text-xs">{rec.procedureName}</span>
                              <span className="text-[9px] text-slate-400 block font-bold leading-none capitalize">
                                {isExpense 
                                  ? `${rec.expenseType} Cost • ${rec.notes || rec.expenseCategory}` 
                                  : (
                                    <span className="inline-flex items-center gap-1">
                                      <span>Treatment Payment • Folder: </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (onSelectPatient && rec.patientId !== "N/A" && rec.patientId) {
                                            onSelectPatient(rec.patientId);
                                            if (onSwitchTab) onSwitchTab("patients");
                                          }
                                        }}
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-extrabold cursor-pointer inline"
                                        title="Jump to Patient clinical records"
                                      >
                                        {rec.patientName}
                                      </button>
                                    </span>
                                  )
                                }
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Patient Number */}
                        <td className="py-3.5 font-mono text-[10px] text-slate-500">
                          {getPatientPhone(rec)}
                        </td>

                        {/* Treating Practitioner */}
                        <td className="py-3.5 text-xs text-slate-700 font-bold">
                          {getAssociatedDoctorOrStaff(rec)}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 font-mono text-[9px] text-slate-450 font-bold">{rec.date}</td>

                        {/* Method badge */}
                        <td className="py-3.5">
                          <span className="text-[9px] bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg font-black font-mono">
                            {rec.paymentMethod || "Wire Clearance"}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 text-right">
                          <span className={`font-black text-xs ${isExpense ? "text-slate-800" : "text-emerald-600"}`}>
                            {isExpense ? `-$${rec.totalCost}` : `+$${rec.paidAmount}`}
                          </span>
                        </td>

                        {/* Receipt printed trigger */}
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => setActiveReceiptId(rec.id)}
                            className="px-2.5 py-1.5 hover:bg-blue-50 border border-slate-200/60 hover:border-blue-200 text-blue-600 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[9px] font-black"
                            title="Generate printed invoice receipt"
                            id={`receipt-trigger-${rec.id}`}
                          >
                            <Receipt size={11} />
                            <span>PDF</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* 6. DETAILED RECEIPT OVERLAY INVOICE MODAL */}
      {activeReceipt && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveReceiptId(null);
            }
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-55 p-4 overflow-y-auto cursor-pointer animate-fade-in"
        >
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 w-full max-w-lg shadow-2xl relative my-8 print:p-0 print:border-none print:shadow-none cursor-default">
            
            {/* Close trigger - hide on print */}
            <button 
              onClick={() => setActiveReceiptId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer print:hidden p-1.5 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X size={18} />
            </button>

            {/* PRINT CONTAINER WRAPPER */}
            <div id="printable-receipt-container" className="space-y-6">
              
              {/* Header clinic info */}
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-5">
                <div>
                  <h1 className="text-sm font-black tracking-tight text-slate-900">Zendenta Premium Dentistry</h1>
                  <p className="text-[9px] text-slate-400 font-semibold">742 Evergreen Terrace, Dental District, CA</p>
                  <p className="text-[8px] text-slate-450 font-semibold">Tel: +1 555-DENTIST • license #DE-{new Date().getFullYear()}-94B</p>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                  Z
                </div>
              </div>

              {/* Invoicing detail columns */}
              <div className="grid grid-cols-2 gap-4 text-[10px]">
                <div>
                  <span className="text-[8px] uppercase font-black text-slate-400 block tracking-wider">Invoiced Recipient</span>
                  <span className="font-extrabold text-slate-800 block text-xs">
                    {activeReceipt.type === "expense" ? (
                      activeReceipt.procedureName
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectPatient && activeReceipt.patientId && activeReceipt.patientId !== "N/A") {
                            onSelectPatient(activeReceipt.patientId);
                            setActiveReceiptId(null);
                            if (onSwitchTab) onSwitchTab("patients");
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-extrabold cursor-pointer text-left inline"
                        title="Click to open patient healthcare folder"
                      >
                        {activeReceipt.patientName}
                      </button>
                    )}
                  </span>
                  <span className="text-[9px] text-slate-450 block mt-0.5">
                    {activeReceipt.type === "expense" ? "Clinic Expense Ledger" : `Folder ID: ${activeReceipt.patientId}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] uppercase font-black text-slate-400 block tracking-wider">Reference Info</span>
                  <span className="font-mono text-[9px] text-slate-500 block">Receipt No: <strong>{activeReceipt.receiptNo}</strong></span>
                  <span className="font-mono text-[9px] text-slate-500 block">Settled On: {activeReceipt.date}</span>
                </div>
              </div>

              {/* Items pricing table wrapper */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60 space-y-4">
                <div className="flex border-b border-slate-200 pb-2 text-[8px] uppercase font-black text-slate-400 justify-between tracking-wider">
                  <span>Description of clinical works / expenditure</span>
                  <span className="text-right">Total sum</span>
                </div>

                <div className="flex justify-between items-start text-xs text-slate-700">
                  <div>
                    <span className="font-extrabold text-slate-800 block">{activeReceipt.procedureName}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-semibold">
                      {activeReceipt.notes || "Double entered item synced with physical bank records."}
                    </span>
                  </div>
                  <span className="font-mono font-black text-slate-800">
                    {formatCurrency(activeReceipt.type === "expense" ? activeReceipt.totalCost : activeReceipt.paidAmount)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-right font-bold text-slate-650">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Processed Charge:</span>
                    <span className="font-mono">{formatCurrency(activeReceipt.type === "expense" ? activeReceipt.totalCost : activeReceipt.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-blue-600 border-t border-slate-100 pt-1.5">
                    <span>Amount Transacted:</span>
                    <span className="font-mono">{formatCurrency(activeReceipt.type === "expense" ? activeReceipt.totalCost : activeReceipt.paidAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-5 border-t border-dashed border-slate-200">
                <div className="text-center">
                  <div className="h-8 border-b border-slate-200" />
                  <span className="text-[8px] uppercase font-black text-slate-400 block pt-1.5 tracking-wider">Clinician / Controller</span>
                </div>
                <div className="text-center">
                  <div className="h-8 border-b border-slate-200" />
                  <span className="text-[8px] uppercase font-black text-slate-400 block pt-1.5 tracking-wider">Signature / Clearance</span>
                </div>
              </div>

              <div className="text-center text-[8px] text-slate-400 max-w-[280px] mx-auto pt-2 font-semibold">
                This document acts as an official clinical clearance statement. Keep this safe for health record audits and tax clearances.
              </div>

            </div>

            {/* Invoicing Modal triggers */}
            <div className="mt-6 flex gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-100"
              >
                <Printer size={13} />
                <span>Trigger System Print</span>
              </button>
              <button
                onClick={() => setActiveReceiptId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Invoice
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
