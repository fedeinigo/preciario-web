// src/app/components/features/goals/components/IndividualGoalCard.tsx
"use client";

import React from "react";
import GoalKpi from "./GoalKpi";
import ProgressBar from "./ProgressBar";
import { formatUSD } from "../../proposals/lib/format";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { useTranslations } from "@/app/LanguageProvider";

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
  const t = useTranslations("goals.individual");
  const metricsT = useTranslations("goals.individual.metrics");
  const dialogT = useTranslations("goals.individual.dialog");
  const validationT = useTranslations("goals.validation");
  const pct = myGoal > 0 ? (myProgress / myGoal) * 100 : 0;
  const remaining = Math.max(0, myGoal - myProgress);

  const [open, setOpen] = React.useState(false);
  const [tmp, setTmp] = React.useState<number>(myGoal);
  React.useEffect(() => setTmp(myGoal), [myGoal]);

  return (
    <div className="rounded-2xl border bg-white shadow-md overflow-hidden flex flex-col h-full">
      <div className="px-4 h-12 flex items-center text-white font-semibold bg-[#4c1d95]">
        {t("title")}
      </div>

      <div className="p-4 space-y-4 flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GoalKpi label={metricsT("goal")} value={formatUSD(myGoal)} />
          <GoalKpi label={metricsT("progress")} value={formatUSD(myProgress)} />
          <GoalKpi label={metricsT("remaining")} value={formatUSD(remaining)} />
          <GoalKpi label={metricsT("pct")} value={`${(myGoal ? (myProgress / myGoal) * 100 : 0).toFixed(1)}%`} />
        </div>

        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-gray-600 mb-1">{t("progressTitle", { year, quarter })}</div>
          <ProgressBar pct={pct} height={12} title={`${pct.toFixed(1)}%`} />
          <div className="text-xs text-gray-600 mt-1">{t("period", { from: range.from, to: range.to })}</div>
        </div>

        <div>
          <button
            className="btn-bar"
            onClick={() => setOpen(true)}
          >
            {t("editCta")}
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
