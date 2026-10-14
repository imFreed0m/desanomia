import React from "react";
import { Bell, AlertOctagon, User } from "lucide-react";

interface TopHeaderProps {
  activeTankName: string;
  activeCropName: string;
  wsOnline: boolean;
  currentTimeWib: string;
  unreadAlertsCount: number;
  onEmergencyStop: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTankName,
  activeCropName,
  wsOnline,
  currentTimeWib,
  unreadAlertsCount,
  onEmergencyStop,
}) => {
  return (
    <header className="w-full h-[62px] flex-shrink-0 flex items-center justify-between bg-surface-card rounded-2xl px-5 border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] select-none">
      {/* Left: Active Tank Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200/70 px-3.5 py-1.5 rounded-full shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />

          <span className="text-[13px] font-bold text-primary-container">
            {activeTankName}: {activeCropName} (Aktif)
          </span>
        </div>
        <span className="text-[12px] text-text-muted font-body">
          Slot 2–5 Siaga
        </span>
      </div>

      {/* Center: Quick Route Indicators */}
      <nav className="flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/80 shadow-inner">
        <span className="px-5 py-1.5 rounded-full text-[13px] font-bold bg-surface-card text-primary-container shadow-xs border border-blue-200/40">
          Overview Cockpit
        </span>
        <span className="px-5 py-1.5 rounded-full text-[13px] font-medium text-text-secondary">
          Fertigasi
        </span>
        <span className="px-5 py-1.5 rounded-full text-[13px] font-medium text-text-secondary">
          Jadwal
        </span>
        <span className="px-5 py-1.5 rounded-full text-[13px] font-medium text-text-secondary">
          Diagnostik
        </span>
      </nav>

      {/* Right: Clock, Live WS Dot, Notification & Instant 1-Tap E-STOP Button */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[13px] text-text-secondary px-1 font-semibold">
          {currentTimeWib}
        </span>

        {/* WebSocket Pulse Dot */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-3 py-1 rounded-full text-[11px] font-bold shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />

            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono">
            {wsOnline ? "Online 1.0Hz" : "Offline"}
          </span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="relative w-9 h-9 rounded-full bg-surface-card border border-slate-200/80 hover:bg-slate-50 flex items-center justify-center text-text-secondary transition-colors shadow-xs"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </button>

        {/* MASTER EMERGENCY STOP (E-STOP) - 56px+ tactile touch target, z-[100] persistent */}
        <button
          type="button"
          onClick={onEmergencyStop}
          className="h-11 px-5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] shadow-[0_4px_14px_rgba(239,68,68,0.35)] border border-red-500 flex items-center gap-2 transition-all active:scale-95"
          title="Tombol E-STOP Fisik / Software 1-Tap Instan"
        >
          <AlertOctagon className="w-5 h-5 fill-white text-red-600" />

          <span className="tracking-wider">E-STOP</span>
        </button>

        {/* Operator User Avatar */}
        <div className="w-9 h-9 rounded-full bg-blue-600 ring-2 ring-blue-100 flex items-center justify-center text-white shadow-xs">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
