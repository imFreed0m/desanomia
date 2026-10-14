import React from "react";
import { Play, Lock, AlertTriangle } from "lucide-react";

interface HeroTdsCardProps {
  currentPpm: number;
  temperatureC: number;
  targetPpm: number;
  tolerancePpm: number;
  isRefillConfirmed: boolean;
  hasActiveRecipe: boolean;
  onStartBatch: () => void;
  onOpenRecipeModal: () => void;
}

export const HeroTdsCard: React.FC<HeroTdsCardProps> = ({
  currentPpm,
  temperatureC,
  targetPpm,
  tolerancePpm,
  isRefillConfirmed,
  hasActiveRecipe,
  onStartBatch,
  onOpenRecipeModal,
}) => {
  const isLocked = !isRefillConfirmed || !hasActiveRecipe;
  const minGate = targetPpm - tolerancePpm;
  const maxGate = targetPpm + tolerancePpm;
  const isInTolerance = currentPpm >= minGate && currentPpm <= maxGate;

  return (
    <div className="bg-surface-card rounded-[26px] p-5 border border-slate-200/80 shadow-[0_8px_24px_-6px_rgba(15,23,42,0.04)] flex flex-col justify-between overflow-hidden">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[17px] text-text-primary font-bold tracking-tight font-display">
              EC / TDS Nutrisi
            </span>
            <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-container">
              <span className="text-[12px] font-bold">EC</span>
            </span>
          </div>
          <p className="text-[12px] text-text-secondary mt-0.5 font-body">
            Sensor probe DFRobot v2 • Batch Dinamis
          </p>
        </div>

        {/* Temperature Badge */}
        <div className="flex items-center gap-1.5 bg-accent-blue-subtle border border-blue-200/60 px-3.5 py-1.5 rounded-full shadow-xs">
          <span className="text-[14px]">🌡️</span>
          <span className="font-mono text-[13px] text-primary-container font-bold">
            {temperatureC.toFixed(1)}°C
          </span>
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline justify-between mt-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[54px] font-bold text-text-primary tracking-tight leading-none">
              {currentPpm}
            </span>
            <span className="text-[20px] text-text-secondary font-semibold font-display">
              ppm
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                isInTolerance
                  ? "bg-emerald-50 border border-emerald-200/80 text-emerald-800"
                  : "bg-amber-50 border border-amber-200/80 text-amber-800"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isInTolerance ? "bg-emerald-500" : "bg-amber-500"}`}
              />
              Target: {targetPpm} ± {tolerancePpm} ppm ({minGate} - {maxGate})
            </span>
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              • Diperbarui 1.0 Hz
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-primary-container bg-blue-50 border border-blue-200/70 px-2.5 py-1 rounded-full font-bold inline-block">
            Batas Kualitas Air
          </span>
          <span className="text-[11px] text-text-muted font-mono block mt-1">
            Status: {isInTolerance ? "Dalam Toleransi" : "Perlu Dosing"}
          </span>
        </div>
      </div>

      {/* Wave Visualization (SVG) */}
      <div className="w-full select-none relative my-2">
        <svg
          className="w-full h-24 overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 540 100"
        >
          <defs>
            <linearGradient
              id="scandiWaveGradient"
              x1="0%"
              x2="0%"
              y1="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />

              <stop offset="60%" stopColor="#93C5FD" stopOpacity="0.10" />

              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGlow" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="70%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
          <line
            stroke="#E2E8F0"
            strokeDasharray="3,3"
            strokeWidth="1"
            x1="0"
            x2="540"
            y1="25"
            y2="25"
          />

          <line
            stroke="#E2E8F0"
            strokeDasharray="3,3"
            strokeWidth="1"
            x1="0"
            x2="540"
            y1="60"
            y2="60"
          />

          <path
            d="M 0,65 C 40,70 70,50 110,55 C 145,60 175,80 215,70 C 255,60 270,72 310,65 C 350,60 380,48 420,42 C 460,36 495,26 540,24 L 540,100 L 0,100 Z"
            fill="url(#scandiWaveGradient)"
          />

          <path
            d="M 0,65 C 40,70 70,50 110,55 C 145,60 175,80 215,70 C 255,60 270,72 310,65 C 350,60 380,48 420,42 C 460,36 495,26 540,24"
            fill="none"
            stroke="url(#lineGlow)"
            strokeLinecap="round"
            strokeWidth="3"
          />

          <circle
            cx="540"
            cy="24"
            fill="#FFFFFF"
            r="6"
            stroke="#F97316"
            strokeWidth="3"
          />

          <circle cx="540" cy="24" fill="#F97316" r="3" />
          <circle
            cx="110"
            cy="55"
            fill="#FFFFFF"
            r="4"
            stroke="#2563EB"
            strokeWidth="2.5"
          />
        </svg>
        <div className="flex items-center justify-between text-text-muted font-mono text-[11px] pt-1 px-1">
          <span>06:00 WIB</span>
          <span>08:00 WIB</span>
          <span>10:00 WIB</span>
          <span>12:00 WIB</span>
          <span className="text-text-primary font-bold">Saat Ini</span>
        </div>
      </div>

      {/* Control Buttons & Safety Interlock Banner */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isLocked}
            onClick={onStartBatch}
            className={`font-semibold text-[14px] px-6 py-3 rounded-full transition-all flex items-center gap-2 shadow-sm ${
              isLocked
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-primary-container hover:bg-blue-700 text-white shadow-md active:scale-95"
            }`}
          >
            {isLocked ? (
              <Lock className="w-4 h-4 text-slate-400" />
            ) : (
              <Play className="w-4 h-4 text-white fill-white" />
            )}
            <span>
              {isLocked ? "Mulai Batch (Terkunci)" : "Mulai Batch Sekarang"}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenRecipeModal}
            className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-text-primary font-semibold text-[13px] px-4 py-3 rounded-full transition-colors flex items-center gap-1.5"
          >
            <span>Detail Formula</span>
          </button>
        </div>

        {/* Safety Interlock Message */}
        {isLocked && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />

            <span>
              {!isRefillConfirmed && !hasActiveRecipe
                ? "Interlock: Verifikasi Refill & Pilih Resep Dulu"
                : !isRefillConfirmed
                  ? "Interlock: Konfirmasi Refill Konsentrat Diperlukan"
                  : "Interlock: Pilih/Buat Resep Aktif Terlebih Dahulu"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
