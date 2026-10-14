import React from "react";
import { FsmState } from "../types";

interface FsmStepperProps {
  currentState: FsmState;
  stepIndex: number;
  totalSteps: number;
  stateDurationSec: number;
  estimatedTotalSec: number;
}

const stateLabels: Record<FsmState, string> = {
  IDLE: "Siaga (Standby)",
  FILLING_WATER: "Mengisi Air Baku",
  CHECK_BASE: "Cek Baseline Air",
  DOSING: "Injeksi Nutrisi A+B",
  MIXING: "Pengadukan Larutan",
  STABILIZING: "Stabilisasi Larutan",
  MEASURING_TDS: "Pengukuran EC/TDS",
  EVAL_GATE: "Evaluasi Gate Kualitas",
  TOPUP_DOSE: "Top-up Defisit Dosis",
  DISTRIBUTING: "Distribusi ke Tanaman",
  BATCH_DEPLETED: "Batch Selesai (Kuras)",
  BATCH_PAUSED_INSPECTION: "Inspeksi / Dijeda",
  FAULT_LATCHED: "Sistem Terkunci (Fault)",
};

export const FsmStepper: React.FC<FsmStepperProps> = ({
  currentState,
  stepIndex,
  totalSteps,
  stateDurationSec,
  estimatedTotalSec,
}) => {
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="bg-surface-card rounded-[24px] p-4 border border-slate-200/80 shadow-[0_4px_16px_rgba(15,23,42,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[16px] font-bold text-text-primary font-display">
          Tahap FSM Proses
        </span>
        <span className="text-[11px] font-mono bg-blue-50 text-primary-container border border-blue-200/70 px-2.5 py-0.5 rounded-full font-bold shadow-xs">
          {currentState}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-3 items-center my-1.5">
        {/* Circular Progress Indicator */}
        <div className="col-span-5 flex items-center justify-center select-none">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 180 180"
            >
              <defs>
                <linearGradient
                  id="fsmArcGradient"
                  x1="0%"
                  x2="100%"
                  y1="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="65%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <circle
                cx="90"
                cy="90"
                fill="none"
                r="66"
                stroke="#E2E8F0"
                strokeDasharray="3.5 3.5"
                strokeWidth="1.5"
              />

              <path
                d="M 90 24 A 66 66 0 0 1 156 90"
                fill="none"
                stroke="url(#fsmArcGradient)"
                strokeLinecap="round"
                strokeWidth="4.5"
              />

              {/* Step dots */}
              <circle cx="90" cy="24" fill="#2563EB" r="4" />
              <circle cx="123" cy="32.8" fill="#2563EB" r="4" />

              <circle cx="147.2" cy="57" fill="#2563EB" r="4" />

              <circle cx="156" cy="90" fill="#2563EB" r="6" />

              <circle cx="147.2" cy="123" fill="#CBD5E1" r="3.5" />

              <circle cx="123" cy="147.2" fill="#CBD5E1" r="3.5" />

              <circle cx="90" cy="156" fill="#CBD5E1" r="3.5" />

              <circle cx="57" cy="147.2" fill="#CBD5E1" r="3.5" />

              <circle cx="32.8" cy="123" fill="#CBD5E1" r="3.5" />

              <circle cx="24" cy="90" fill="#CBD5E1" r="3.5" />

              <circle cx="32.8" cy="57" fill="#CBD5E1" r="3.5" />

              <circle cx="57" cy="32.8" fill="#CBD5E1" r="3.5" />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[8px] font-mono uppercase tracking-wider font-bold text-text-muted leading-none mb-0.5">
                TAHAP
              </span>
              <div className="flex items-baseline justify-center leading-none">
                <span className="text-[22px] font-bold text-text-primary font-mono tracking-tight">
                  {stepIndex}
                </span>
                <span className="text-[12px] font-bold text-text-muted font-mono">
                  /{totalSteps}
                </span>
              </div>
              <span className="mt-0.5 text-[9.5px] font-bold text-primary-container bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-full shadow-xs truncate max-w-[90px]">
                {stateLabels[currentState]}
              </span>
            </div>
          </div>
        </div>

        {/* FSM Metrics */}
        <div className="col-span-7 flex flex-col justify-center gap-1.5">
          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/80">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[7.5px] font-mono uppercase text-text-muted font-bold">
                  WAKTU TAHAP
                </span>
                <span className="font-mono text-[13px] font-bold text-text-primary mt-0.5 block tabular-nums">
                  {formatTime(stateDurationSec)}
                </span>
              </div>
              <div>
                <span className="block text-[7.5px] font-mono uppercase text-text-muted font-bold">
                  ESTIMASI TOTAL
                </span>
                <span className="font-mono text-[13px] font-bold text-text-primary mt-0.5 block tabular-nums">
                  {formatTime(estimatedTotalSec)}
                </span>
              </div>
            </div>
          </div>

          <span className="text-text-muted text-[11px] block truncate px-1">
            Status Otomasi:{" "}
            <strong className="text-emerald-700">Berjalan Nominal</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
