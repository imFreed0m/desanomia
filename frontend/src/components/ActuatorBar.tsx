import React from "react";
import { ActuatorState } from "../types";
import { Cpu } from "lucide-react";

interface ActuatorBarProps {
  actuators: ActuatorState;
}

export const ActuatorBar: React.FC<ActuatorBarProps> = ({ actuators }) => {
  const activeCount = [
    actuators.sv1Water,
    actuators.pp1Peristaltic,
    actuators.m1Mixer,
    actuators.pDist,
  ].filter(Boolean).length;

  return (
    <div className="bg-surface-card rounded-[22px] p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.02)] flex flex-col gap-2">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-text-secondary" />
          <span className="text-[12.5px] font-bold text-text-primary">
            Status Aktuator & Relai (12V DC)
          </span>
        </div>
        <span className="text-[10px] text-text-secondary font-mono bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full font-semibold">
          {activeCount} Aktif • {4 - activeCount} Standby
        </span>
      </div>

      {/* Compact 4-Grid Horizontal Row */}
      <div className="grid grid-cols-4 gap-2">
        {/* SV1 Solenoid */}
        <div
          className={`flex flex-col p-2 rounded-xl border transition-colors ${
            actuators.sv1Water
              ? "bg-blue-50/80 border-blue-200"
              : "bg-slate-50/70 border-slate-200/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-mono uppercase font-bold text-text-muted">
              SV1
            </span>
            <span
              className={`w-2 h-2 rounded-full ${actuators.sv1Water ? "bg-primary-container animate-ping" : "bg-slate-300"}`}
            />
          </div>
          <span className="text-[11px] font-bold text-text-primary mt-1 truncate">
            Solenoid Air
          </span>
          <span
            className={`text-[9.5px] font-mono mt-0.5 ${actuators.sv1Water ? "text-primary-container font-bold" : "text-text-muted"}`}
          >
            {actuators.sv1Water ? "Terbuka" : "Standby"}
          </span>
        </div>

        {/* PP1 Peristaltic */}
        <div
          className={`flex flex-col p-2 rounded-xl border transition-colors ${
            actuators.pp1Peristaltic
              ? "bg-blue-50/80 border-blue-200"
              : "bg-slate-50/70 border-slate-200/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-mono uppercase font-bold text-text-muted">
              PP1
            </span>
            <span
              className={`w-2 h-2 rounded-full ${actuators.pp1Peristaltic ? "bg-primary-container animate-ping" : "bg-slate-300"}`}
            />
          </div>
          <span className="text-[11px] font-bold text-text-primary mt-1 truncate">
            Peristaltik
          </span>
          <span
            className={`text-[9.5px] font-mono mt-0.5 ${actuators.pp1Peristaltic ? "text-primary-container font-bold" : "text-text-muted"}`}
          >
            {actuators.pp1Peristaltic ? "Injeksi" : "Standby"}
          </span>
        </div>

        {/* M1 Mixer */}
        <div
          className={`flex flex-col p-2 rounded-xl border transition-colors ${
            actuators.m1Mixer
              ? "bg-blue-50/80 border-blue-200"
              : "bg-slate-50/70 border-slate-200/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-mono uppercase font-bold text-text-muted">
              M1
            </span>
            <span
              className={`w-2 h-2 rounded-full ${actuators.m1Mixer ? "bg-primary-container animate-ping" : "bg-slate-300"}`}
            />
          </div>
          <span className="text-[11px] font-bold text-text-primary mt-1 truncate">
            Pengaduk
          </span>
          <span
            className={`text-[9.5px] font-mono mt-0.5 ${actuators.m1Mixer ? "text-primary-container font-bold" : "text-text-muted"}`}
          >
            {actuators.m1Mixer ? "Aduk 100%" : "Standby"}
          </span>
        </div>

        {/* P-DIST Distribution Pump */}
        <div
          className={`flex flex-col p-2 rounded-xl border transition-colors ${
            actuators.pDist
              ? "bg-emerald-50/80 border-emerald-200"
              : "bg-slate-50/70 border-slate-200/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-mono uppercase font-bold text-text-muted">
              P-DIST
            </span>
            <span
              className={`w-2 h-2 rounded-full ${actuators.pDist ? "bg-emerald-500 animate-ping" : "bg-amber-400"}`}
            />
          </div>
          <span className="text-[11px] font-bold text-text-primary mt-1 truncate">
            Distribusi
          </span>
          <span
            className={`text-[9.5px] font-mono mt-0.5 ${actuators.pDist ? "text-emerald-700 font-bold" : "text-amber-700 font-semibold"}`}
          >
            {actuators.pDist ? "Irigasi" : "Terkunci"}
          </span>
        </div>
      </div>
    </div>
  );
};
