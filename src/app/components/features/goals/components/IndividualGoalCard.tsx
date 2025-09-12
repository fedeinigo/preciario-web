// src/app/components/features/goals/components/IndividualGoalCard.tsx
"use client";

import React from "react";
import GoalKpi from "./GoalKpi";
import ProgressBar from "./ProgressBar";
import { formatUSD } from "../../proposals/lib/format";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";

export default function IndividualGoalCard({
  year,
  quarter,
  range,
  myGoal,
  myProgress,
  onSave,
}: {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  range: { from: string; to: string };
  myGoal: number;
  myProgress: number;
  onSave: (amount: number) => Promise<void> | void;
}) {
  const pct = myGoal > 0 ? (myProgress / myGoal) * 100 : 0;
  const remaining = Math.max(0, myGoal - myProgress);

  const [open, setOpen] = React.useState(false);
  const [tmp, setTmp] = React.useState<number>(myGoal);
  React.useEffect(() => setTmp(myGoal), [myGoal]);

  return (
    <div className="rounded-2xl border bg-white shadow-md overflow-hidden flex flex-col h-full">
      <div className="px-4 h-12 flex items-center text-white font-semibold bg-[#4c1d95]">
        Objetivo individual
      </div>

      <div className="p-4 space-y-4 flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GoalKpi label="Objetivo" value={formatUSD(myGoal)} />
          <GoalKpi label="Avance (WON)" value={formatUSD(myProgress)} />
          <GoalKpi label="Faltante" value={formatUSD(remaining)} />
          <GoalKpi label="% Cumplimiento" value={`${(myGoal ? (myProgress / myGoal) * 100 : 0).toFixed(1)}%`} />
        </div>

        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-gray-600 mb-1">
            Progreso del trimestre {year} — Q{quarter}
          </div>
          <ProgressBar pct={pct} height={12} title={`${pct.toFixed(1)}%`} />
          <div className="text-xs text-gray-600 mt-1">
            Periodo: {range.from} — {range.to}
          </div>
        </div>

        <div>
          <button 
            className="btn-bar"
            onClick={() => setOpen(true)}
          >
            Editar mi objetivo
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={(val) => {
          const num = Number(val);
          if (Number.isFinite(num) && num >= 0) onSave(num);
          setOpen(false);
        }}
        title="Editar objetivo personal"
        description={<span className="text-sm">Ingresa el objetivo del trimestre en USD.</span>}
        inputLabel="Monto (USD)"
        inputPlaceholder="Ej: 5000"
        inputDefaultValue={String(tmp)}
        inputRequired
        validateInput={(v) => (Number(v) < 0 ? "Debe ser ≥ 0" : null)}
        confirmText="Guardar"
      />
    </div>
  );
}
