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
  onSave,
  onAddManual,
}: {
  range: { from: string; to: string };
  myGoal: number;
  myProgress: number;
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
  const monthlyPct = myGoal > 0 ? (monthlyGoal / myGoal) * 100 : 33.333;

  const [open, setOpen] = React.useState(false);
  const [tmp, setTmp] = React.useState<number>(myGoal);
  React.useEffect(() => setTmp(myGoal), [myGoal]);

  const normalizedPct = Number.isFinite(pct) ? Math.max(0, pct) : 0;
  const barPct = Math.min(100, normalizedPct);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#eadeff] bg-gradient-to-br from-white via-white to-[#f7f2ff] p-6 shadow-[0_24px_60px_rgba(79,29,149,0.12)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7c3aed]">
            {t("title")}
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-[#2f0f5d]">
            {metricsT("goal")}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onAddManual && (
            <button
              className="inline-flex items-center justify-center rounded-full border border-[#c4b5fd] bg-white px-4 py-2 text-sm font-semibold text-[#4c1d95] shadow-sm transition hover:border-[#a78bfa] hover:text-[#3c0d7a]"
              onClick={onAddManual}
            >
              {t("manualCta")}
            </button>
          )}
          <button
            className="inline-flex items-center justify-center rounded-full border border-[#c4b5fd] bg-white px-4 py-2 text-sm font-semibold text-[#4c1d95] shadow-sm transition hover:border-[#a78bfa] hover:text-[#3c0d7a]"
            onClick={() => setOpen(true)}
          >
            {t("editCta")}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <GoalKpi label={t("quarterlyGoalLabel")}
          value={formatUSD(myGoal)}
        />
        <GoalKpi label={t("monthlyGoalLabel")} value={formatUSD(monthlyGoal)} />
      </div>

      <div className="mt-6 rounded-3xl border border-[#efe7ff] bg-white/80 p-5 shadow-inner">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#5b21b6]">{t("progressLabel")}</p>
            <p className="text-xl font-semibold text-[#047857]">{formatUSD(myProgress)}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm font-medium text-[#a16207]">{t("remainingLabel")}</p>
            <p className="text-xl font-semibold text-[#b45309]">{formatUSD(remaining)}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#ede9fe]">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#c084fc] via-[#a855f7] to-[#7c3aed]"
              style={{ width: `${barPct}%` }}
            />
            {myGoal > 0 && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-[#fbbf24]"
                style={{ left: `calc(${Math.min(100, Math.max(0, monthlyPct))}% - 1px)` }}
              />
            )}
            <div className="absolute inset-0 flex">
              <div className="h-full w-1/3 border-r border-white/40" />
              <div className="h-full w-1/3 border-r border-white/40" />
              <div className="h-full w-1/3" />
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs font-semibold uppercase tracking-wide text-[#7c3aed]">
            <span>{t("monthLabel", { month: 1 })}</span>
            <span>{t("monthLabel", { month: 2 })}</span>
            <span>{t("monthLabel", { month: 3 })}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[#5b21b6]">
          <span className="font-semibold text-[#6d28d9]">
            {t("completed", { pct: Math.min(100, normalizedPct).toFixed(0) })}
          </span>
          <span className="text-xs text-[#7c3aed]">
            {t("period", { from: range.from, to: range.to })}
          </span>
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
