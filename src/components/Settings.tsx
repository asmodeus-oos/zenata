import React, { useState } from "react";
import { useStore } from "../store";
import { 
  Settings as SettingsIcon, 
  Download, 
  RefreshCw, 
  Building, 
  Phone, 
  Globe, 
  ShieldAlert, 
  CheckCircle,
  FileDown,
  X,
  Wifi,
  WifiOff,
  Database
} from "lucide-react";

export default function Settings() {
  const { 
    clinicSettings, 
    updateClinicSettings, 
    emergencyReset, 
    patients, 
    appointments, 
    financialRecords, 
    users, 
    inventory, 
    activityLogs,
    isOnline,
    offlineSimulated,
    toggleNetworkSimulation
  } = useStore();

  const [clinicName, setClinicName] = useState(clinicSettings.name);
  const [clinicAddress, setClinicAddress] = useState(clinicSettings.address);
  const [clinicPhone, setClinicPhone] = useState(clinicSettings.phone);
  const [clinicSocial, setClinicSocial] = useState(clinicSettings.social);

  const [isWiping, setIsWiping] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinicSettings({
      name: clinicName,
      address: clinicAddress,
      phone: clinicPhone,
      social: clinicSocial
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // ONE-CLICK EXPORT TO JSON: Pulls all states and creates a local backup file download!
  const handleExportBackup = () => {
    const backupObj = {
      exportTimestamp: new Date().toISOString(),
      erpName: "Zendenta ERP Cloud Backup",
      clinicInfo: clinicSettings,
      data: {
        patients,
        appointments,
        financialRecords,
        users,
        inventory,
        activityLogs
      }
    };

    const str = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zendenta_erp_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeepWipe = () => {
    if (wipeConfirm === "FACTORY-RESET") {
      emergencyReset();
      setIsWiping(false);
      setWipeConfirm("");
      alert("System purged and reset successfully! All databases restored to clean clinical guidelines.");
    } else {
      alert("Error: Incorrect confirmation reset phrase.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-module-panel">
      {/* Tab Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-500/10 border border-rose-200/40 px-3 py-1 rounded-full">System & Presets</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">ERP SYSTEM SETTINGS</h2>
          <p className="text-slate-500 text-xs font-medium">Verify official clinic receipt descriptors, export database backup archives, and execute diagnostic purges.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: EDIT CLINIC DETAILS */}
        <div className="frosted-glass-panel rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="border-b border-white/40 pb-3">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building size={16} className="text-blue-500" />
              <span>Clinic Profile Specifications</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">This information is printed dynamically onto financial ledger receipt forms.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Official Clinic Denomination</label>
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Clinic Street Address & ZIP</label>
              <input
                type="text"
                required
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Official Telephone Line</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={12} />
                  <input
                    type="text"
                    required
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    className="w-full pl-8 pr-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Web Domain Reference</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 text-slate-400" size={12} />
                  <input
                    type="text"
                    required
                    value={clinicSocial}
                    onChange={(e) => setClinicSocial(e.target.value)}
                    className="w-full pl-8 pr-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/20">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all shadow-sm"
              >
                Apply Changes
              </button>
              
              {saveSuccess && (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5 animate-pulse">
                  <CheckCircle size={14} />
                  Settings applied permanently!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: PORTABILITY AND EMERGENCY RESETS */}
        <div className="space-y-6">

          {/* Card Offline Persistence Diagnostics */}
          <div className="frosted-glass-panel rounded-[32px] p-6 shadow-sm space-y-5">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-750 bg-indigo-500/10 border border-indigo-200/40 px-2.5 py-0.5 rounded-full">
                Offline Resilience
              </span>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mt-2">
                <Database size={16} className="text-blue-500" />
                <span>Database Cache & Diagnostics</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-semibold leading-relaxed">
                Configure your persistent clinical browser index, monitor cloud link integrity, and test zero-interruption dental record offline modes.
              </p>
            </div>

            {/* Offline Diagnostics metrics panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
                isOnline 
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-800" 
                  : "bg-amber-500/5 border-amber-500/10 text-amber-850"
              }`}>
                <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Sync Channel</span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {isOnline ? <Wifi size={14} className="text-emerald-600" /> : <WifiOff size={14} className="text-amber-600 animate-pulse" />}
                  <span className="text-xs font-black">{isOnline ? "Online Connected" : "Connection Down"}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/40 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Cache Status</span>
                <div className="flex items-center gap-1.5 mt-1.5 text-indigo-800">
                  <Database size={13} className="text-indigo-600" />
                  <span className="text-xs font-black">IndexedDB Active</span>
                </div>
              </div>
            </div>

            {/* Simulated Interruption Test toggle */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800">Clinical Offline Simulation</h4>
                  <p className="text-[9px] text-slate-400 font-semibold leading-relaxed mt-0.5">Toggle network bypass to test local cache response.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleNetworkSimulation}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer outline-none ${
                    offlineSimulated ? "bg-amber-500" : "bg-slate-300"
                  }`}
                >
                  <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    offlineSimulated ? "translate-x-5" : ""
                  }`} />
                </button>
              </div>
              {offlineSimulated && (
                <div className="text-[9px] bg-amber-50 border border-amber-200/30 text-amber-850 p-2.5 rounded-xl font-semibold leading-normal">
                  ⚠️ Simulated Connection interrupted! All new dental appointments, patient updates, or financial ledger actions will register locally and sync automatically when the connection is toggled back online.
                </div>
              )}
            </div>

            {/* Cache size limit selection - Simplified to Unlimited Always */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/40 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-800">Maximum Storage Cache Limit</h4>
                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed mt-0.5">Automated high-capacity browser persistence.</p>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-tight">Unlimited Always</span>
              </div>
            </div>
          </div>

          {/* Card A: Data Portability JSON Exporter */}
          <div className="frosted-glass-panel rounded-[32px] p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileDown size={16} className="text-blue-500" />
                <span>One-Click Backup Portability</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium flex-wrap max-w-sm">
                Securely pack patient teeth maps, orthodontic diagnostic briefs, shift lists, and invoice ledgers into a readable JSON file backup.
              </p>
            </div>

            <button
              onClick={handleExportBackup}
              className="w-full py-4.5 bg-blue-600/10 hover:bg-blue-600/15 border border-blue-200/50 hover:border-blue-300 text-blue-750 font-bold text-xs rounded-2xl cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Download size={15} />
              <span>Compile & Download JSON File Backup</span>
            </button>
          </div>

          {/* Card B: Danger factory reset Zone */}
          <div className="bg-rose-500/10 rounded-[32px] border border-rose-250/30 p-6 space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-red-700 shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="font-extrabold text-red-950 text-sm tracking-tight">Factory Purge & Restore Baseline</h3>
                <p className="text-[11px] text-rose-800/80 mt-1 max-w-md leading-relaxed font-semibold">
                  Wipes out all custom clinical records, inventory supplies added during the workday session, log history arrays, and patient cards. Fits clinic demonstration testing.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsWiping(true)}
              className="px-4 py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 shadow-red-150"
            >
              <RefreshCw size={14} className="animate-spin-slow" />
              <span>Trigger Offline Factory Purge</span>
            </button>
          </div>
        </div>
      </div>

      {/* MULTI-CONFIRM FACTORY WIPE MODAL */}
      {isWiping && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsWiping(false);
              setWipeConfirm("");
            }
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[110] p-4 cursor-pointer"
        >
          <div className="bg-white rounded-[32px] border border-slate-200 p-6 w-full max-w-sm shadow-2xl relative cursor-default max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => {
                setIsWiping(false);
                setWipeConfirm("");
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>

            <h3 className="text-base font-black text-rose-850 flex items-center gap-2 mb-2">
              <ShieldAlert size={18} className="text-red-600" />
              <span>System Verification Required</span>
            </h3>
            <p className="text-xs text-slate-700 leading-normal mb-4 font-semibold">
              This will overwrite all active offline cached state. This process is irreversible unless you have previously downloaded a JSON backup.
            </p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-650 block">Type "FACTORY-RESET" to clear database</label>
                <input
                  type="text"
                  value={wipeConfirm}
                  onChange={(e) => setWipeConfirm(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-center tracking-widest text-red-650 focus:outline-none focus:ring-2 focus:ring-red-150 transition-all font-bold shadow-sm"
                  placeholder="FACTORY-RESET"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={handleDeepWipe}
                  disabled={wipeConfirm !== "FACTORY-RESET"}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm border border-red-700/10"
                >
                  Verify Purge
                </button>
                <button
                  onClick={() => {
                    setIsWiping(false);
                    setWipeConfirm("");
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
