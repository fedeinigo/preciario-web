// src/app/components/features/goals/components/IndividualGoalCard.tsx
"use client";

import React from "react";
import GoalKpi from "./GoalKpi";
import { formatUSD } from "../../proposals/lib/format";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { useTranslations } from "@/app/LanguageProvider";

export default function IndividualGoalCard({
  range,
  myGoal,
  myProgress,
  monthlyProgress,
  onSave,
  onAddManual,
}: {
  range: { from: string; to: string };
  myGoal: number;
  myProgress: number;
  monthlyProgress: number;
  onSave: (amount: number) => Promise<void> | void;
  onAddManual?: () => void;
}) {
  const t = useTranslations("goals.individual");
  const metricsT = useTranslations("goals.individual.metrics");
  const dialogT = useTranslations("goals.individual.dialog");
  const validationT = useTranslations("goals.validation");

  const pct = myGoal > 0 ? (myProgress / myGoal) * 100 : 0;
  const remaining = Math.max(0, myGoal - myProgress);
  const monthlyGoal = myGoal / 3;
  const normalizedPct = Number.isFinite(pct) ? Math.max(0, pct) : 0;
  const barPct = Math.min(100, normalizedPct);
  const monthlyPct = monthlyGoal > 0 ? (monthlyProgress / monthlyGoal) * 100 : 0;
  const normalizedMonthlyPct = Number.isFinite(monthlyPct) ? Math.max(0, monthlyPct) : 0;
  const monthlyBarPct = Math.min(100, normalizedMonthlyPct);
  const monthlyRemaining = Math.max(0, monthlyGoal - monthlyProgress);

  const [open, setOpen] = React.useState(false);
  const [tmp, setTmp] = React.useState<number>(myGoal);
  React.useEffect(() => setTmp(myGoal), [myGoal]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
      <div className="bg-gradient-to-r from-purple-50 to-white px-6 py-5 border-b border-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
              {t("title")}
            </p>
            <h3 className="mt-1.5 text-2xl font-bold text-slate-900">
              {metricsT("goal")}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onAddManual && (
              <button
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200/60 px-4 py-2.5 text-sm font-semibold text-purple-700 shadow-sm shadow-purple-100/50 transition-all hover:shadow-md hover:shadow-purple-200/50 hover:scale-[1.02]"
                onClick={onAddManual}
              >
                {t("manualCta")}
              </button>
            )}
            <button
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]"
              onClick={() => setOpen(true)}
            >
              {t("editCta")}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">{/* Content wrapper */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <GoalKpi label={t("quarterlyGoalLabel")}
            value={formatUSD(myGoal)}
          />
          <GoalKpi label={t("monthlyGoalLabel")} value={formatUSD(monthlyGoal)} />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/50 to-purple-50/30 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-600">{t("progressLabel")}</p>
              <p className="text-2xl font-bold text-emerald-600">{formatUSD(myProgress)}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-sm font-semibold text-slate-600">{t("remainingLabel")}</p>
              <p className="text-2xl font-bold text-amber-600">{formatUSD(remaining)}</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">
                <span>{t("quarterlyBarLabel")}</span>
                <span>{t("completed", { pct: normalizedPct.toFixed(0) })}</span>
              </div>
              <div className="relative h-4 w-full overflow-hidden rounded-xl bg-slate-200/60">
                <div
                  className="absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 shadow-sm"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
                <span>{t("monthlyBarLabel")}</span>
                <span>{t("monthlyCompleted", { pct: normalizedMonthlyPct.toFixed(0) })}</span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-xl bg-slate-200/60">
                <div
                  className="absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 shadow-sm"
                  style={{ width: `${monthlyBarPct}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                <span className="text-emerald-600">
                  {t("monthlyProgressLabel")}: {formatUSD(monthlyProgress)}
                </span>
                <span className="text-amber-600">
                  {t("monthlyRemainingLabel")}: {formatUSD(monthlyRemaining)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end text-xs font-medium text-slate-500">
            <span>{t("period", { from: range.from, to: range.to })}</span>
          </div>
        </div>
      </div>{/* End content wrapper */}

      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={(val) => {
          const num = Number(val);
          if (Number.isFinite(num) && num >= 0) onSave(num);
          setOpen(false);
        }}
        title={dialogT("title")}
        description={<span className="text-sm">{dialogT("description")}</span>}
        inputLabel={dialogT("inputLabel")}
        inputPlaceholder={dialogT("inputPlaceholder")}
        inputDefaultValue={String(tmp)}
        inputRequired
        validateInput={(v) => (Number(v) < 0 ? validationT("nonNegative") : null)}
        confirmText={dialogT("confirm")}
      />
    </div>
  );
}
