"use client";

import React from "react";

type Props = {
  goal: number;
  progress: number;
  handoffTotal: number;
  pendingHandoff: number;
  theme?: "direct" | "mapache";
};

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function BonusCalculatorCard({
  goal,
  progress,
  handoffTotal,
  pendingHandoff,
  theme = "direct",
}: Props) {
  const [netSalaryInput, setNetSalaryInput] = React.useState<string>("");

  const netSalary = React.useMemo(() => {
    const parsed = Number(netSalaryInput.replace(/[^0-9.,-]/g, "").replace(/,/g, "."));
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
  }, [netSalaryInput]);

  const completionPct = goal > 0 ? progress / goal : 0;
  const handoffPct = goal > 0 ? handoffTotal / goal : 0;

  const totalBonus = netSalary * completionPct;
  const totalPayout = netSalary + totalBonus;

  const handoffBonus = netSalary * handoffPct;
  const handoffPayout = netSalary + handoffBonus;

  const pendingBonus = Math.max(0, totalPayout - handoffPayout);
  const pendingPct = Math.max(0, completionPct - handoffPct);

  const isMapache = theme === "mapache";

  const cardClass = isMapache
    ? "mapache-surface-card rounded-3xl border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
    : "bg-white rounded-3xl border border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.08)]";

  const labelClass = isMapache ? "text-sm text-white/70" : "text-sm text-slate-600";
  const titleClass = isMapache ? "text-2xl font-semibold text-white" : "text-2xl font-semibold text-slate-900";
  const pillClass = isMapache
    ? "inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 border border-white/15"
    : "inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800 border border-purple-100";
  const valueClass = isMapache ? "text-xl font-semibold text-white" : "text-xl font-semibold text-slate-900";
  const mutedValueClass = isMapache ? "text-sm font-medium text-white/80" : "text-sm font-medium text-slate-600";
  const inputContainerClass = isMapache
    ? "mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-inner backdrop-blur-sm text-white"
    : "mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-inner text-slate-900";
  const inputClass = isMapache
    ? "w-full bg-transparent text-white placeholder:text-white/40 focus:outline-none text-lg font-semibold"
    : "w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-lg font-semibold";
  const totalHighlightClass = isMapache
    ? "text-2xl font-bold text-white"
    : "text-2xl font-bold text-purple-800";
  const handoffHighlightClass = isMapache
    ? "text-2xl font-bold text-emerald-100"
    : "text-2xl font-bold text-emerald-700";

  return (
    <div className={cardClass}>
      <div
        className={
          isMapache
            ? "flex flex-col gap-6 bg-gradient-to-br from-[#0f0f17] via-[#131322] to-[#17172a] p-6 sm:p-8"
            : "flex flex-col gap-6 bg-gradient-to-br from-white via-purple-50/40 to-white p-6 sm:p-8"
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={labelClass}>Planificá tu cierre</p>
            <h2 className={titleClass}>Calculadora de Bono</h2>
            <p className={labelClass}>
              La información se calcula en tu navegador y no se guarda ni se envía a la base de datos.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <label className={labelClass} htmlFor="net-salary">
              Sueldo neto mensual
            </label>
            <div className={inputContainerClass}>
              <span className={isMapache ? "text-sm font-semibold text-white/80" : "text-sm font-semibold text-slate-600"}>$</span>
              <input
                id="net-salary"
                inputMode="decimal"
                className={inputClass}
                placeholder="Ingresá tu sueldo"
                value={netSalaryInput}
                onChange={(e) => setNetSalaryInput(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div
            className={
              isMapache
                ? "rounded-2xl border border-white/10 bg-white/5 p-4"
                : "rounded-2xl border border-purple-100 bg-purple-50/60 p-4"
            }
          >
            <div className="flex items-center justify-between">
              <p className={labelClass}>Ventas del trimestre</p>
              <span className={pillClass}>{goal > 0 ? `${(completionPct * 100).toFixed(1)}%` : "0%"}</span>
            </div>
            <p className={valueClass}>{currency.format(progress)}</p>
            <p className={mutedValueClass}>Objetivo: {currency.format(goal)}</p>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className={labelClass}>Sueldo base</span>
                <span className={valueClass}>{currency.format(netSalary)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={labelClass}>Bono por ventas ({(completionPct * 100).toFixed(1)}%)</span>
                <span className={valueClass}>{currency.format(totalBonus)}</span>
              </div>
            </div>
            <div
              className={
                isMapache
                  ? "mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  : "mt-4 flex items-center justify-between rounded-xl border border-purple-100 bg-white px-4 py-3"
              }
            >
              <span className={valueClass}>Cobro estimado</span>
              <span className={totalHighlightClass}>{currency.format(totalPayout)}</span>
            </div>
          </div>

          <div
            className={
              isMapache
                ? "rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4"
                : "rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
            }
          >
            <div className="flex items-center justify-between">
              <p className={labelClass}>Handoff completados</p>
              <span className={pillClass}>{goal > 0 ? `${(handoffPct * 100).toFixed(1)}%` : "0%"}</span>
            </div>
            <p className={valueClass}>{currency.format(handoffTotal)}</p>
            <p className={mutedValueClass}>Incluye solo los handoff marcados como listos</p>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className={labelClass}>Sueldo base</span>
                <span className={valueClass}>{currency.format(netSalary)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={labelClass}>Bono por handoff ({(handoffPct * 100).toFixed(1)}%)</span>
                <span className={valueClass}>{currency.format(handoffBonus)}</span>
              </div>
            </div>
            <div
              className={
                isMapache
                  ? "mt-4 flex items-center justify-between rounded-xl border border-emerald-200/40 bg-emerald-200/20 px-4 py-3"
                  : "mt-4 flex items-center justify-between rounded-xl border border-emerald-200/60 bg-emerald-100 px-4 py-3"
              }
            >
              <span className={valueClass}>Cobro con handoff</span>
              <span className={handoffHighlightClass}>{currency.format(handoffPayout)}</span>
            </div>
          </div>

          <div
            className={
              isMapache
                ? "rounded-2xl border border-amber-200/20 bg-amber-400/10 p-4"
                : "rounded-2xl border border-amber-100 bg-amber-50 p-4"
            }
          >
            <div className="flex items-center justify-between">
              <p className={labelClass}>Pendiente por handoff</p>
              <span className={pillClass}>{goal > 0 ? `${(pendingPct * 100).toFixed(1)}%` : "0%"}</span>
            </div>
            <p className={valueClass}>{currency.format(pendingHandoff)}</p>
            <p className={mutedValueClass}>Monto aún no cobrado por handoff pendientes</p>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className={labelClass}>Bono pendiente</span>
                <span className={valueClass}>{currency.format(pendingBonus)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={labelClass}>Objetivo restante</span>
                <span className={valueClass}>{currency.format(Math.max(0, goal - handoffTotal))}</span>
              </div>
            </div>
            <div
              className={
                isMapache
                  ? "mt-4 rounded-xl border border-amber-200/20 bg-amber-300/15 px-4 py-3 text-sm font-semibold text-amber-100"
                  : "mt-4 rounded-xl border border-amber-200/60 bg-amber-200/30 px-4 py-3 text-sm font-semibold text-amber-900"
              }
            >
              Acelerá tus handoff para capturar el bono pendiente.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
