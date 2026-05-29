import { 
  Activity, 
  Users, 
  Calendar, 
  DollarSign, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X,
  PlusCircle,
  Clock,
  Boxes,
  Settings,
  TrendingUp,
  Wifi,
  WifiOff
} from "lucide-react";
import { useStore } from "../store";
import { ZendentaLogo } from "./ZendentaLogo";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen
}: SidebarProps) {
  const { currentUser, logout, isOnline, offlineSimulated } = useStore();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity, roles: ["admin", "clinician", "frontdesk"] },
    { id: "appointments", label: "Booking Scheduler", icon: Calendar, roles: ["admin", "clinician", "frontdesk"] },
    { id: "patients", label: "Patients & Tooth Maps", icon: Users, roles: ["admin", "clinician", "frontdesk"] },
    { id: "finance", label: "Financial Ledger", icon: DollarSign, roles: ["admin", "frontdesk"] },
    { id: "performance", label: "Staff Performance", icon: TrendingUp, roles: ["admin", "clinician", "frontdesk"] },
    { id: "inventory", label: "Inventory & Assets", icon: Boxes, roles: ["admin", "clinician", "frontdesk"] },
    { id: "staff", label: "Staff Portal", icon: ShieldAlert, roles: ["admin"] },
    { id: "settings", label: "System Settings", icon: Settings, roles: ["admin"] }
  ];

  const allowedItems = menuItems.filter(item => 
    currentUser ? item.roles.includes(currentUser.role) : false
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-5 left-5 z-50 md:top-6 md:left-6 bg-white/80 backdrop-blur rounded-full shadow-sm">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Toggle Navigation"
          id="sidebar-toggle-mobile"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Overlays for Mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/35 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Container */}
      <aside className={`
        fixed inset-y-0 left-0 bg-white border-r border-slate-200/80 z-45 w-72 flex flex-col
        transition-transform duration-300 transform lg:translate-x-0 lg:static h-screen shadow-md
        overflow-y-auto scrollbar-thin print:hidden
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 flex flex-col justify-between min-h-full gap-8">
          <div className="space-y-6">
            {/* Logo and Branding Header */}
            <div className="flex items-center gap-3">
              <ZendentaLogo size={42} />
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-slate-900 text-base tracking-tight select-none font-display truncate">Zendenta ERP</h1>
                <p className="text-[10px] uppercase font-bold tracking-wider text-blue-500 truncate leading-none mt-1">Suite Medical</p>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1">
              {allowedItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all cursor-pointer
                      ${isActive 
                        ? "bg-blue-50 text-blue-700 border border-blue-200/50 font-bold shadow-sm" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 border border-transparent"
                      }
                    `}
                    id={`sidebar-item-${item.id}`}
                  >
                    <Icon size={18} className={isActive ? "text-blue-600" : "text-slate-400"} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Section / Logout */}
          <div className="border-t border-slate-100 pt-6 mt-auto">
            <div className="flex items-center gap-3 mb-4 p-2 bg-slate-50 border border-slate-200/60 rounded-2xl overflow-hidden">
              <div className="w-9 h-9 min-w-[36px] rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm uppercase shrink-0">
                {currentUser?.name ? currentUser.name.substring(0, 2) : "US"}
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <h4 className="font-semibold text-slate-800 text-xs truncate" title={currentUser?.name}>
                  {currentUser?.name || "Dr. Thorne"}
                </h4>
                <p className="text-[10px] text-slate-500 capitalize truncate">
                  {currentUser?.role || "administrator"}
                </p>
              </div>
            </div>

            {/* Offline persistence status indicator */}
            <div className={`mb-4 p-3 rounded-2xl border text-[11px] font-bold flex items-center justify-between transition-all select-none ${
              isOnline 
                ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-800" 
                : "bg-amber-500/10 border-amber-500/20 text-amber-850"
            }`}>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                </span>
                <span className="tracking-wide">{isOnline ? "Cloud Sync Active" : "Offline Cache Ready"}</span>
              </div>
              <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black tracking-wider ${
                isOnline 
                  ? "bg-emerald-100 text-emerald-800" 
                  : "bg-amber-150 text-amber-805"
              }`}>
                {offlineSimulated ? "Simulated" : "Live"}
              </span>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded-2xl text-xs font-semibold transition-all cursor-pointer"
              id="sidebar-logout"
            >
              <LogOut size={14} />
              <span>Exit Suite</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
