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
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
      <div className="bg-gradient-to-r from-purple-50 to-white px-6 py-5 border-b border-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600">{t("title")}</p>
            <h3 className="mt-1.5 text-2xl font-bold text-slate-900">
              {metricsT("goal")}
            </h3>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {isSuperAdmin && (
              <select
                className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-purple-300 hover:shadow-md focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]"
                onClick={() => setEditOpen(true)}
              >
                {t("editCta")}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {!effectiveTeam ? (
          <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-8 text-center">
            <div className="mx-auto max-w-md">
              <p className="text-sm text-purple-900 font-medium">
                {isSuperAdmin ? emptyT("admin") : emptyT("member")}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <GoalKpi label={t("teamGoalLabel")} value={formatUSD(teamGoal)} />
              <GoalKpi label={t("membersSumLabel")} value={formatUSD(sumMembersGoal)} />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/50 to-purple-50/30 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-600">{t("progressLabel")}</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatUSD(teamProgress)}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm font-semibold text-slate-600">{t("remainingLabel")}</p>
                  <p className="text-2xl font-bold text-amber-600">{formatUSD(remaining)}</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="relative h-4 w-full overflow-hidden rounded-xl bg-slate-200/60">
                  <div
                    className="absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                  {teamGoal > 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-[3px] bg-amber-400 shadow-sm"
                      style={{ left: `calc(${Math.min(100, Math.max(0, monthlyPct))}% - 1.5px)` }}
                    />
                  )}
                  <div className="absolute inset-0 flex">
                    <div className="h-full w-1/3 border-r border-white/40" />
                    <div className="h-full w-1/3 border-r border-white/40" />
                    <div className="h-full w-1/3" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-bold text-purple-600">
                  {t("completed", { pct: Math.max(0, pct).toFixed(0) })}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {t("progressTitle", { year, quarter })}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-slate-50 to-purple-50/50 px-5 py-3.5 border border-slate-100">
                <span className="font-semibold text-slate-700">{t("deltaLabelShort")}</span>
                <span
                  className={`text-lg font-bold ${
                    delta === 0 ? "text-slate-600" : delta > 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {formatUSD(delta)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

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
