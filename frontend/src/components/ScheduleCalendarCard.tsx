import React from "react";
import { ScheduleItem } from "../types";
import { Calendar, CalendarDays, CheckCircle2 } from "lucide-react";

interface ScheduleCalendarCardProps {
  schedules: ScheduleItem[];
  onOpenScheduleModal: () => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
}

export const ScheduleCalendarCard: React.FC<ScheduleCalendarCardProps> = ({
  schedules,
  onOpenScheduleModal,
  onSelectDate,
  selectedDate,
}) => {
  // Generate 7 days starting from today (2026-10-14)
  const today = new Date("2026-10-14T00:00:00");
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const dayName = dayNames[d.getDay()];
    const dayNum = String(d.getDate()).padStart(2, "0");
    const hasSchedule = schedules.some((s) => s.date === dateStr);
    return { dateStr, dayName, dayNum, hasSchedule, isToday: i === 0 };
  });

  // Filter schedules for preview
  const upcomingSchedules = schedules.slice(0, 2);

  return (
    <div className="bg-surface-card rounded-[24px] p-4 border border-slate-200/80 shadow-[0_4px_16px_rgba(15,23,42,0.03)] flex flex-col justify-between flex-1 min-h-0">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-primary-container">
            <CalendarDays className="w-4 h-4 text-primary-container" />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-text-primary leading-tight">
              Jadwal & Kalender Otomatis
            </h4>
            <p className="text-[11px] text-text-muted font-body">
              7 Hari Kedepan • WIB
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenScheduleModal}
          className="px-3.5 py-1.5 rounded-full text-[11px] font-bold text-primary-container bg-blue-50 hover:bg-blue-100/80 border border-blue-200/70 transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Buka Kalender Lengkap</span>
        </button>
      </div>

      {/* 7-Day Mini Strip */}
      <div className="grid grid-cols-7 gap-1.5 my-2">
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDate;
          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              className={`flex flex-col items-center py-2 rounded-xl transition-all border ${
                isSelected
                  ? "bg-primary-container text-white border-primary-container shadow-sm"
                  : item.isToday
                    ? "bg-blue-50 text-primary-container border-blue-200"
                    : "bg-slate-50/70 hover:bg-slate-100 border-slate-200/60 text-text-secondary"
              }`}
            >
              <span
                className={`text-[9px] uppercase font-bold ${isSelected ? "text-blue-100" : "text-text-muted"}`}
              >
                {item.dayName}
              </span>
              <span className="text-[13px] font-mono font-bold mt-0.5">
                {item.dayNum}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full mt-1 ${
                  isSelected
                    ? "bg-white"
                    : item.hasSchedule
                      ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                      : "bg-slate-300"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Upcoming Queue Items */}
      <div className="space-y-1.5">
        {upcomingSchedules.length === 0 ? (
          <div className="p-3 bg-slate-50 rounded-xl text-center text-text-muted text-[11.5px]">
            Belum ada jadwal fertigasi terdaftar. Klik 'Buka Kalender Lengkap'
            untuk menjadwalkan.
          </div>
        ) : (
          upcomingSchedules.map((sch) => (
            <div
              key={sch.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[12px] font-bold text-primary-container bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded">
                  {sch.time}
                </span>
                <div>
                  <p className="text-[12px] font-bold text-text-primary leading-tight">
                    {sch.recipeName}
                  </p>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">
                    Tanggal {sch.date} • Volume {sch.volumeL} L
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Siap
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
