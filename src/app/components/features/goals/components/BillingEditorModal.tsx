// src/app/components/features/goals/components/BillingEditorModal.tsx
"use client";

import React from "react";
import { X, DollarSign } from "lucide-react";
import type { UserWonDeal } from "./BillingSummaryCard";

type Props = {
  deal: UserWonDeal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (billedAmount: number) => Promise<void>;
  theme?: "direct" | "mapache";
};

export default function BillingEditorModal({ deal, isOpen, onClose, onSave, theme = "direct" }: Props) {
  const [billedAmount, setBilledAmount] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (deal) {
      setBilledAmount(String(deal.billedAmount || 0));
      setError("");
    }
  }, [deal]);

  if (!isOpen || !deal) return null;

  const handleSave = async () => {
    const amount = Number(billedAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Ingresa un monto válido (mayor o igual a 0)");
      return;
    }
    if (amount > deal.monthlyFee) {
      setError("El monto facturado no puede ser mayor a la mensualidad");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await onSave(amount);
      onClose();
    } catch {
      setError("Error al guardar. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const pendingAmount = deal.monthlyFee - Number(billedAmount || 0);
  const billingPct = deal.monthlyFee > 0 ? (Number(billedAmount || 0) / deal.monthlyFee) * 100 : 0;

  const isMapache = theme === "mapache";
  const overlayClass = isMapache
    ? "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    : "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4";
  const containerClass = isMapache
    ? "rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1426] via-[#0c1020] to-[#0a0d16] text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)] max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
    : "bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200";
  const headerClass = isMapache
    ? "bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#22d3ee] px-6 py-5 flex items-center justify-between"
    : "bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 flex items-center justify-between";
  const headerIconClass = isMapache
    ? "h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
    : "h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center";
  const headerTitleClass = isMapache ? "text-lg font-bold text-white" : "text-lg font-bold text-white";
  const headerSubtitleClass = isMapache ? "text-sm text-white/80" : "text-sm text-purple-100";
  const closeButtonClass = isMapache
    ? "h-8 w-8 rounded-lg bg-white/15 hover:bg-white/25 transition flex items-center justify-center"
    : "h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center justify-center";
  const infoCardClass = isMapache
    ? "grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
    : "grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl";
  const labelClass = isMapache
    ? "text-xs font-semibold text-white/60 uppercase tracking-wider mb-1"
    : "text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1";
  const valuePrimary = isMapache ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900";
  const valueHighlight = isMapache ? "text-lg font-bold text-emerald-300" : "text-lg font-bold text-emerald-600";
  const inputLabelClass = isMapache
    ? "block text-sm font-semibold text-white mb-2"
    : "block text-sm font-semibold text-slate-700 mb-2";
  const inputPrefixClass = isMapache
    ? "absolute left-4 top-1/2 -translate-y-1/2 text-white/70 font-semibold"
    : "absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold";
  const inputClass = isMapache
    ? "w-full pl-8 pr-4 py-3 border border-white/15 bg-white/5 text-lg font-semibold text-white placeholder-white/40 rounded-2xl focus:border-[#a78bfa] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/30 transition"
    : "w-full pl-8 pr-4 py-3 border-2 border-slate-200 rounded-2xl text-lg font-semibold focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition";
  const previewCardClass = isMapache
    ? "p-4 bg-gradient-to-br from-white/5 via-[#0f162c] to-[#0b1024] rounded-2xl border border-white/10 space-y-3"
    : "p-4 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl border border-slate-100 space-y-3";
  const previewLabel = isMapache
    ? "text-sm font-semibold text-white/70"
    : "text-sm font-semibold text-slate-600";
  const previewValuePending = isMapache ? "text-lg font-bold text-amber-300" : "text-lg font-bold text-amber-600";
  const previewValueProgress = isMapache ? "text-lg font-bold text-[#a78bfa]" : "text-lg font-bold text-purple-600";
  const barTrackClass = isMapache ? "relative h-3 w-full overflow-hidden rounded-xl bg-white/10" : "relative h-3 w-full overflow-hidden rounded-xl bg-slate-200";
  const barFillClass = isMapache
    ? "absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-[#22d3ee] via-[#8b5cf6] to-[#c084fc] transition-all duration-300"
    : "absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 transition-all duration-300";
  const footerClass = isMapache
    ? "px-6 py-4 bg-white/5 border-t border-white/10 flex gap-3 justify-end"
    : "px-6 py-4 bg-slate-50 flex gap-3 justify-end";
  const cancelButtonClass = isMapache
    ? "px-5 py-2.5 rounded-2xl border border-white/15 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
    : "px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50";
  const saveButtonClass = isMapache
    ? "px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#22d3ee] text-sm font-semibold text-white shadow-lg shadow-[#8b5cf6]/30 hover:shadow-xl hover:shadow-[#8b5cf6]/40 transition disabled:opacity-50"
    : "px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition disabled:opacity-50";

  return (
    <div className={overlayClass}>
      <div className={containerClass}>
        {/* Header */}
        <div className={headerClass}>
          <div className="flex items-center gap-3">
            <div className={headerIconClass}>
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className={headerTitleClass}>Editar Facturación</h2>
              <p className={headerSubtitleClass}>{deal.companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={closeButtonClass}
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Current Info */}
          <div className={infoCardClass}>
            <div>
              <p className={labelClass}>Mensualidad</p>
              <p className={valuePrimary}>${deal.monthlyFee.toLocaleString()}</p>
            </div>
            <div>
              <p className={labelClass}>Actual Facturado</p>
              <p className={valueHighlight}>${deal.billedAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Input */}
          <div>
            <label className={inputLabelClass}>Nuevo Monto Facturado</label>
            <div className="relative">
              <div className={inputPrefixClass}>$</div>
              <input
                type="number"
                min="0"
                max={deal.monthlyFee}
                step="0.01"
                value={billedAmount}
                onChange={(e) => {
                  setBilledAmount(e.target.value);
                  setError("");
                }}
                className={inputClass}
                placeholder="0.00"
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-2 text-sm font-medium text-rose-500">{error}</p>
            )}
          </div>

          {/* Preview */}
          <div className={previewCardClass}>
            <div className="flex items-center justify-between text-sm">
              <span className={previewLabel}>Pendiente:</span>
              <span className={previewValuePending}>${Math.max(0, pendingAmount).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={previewLabel}>Progreso:</span>
              <span className={previewValueProgress}>{billingPct.toFixed(1)}%</span>
            </div>
            <div className={barTrackClass}>
              <div className={barFillClass} style={{ width: `${Math.min(100, Math.max(0, billingPct))}%` }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={footerClass}>
          <button
            onClick={onClose}
            disabled={isSaving}
            className={cancelButtonClass}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={saveButtonClass}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
