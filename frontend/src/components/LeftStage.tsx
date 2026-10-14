import React, { useState } from "react";
import { TankPair } from "../types";
import {
  CheckCircle2,
  AlertTriangle,
  Droplets,
  ChevronDown,
  Check,
} from "lucide-react";

interface LeftStageProps {
  tanks: TankPair[];
  activeTank: TankPair;
  onSelectTank: (tank: TankPair) => void;
  onToggleRefill: (tankId: string) => void;
}

export const LeftStage: React.FC<LeftStageProps> = ({
  tanks,
  activeTank,
  onSelectTank,
  onToggleRefill,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const pct1 = Math.min(
    100,
    Math.round((activeTank.currentL1 / activeTank.drum1MaxL) * 100),
  );
  const pct2 = Math.min(
    100,
    Math.round((activeTank.currentL2 / activeTank.drum2MaxL) * 100),
  );

  return (
    <aside className="w-[672px] h-[1080px] max-h-[1080px] flex-shrink-0 bg-gradient-to-b from-[#0B1120] via-[#0F172A] to-[#1E293B] p-8 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute bottom-10 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shadow-lg">
            <Droplets className="w-6 h-6 text-blue-400" />
          </div>
          <span
            className="text-[28px] text-white font-normal italic tracking-normal"
            style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}
          >
            Desanomia
          </span>
        </div>

        {/* Tank Selector Button & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-11 px-4 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 border border-white/10 text-white flex items-center gap-2.5 transition-all backdrop-blur-md shadow-lg"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

            <span className="text-[13px] font-semibold">{activeTank.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-300" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-14 right-0 z-50 min-w-[340px] bg-slate-950/95 border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 space-y-1.5 backdrop-blur-xl">
              <div className="px-3 py-2 border-b border-slate-700/60 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
                  PILIH PASANGAN TANGKI
                </span>
                <span className="text-[11px] bg-blue-500/15 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  5 Slot
                </span>
              </div>
              {tanks.map((tank) => (
                <button
                  key={tank.id}
                  type="button"
                  onClick={() => {
                    onSelectTank(tank);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-3 ${
                    tank.id === activeTank.id
                      ? "bg-blue-600/20 border border-blue-500/40 text-white shadow-xs"
                      : "hover:bg-white/5 border border-transparent text-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        tank.status === "active"
                          ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                          : "bg-slate-500"
                      }`}
                    />

                    <div>
                      <p className="text-[13px] font-semibold">
                        {tank.name}: {tank.cropName}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {tank.currentL2}L / {tank.currentL1}L •{" "}
                        {tank.isRefillConfirmed
                          ? "Terkonfirmasi"
                          : "Belum Refill"}
                      </p>
                    </div>
                  </div>
                  {tank.id === activeTank.id && (
                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="relative z-10 mt-6 mb-2">
        <h1 className="text-white text-[56px] font-bold tracking-tight leading-[1.05] font-display">
          {activeTank.cropName}
        </h1>
        <h3 className="text-slate-400 text-[15px] font-normal leading-snug mt-1.5 font-body">
          {activeTank.name} • 140L Reservoir Nutrisi Dinamis
        </h3>
      </div>

      {/* Center Stage: Silhouette Drum Visuals */}
      <div className="relative z-10 my-auto py-2 flex flex-col items-center justify-center">
        <div className="w-full bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-md shadow-2xl relative">
          <div className="grid grid-cols-12 gap-5 items-end justify-center pt-4 pb-2">
            {/* Drum 1: Konsentrat 20L */}
            <div className="col-span-5 flex flex-col items-center">
              <div className="relative w-36 h-56 rounded-3xl bg-slate-950/80 border-2 border-slate-700/80 overflow-hidden flex flex-col justify-end p-2 shadow-inner">
                {/* Visual Liquid Level */}
                <div
                  className="w-full rounded-2xl bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 transition-all duration-700 opacity-90 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                  style={{ height: `${pct1}%` }}
                />

                <div className="absolute top-3 left-0 right-0 text-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Konsentrat
                  </span>
                  <p className="text-[13px] font-mono font-bold text-amber-300">
                    {activeTank.currentL1} L
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-semibold text-slate-300 mt-2">
                Drum 1 (20L)
              </span>
            </div>

            {/* Drum 2: Distribusi 140L */}
            <div className="col-span-7 flex flex-col items-center">
              <div className="relative w-48 h-64 rounded-3xl bg-slate-950/80 border-2 border-slate-700/80 overflow-hidden flex flex-col justify-end p-2 shadow-inner">
                {/* Visual Liquid Level */}
                <div
                  className="w-full rounded-2xl bg-gradient-to-t from-blue-600 via-sky-500 to-teal-400 transition-all duration-700 opacity-90 shadow-[0_0_25px_rgba(56,189,248,0.4)]"
                  style={{ height: `${pct2}%` }}
                />

                <div className="absolute top-3 left-0 right-0 text-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Reservoir Fertigasi
                  </span>
                  <p className="text-[14px] font-mono font-bold text-sky-300">
                    {activeTank.currentL2} L
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-semibold text-slate-300 mt-2">
                Drum 2 (140L)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stage: Live Volume Cards & Refill Confirmation Button */}
      <div className="relative z-10 grid grid-cols-2 gap-4">
        {/* Drum 1 Volume Card & Mandatory Refill Toggle */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider font-semibold">
              Konsentrat AB
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                activeTank.isRefillConfirmed
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${activeTank.isRefillConfirmed ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}
              />

              {activeTank.isRefillConfirmed ? "Terverifikasi" : "Belum Refill"}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold text-amber-400 font-mono tracking-tight">
              {activeTank.currentL1.toFixed(1)}
            </span>
            <span className="text-[13px] text-slate-400 font-mono font-medium">
              / {activeTank.drum1MaxL} L
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                style={{ width: `${pct1}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-mono text-slate-400">
              <span>Kritis: 3.0 L</span>
              <span className="text-amber-400 font-semibold">{pct1}%</span>
            </div>
          </div>

          {/* Interactive Toggle Button */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => onToggleRefill(activeTank.id)}
              className={`w-full py-2 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                activeTank.isRefillConfirmed
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  : "bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30"
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 ${activeTank.isRefillConfirmed ? "text-emerald-400" : "text-amber-400"}`}
              />

              <span>Konfirmasi Pengisian Penuh (20L + 2kg)</span>
            </button>
            {!activeTank.isRefillConfirmed && (
              <p className="text-[9px] text-amber-400/90 mt-1.5 leading-tight flex items-center gap-1 font-body">
                <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />

                <span>Wajib dikonfirmasi sebelum batch bisa dimulai</span>
              </p>
            )}
          </div>
        </div>

        {/* Drum 2 Volume Card */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider font-semibold">
              Siap Distribusi
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Sensor Radar
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold text-sky-400 font-mono tracking-tight">
              {activeTank.currentL2.toFixed(1)}
            </span>
            <span className="text-[13px] text-slate-400 font-mono font-medium">
              / {activeTank.drum2MaxL} L
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-300"
                style={{ width: `${pct2}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-mono text-slate-400">
              <span>Batas Aman: 20 L</span>
              <span className="text-sky-400 font-semibold">{pct2}%</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10.5px] text-slate-400 flex items-center justify-between font-mono">
            <span>Kuras Manual Fisik:</span>
            <span className="text-emerald-400 font-semibold">Keran Bawah</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
