import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";

export interface DoctorStat {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  treatedCount: number;
  income: number;
  stockExpense: number;
  netProfit: number;
  marginRate: number;
  appointmentsCount: number;
}

interface ProviderBreakdownTableProps {
  doctorStats: DoctorStat[];
  totalPracticeIncome: number;
  totalPracticeAppointments: number;
  handleAuditOperator: (id: string) => void;
}

interface ProviderBreakdownRowProps {
  ds: DoctorStat;
  totalClinicIncome: number;
  totalClinicAppts: number;
  rowHeight: number;
  handleAuditOperator: (id: string) => void;
}

const ProviderBreakdownRow = React.memo(function ProviderBreakdownRow({
  ds,
  totalClinicIncome,
  totalClinicAppts,
  rowHeight,
  handleAuditOperator,
}: ProviderBreakdownRowProps) {
  const incomeSharePercent = (ds.income / (totalClinicIncome || 1)) * 100;
  const workloadPercent = (ds.appointmentsCount / (totalClinicAppts || 1)) * 100;

  return (
    <tr className="hover:bg-slate-50/45 transition-colors group" style={{ height: `${rowHeight}px` }}>
      {/* Practitioner Name & Role */}
      <td className="p-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs shrink-0 select-none">
            {ds.name.replace("Dr. ", "").charAt(0)}
          </div>
          <div className="min-w-0">
            <strong className="text-slate-800 font-bold block text-xs truncate">{ds.name}</strong>
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wide truncate">
              {ds.role === "admin" ? "Practice Owner / Admin" : "Associate Practitioner"}
            </span>
          </div>
        </div>
      </td>

      {/* Workload / Appointments */}
      <td className="p-3.5 text-center whitespace-nowrap">
        <div className="inline-flex flex-col items-center">
          <span className="font-bold text-slate-800 text-xs">{ds.appointmentsCount} Appts</span>
          <div className="w-16 bg-slate-200 rounded-full h-1 mt-1 overflow-hidden" title={`${workloadPercent.toFixed(1)}% of total clinic workload`}>
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(workloadPercent, 100)}%` }} />
          </div>
        </div>
      </td>

      {/* Treated Patients count */}
      <td className="p-3.5 text-center whitespace-nowrap">
        <span className="font-bold text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/40">
          {ds.treatedCount} Patients
        </span>
      </td>

      {/* Gross Income Share */}
      <td className="p-3.5 text-right whitespace-nowrap">
        <div className="inline-flex flex-col items-end">
          <span className="font-black text-slate-800 text-xs">
            ${ds.income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[9px] text-emerald-600 font-bold" title={`${incomeSharePercent.toFixed(1)}% share of total practice revenue`}>
            {incomeSharePercent.toFixed(1)}% of revenue
          </span>
        </div>
      </td>

      {/* Consumed Stock Cost */}
      <td className="p-3.5 text-right whitespace-nowrap text-rose-500 font-semibold text-xs">
        -${ds.stockExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>

      {/* Net Margin Profit */}
      <td className="p-3.5 text-right whitespace-nowrap font-black text-xs text-indigo-700">
        ${ds.netProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>

      {/* Practice Margin Efficiency Rate */}
      <td className="p-3.5 text-center whitespace-nowrap">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
          ds.marginRate >= 75 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : ds.marginRate >= 50 
            ? "bg-blue-50 text-blue-700 border-blue-200" 
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {ds.marginRate.toFixed(1)}% Yield
        </span>
      </td>

      {/* Audit Action Button */}
      <td className="p-3.5 text-center whitespace-nowrap">
        <button
          onClick={() => handleAuditOperator(ds.id)}
          className="py-1 px-3 bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 text-slate-600 font-bold text-[10px] rounded-lg transition-all shadow-sm flex items-center gap-1 mx-auto cursor-pointer"
        >
          <span>Audit Operator</span>
          <ChevronRight size={10} />
        </button>
      </td>
    </tr>
  );
});

export default function ProviderBreakdownTable({
  doctorStats,
  totalPracticeIncome,
  totalPracticeAppointments,
  handleAuditOperator,
}: ProviderBreakdownTableProps) {
  const [providerSortBy, setProviderSortBy] = useState<"income" | "netProfit" | "appointmentsCount" | "treatedCount" | "marginRate">("income");
  const [providerSortOrder, setProviderSortOrder] = useState<"asc" | "desc">("desc");

  const sortedDoctorStats = useMemo(() => {
    return [...doctorStats].sort((a, b) => {
      const valA = a[providerSortBy];
      const valB = b[providerSortBy];
      if (valA < valB) return providerSortOrder === "asc" ? -1 : 1;
      if (valA > valB) return providerSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [doctorStats, providerSortBy, providerSortOrder]);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  const handleTableScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height || 400);
      }
    });
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const ROW_HEIGHT = 68;
  const OVERSCAN_COUNT = 6;

  const startIndex = useMemo(() => {
    return Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_COUNT);
  }, [scrollTop]);

  const endIndex = useMemo(() => {
    return Math.min(sortedDoctorStats.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN_COUNT);
  }, [scrollTop, containerHeight, sortedDoctorStats.length]);

  const visibleDoctorStats = useMemo(() => {
    return sortedDoctorStats.slice(startIndex, endIndex).map((ds, idx) => ({
      ds,
      originalIndex: startIndex + idx,
    }));
  }, [sortedDoctorStats, startIndex, endIndex]);

  const paddingTop = useMemo(() => {
    return startIndex * ROW_HEIGHT;
  }, [startIndex]);

  const paddingBottom = useMemo(() => {
    return Math.max(0, (sortedDoctorStats.length - endIndex) * ROW_HEIGHT);
  }, [sortedDoctorStats.length, endIndex]);

  return (
    <div className="frosted-glass-panel rounded-[32px] p-8 shadow-sm border border-slate-200/50 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/40 rounded-full">Comparative Analytics</span>
          </div>
          <h3 className="text-base font-black text-slate-850 mt-1.5 uppercase tracking-tight">Practice-wide Provider Breakdown</h3>
          <p className="text-slate-500 text-[11px] font-medium">Comparative evaluation of clinical workload, proportional gross receipts, stock debits, and net practice margins.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-1.5 border border-slate-200/60 rounded-2xl w-full md:w-auto">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider px-2 shrink-0 select-none">Sort:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "income", label: "Gross Income" },
              { id: "netProfit", label: "Net Profit" },
              { id: "appointmentsCount", label: "Workload" },
              { id: "treatedCount", label: "Patients" },
              { id: "marginRate", label: "Efficiency" }
            ].map((btn) => {
              const isSelected = providerSortBy === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => {
                    if (providerSortBy === btn.id) {
                      setProviderSortOrder(prev => prev === "asc" ? "desc" : "asc");
                    } else {
                      setProviderSortBy(btn.id as any);
                      setProviderSortOrder("desc");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-650 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {btn.label} {isSelected && (providerSortOrder === "desc" ? "↓" : "↑")}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Breakdown Table with horizontal scroll wrapper */}
      <div className="w-full overflow-x-auto custom-scrollbar">
        <div 
          ref={tableContainerRef}
          onScroll={handleTableScroll}
          className="border border-slate-200/80 rounded-2xl overflow-y-auto custom-scrollbar bg-slate-50/20 max-h-[500px]"
        >
          <table className="w-full text-left border-collapse text-[11px] min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] whitespace-nowrap sticky top-0 z-10">
                <th className="p-3.5 bg-slate-50">Practitioner</th>
                <th className="p-3.5 text-center bg-slate-50">Appointments</th>
                <th className="p-3.5 text-center bg-slate-50">Treated Patients</th>
                <th className="p-3.5 text-right bg-slate-50">Gross Income Share</th>
                <th className="p-3.5 text-right bg-slate-50">Depleted Supplies cost</th>
                <th className="p-3.5 text-right bg-slate-50">Net Practice Profit</th>
                <th className="p-3.5 text-center bg-slate-50">Practice Margin Rate</th>
                <th className="p-3.5 text-center bg-slate-50">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paddingTop > 0 && (
                <tr style={{ height: `${paddingTop}px` }}>
                  <td colSpan={8} className="p-0 border-none" style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {visibleDoctorStats.map(({ ds }) => (
                <ProviderBreakdownRow
                  key={ds.id}
                  ds={ds}
                  totalClinicIncome={totalPracticeIncome}
                  totalClinicAppts={totalPracticeAppointments}
                  rowHeight={ROW_HEIGHT}
                  handleAuditOperator={handleAuditOperator}
                />
              ))}
              {paddingBottom > 0 && (
                <tr style={{ height: `${paddingBottom}px` }}>
                  <td colSpan={8} className="p-0 border-none" style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
