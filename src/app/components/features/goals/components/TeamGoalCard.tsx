// src/app/components/features/goals/components/TeamGoalCard.tsx
"use client";

import React from "react";
import GoalKpi from "./GoalKpi";
import { formatUSD } from "../../proposals/lib/format";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { useTranslations } from "@/app/LanguageProvider";

export default function TeamGoalCard({
  year,
  quarter,
  isSuperAdmin,
  role,
  allTeams,
  effectiveTeam,
  onChangeTeam,
  teamGoal,
  teamProgress,
  sumMembersGoal,
  onSaveTeamGoal,
}: {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  isSuperAdmin: boolean;
  role: string;
  allTeams: string[];
  effectiveTeam: string;
  onChangeTeam: (t: string) => void;
  teamGoal: number;
  teamProgress: number;
  sumMembersGoal: number;
  onSaveTeamGoal: (amount: number) => Promise<void> | void;
}) {
  const t = useTranslations("goals.team");
  const metricsT = useTranslations("goals.team.metrics");
  const dialogT = useTranslations("goals.team.dialog");
  const validationT = useTranslations("goals.validation");
  const emptyT = useTranslations("goals.team.empty");
  const pct = teamGoal > 0 ? (teamProgress / teamGoal) * 100 : 0;
  const remaining = Math.max(0, teamGoal - teamProgress);
  const delta = sumMembersGoal - teamGoal;
  const monthlyPct = teamGoal > 0 ? ((teamGoal / 3) / teamGoal) * 100 : 33.333;

  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#eadeff] bg-gradient-to-br from-white via-white to-[#f4f0ff] p-6 shadow-[0_24px_60px_rgba(79,29,149,0.12)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7c3aed]">{t("title")}</p>
          <h3 className="mt-1 text-2xl font-semibold text-[#2f0f5d]">
            {metricsT("goal")}
          </h3>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {isSuperAdmin && (
            <select
              className="h-10 rounded-full border border-[#c4b5fd] bg-white px-4 text-sm font-medium text-[#4c1d95] shadow-sm transition hover:border-[#a78bfa]"
              value={effectiveTeam}
              onChange={(e) => onChangeTeam(e.target.value)}
            >
              <option className="text-black" value="">
                {t("selectPlaceholder")}
              </option>
              {allTeams.map((tName) => (
                <option className="text-black" key={tName} value={tName}>
                  {tName}
                </option>
              ))}
            </select>
          )}
          {(isSuperAdmin || role === "lider") && (
            <button
              className="inline-flex items-center justify-center rounded-full border border-[#c4b5fd] bg-white px-4 py-2 text-sm font-semibold text-[#4c1d95] shadow-sm transition hover:border-[#a78bfa] hover:text-[#3c0d7a]"
              onClick={() => setEditOpen(true)}
            >
              {t("editCta")}
            </button>
          )}
        </div>
      </div>

      {!effectiveTeam ? (
        <div className="mt-6 rounded-3xl border border-dashed border-[#d8c7ff] bg-[#faf7ff] p-6 text-sm text-[#5b21b6]">
          {isSuperAdmin ? emptyT("admin") : emptyT("member")}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GoalKpi label={t("teamGoalLabel")} value={formatUSD(teamGoal)} />
            <GoalKpi label={t("membersSumLabel")} value={formatUSD(sumMembersGoal)} />
          </div>

          <div className="mt-6 rounded-3xl border border-[#efe7ff] bg-white/80 p-5 shadow-inner">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#5b21b6]">{t("progressLabel")}</p>
                <p className="text-xl font-semibold text-[#047857]">{formatUSD(teamProgress)}</p>
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
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
                {teamGoal > 0 && (
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
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[#5b21b6]">
              <span className="font-semibold text-[#6d28d9]">
                {t("completed", { pct: Math.max(0, pct).toFixed(0) })}
              </span>
              <span className="text-xs text-[#7c3aed]">
                {t("progressTitle", { year, quarter })}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#f8f5ff] px-4 py-3 text-sm">
              <span className="font-medium text-[#5b21b6]">{t("deltaLabelShort")}</span>
              <span
                className={`font-semibold ${
                  delta === 0 ? "text-[#5b21b6]" : delta > 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {delta > 0 ? "+" : ""}
                {formatUSD(delta)}
              </span>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onConfirm={(val) => {
          const num = Number(val);
          if (Number.isFinite(num) && num >= 0) onSaveTeamGoal(num);
          setEditOpen(false);
        }}
        title={dialogT("title")}
        description={<span className="text-sm">{dialogT("description")}</span>}
        inputLabel={dialogT("inputLabel")}
        inputPlaceholder={dialogT("inputPlaceholder")}
        inputDefaultValue={String(teamGoal)}
        inputRequired
        validateInput={(v) => (Number(v) < 0 ? validationT("nonNegative") : null)}
        confirmText={dialogT("confirm")}
      />
    </div>
  );
}
