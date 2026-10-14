import React from "react";
import { Recipe } from "../types";
import { ReceiptText, Plus, ListFilter } from "lucide-react";

interface ActiveRecipeCardProps {
  recipe?: Recipe;
  tankName: string;
  onOpenCreateModal: () => void;
  onOpenListModal: () => void;
}

export const ActiveRecipeCard: React.FC<ActiveRecipeCardProps> = ({
  recipe,
  tankName,
  onOpenCreateModal,
  onOpenListModal,
}) => {
  if (!recipe) {
    return (
      <div className="bg-surface-card rounded-[24px] p-5 border-2 border-dashed border-slate-200 shadow-sm flex flex-col items-center justify-center text-center py-6">
        <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center text-primary-container mb-2">
          <ReceiptText className="w-6 h-6 text-primary-container" />
        </div>
        <h4 className="text-[16px] font-bold text-text-primary">
          Belum Ada Resep Aktif
        </h4>
        <p className="text-[12px] text-text-secondary max-w-sm mt-1">
          {tankName} belum memiliki formula nutrisi yang aktif. Sistem tidak
          dapat menjalankan batch tanpa resep terpilih.
        </p>
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-5 py-2 rounded-full text-[13px] font-bold text-white bg-primary-container hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Resep Baru</span>
          </button>
          <button
            type="button"
            onClick={onOpenListModal}
            className="px-4 py-2 rounded-full text-[13px] font-semibold text-text-secondary hover:text-text-primary bg-slate-100 hover:bg-slate-200/80 transition-colors flex items-center gap-1.5"
          >
            <ListFilter className="w-4 h-4" />
            <span>Pilih dari Daftar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-card rounded-[24px] p-4 border border-slate-200/80 shadow-[0_4px_16px_rgba(15,23,42,0.03)] flex flex-col justify-between">
      {/* Header Info & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-primary-container shadow-xs">
            <ReceiptText className="w-5 h-5 text-primary-container" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[16px] font-bold text-text-primary leading-tight">
                {recipe.name}
              </h4>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-bold">
                Aktif
              </span>
            </div>
            <p className="text-[11.5px] text-text-secondary font-body mt-0.5">
              Formula khusus {tankName} • Siap Dosis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenListModal}
            className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-text-secondary hover:text-text-primary bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Daftar Resep</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-3.5 py-1.5 rounded-full text-[12px] font-bold text-white bg-primary-container hover:bg-blue-700 transition-all flex items-center gap-1 shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Resep</span>
          </button>
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-4 gap-2.5 mt-3 pt-2.5 border-t border-slate-100">
        <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60">
          <span className="text-[8.5px] uppercase font-mono text-text-muted font-bold block">
            TARGET PPM
          </span>
          <span className="text-[14px] font-mono font-bold text-primary-container mt-0.5 block">
            {recipe.targetPpm} ± {recipe.tolerancePpm} ppm
          </span>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60">
          <span className="text-[8.5px] uppercase font-mono text-text-muted font-bold block">
            RASIO AB MIX
          </span>
          <span className="text-[14px] font-mono font-bold text-text-primary mt-0.5 block">
            {recipe.ratioA_mL} : {recipe.ratioB_mL} mL/L
          </span>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60">
          <span className="text-[8.5px] uppercase font-mono text-text-muted font-bold block">
            RENTANG PH
          </span>
          <span className="text-[14px] font-mono font-bold text-emerald-700 mt-0.5 block">
            {recipe.phMin} - {recipe.phMax}
          </span>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60 flex flex-col justify-between">
          <span className="text-[8.5px] uppercase font-mono text-text-muted font-bold block">
            TAG NUTRISI
          </span>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9.5px] font-semibold bg-blue-100/70 text-blue-800 px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
