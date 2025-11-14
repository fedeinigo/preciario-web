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
};

export default function BillingEditorModal({ deal, isOpen, onClose, onSave }: Props) {
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
    } catch (err) {
      setError("Error al guardar. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const pendingAmount = deal.monthlyFee - Number(billedAmount || 0);
  const billingPct = deal.monthlyFee > 0 ? (Number(billedAmount || 0) / deal.monthlyFee) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Editar Facturación</h2>
              <p className="text-sm text-purple-100">{deal.companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Current Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Mensualidad</p>
              <p className="text-lg font-bold text-slate-900">${deal.monthlyFee.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Actual Facturado</p>
              <p className="text-lg font-bold text-emerald-600">${deal.billedAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nuevo Monto Facturado
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</div>
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
                className="w-full pl-8 pr-4 py-3 border-2 border-slate-200 rounded-2xl text-lg font-semibold focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                placeholder="0.00"
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>
            )}
          </div>

          {/* Preview */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600">Pendiente:</span>
              <span className="font-bold text-amber-600">${Math.max(0, pendingAmount).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600">Progreso:</span>
              <span className="font-bold text-purple-600">{billingPct.toFixed(1)}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-xl bg-slate-200">
              <div
                className="absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, billingPct))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
