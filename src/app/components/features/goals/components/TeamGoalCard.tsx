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
  theme = "direct",
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
  theme?: "direct" | "mapache";
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

  const isMapache = theme === "mapache";
  const containerClass = isMapache
    ? "relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0f1118] shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
    : "relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)]";
  const headerClass = isMapache
    ? "bg-gradient-to-r from-[#161925] via-[#11131d] to-[#0d0f17] px-6 py-5 border-b border-white/10"
    : "bg-gradient-to-r from-purple-50 to-white px-6 py-5 border-b border-slate-100";
  const titleClass = isMapache
    ? "text-[11px] font-bold uppercase tracking-[0.2em] text-white/60"
    : "text-xs font-bold uppercase tracking-wider text-purple-600";
  const headingClass = isMapache ? "mt-1.5 text-2xl font-bold text-white" : "mt-1.5 text-2xl font-bold text-slate-900";
  const selectClass = isMapache
    ? "h-10 rounded-2xl border border-white/15 bg-[#0b0d14] px-4 text-sm font-semibold text-white shadow-sm transition hover:border-white/30 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
    : "h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-purple-300 hover:shadow-md focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20";
  const editCtaClass = isMapache
    ? "inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.35)] transition-all hover:scale-[1.02]"
    : "inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]";
  const bodyPanelClass = isMapache
    ? "mt-6 rounded-2xl border border-white/10 bg-[#0b0d14] p-6"
    : "mt-6 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/50 to-purple-50/30 p-6";
  const mutedText = isMapache ? "text-sm font-semibold text-white/70" : "text-sm font-semibold text-slate-600";
  const positiveText = isMapache ? "text-emerald-300" : "text-emerald-600";
  const warningText = isMapache ? "text-amber-300" : "text-amber-600";
  const barTrack = isMapache ? "relative h-4 w-full overflow-hidden rounded-xl bg-white/10" : "relative h-4 w-full overflow-hidden rounded-xl bg-slate-200/60";
  const barFill = isMapache
    ? "absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-[#22d3ee] via-[#8b5cf6] to-[#a855f7] shadow-sm"
    : "absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 shadow-sm";
  const barGridLine = isMapache ? "h-full w-1/3 border-r border-white/20" : "h-full w-1/3 border-r border-white/40";
  const completedClass = isMapache ? "font-bold text-white" : "font-bold text-purple-600";
  const timelineClass = isMapache
    ? "mt-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-white/5 to-white/0 px-5 py-3.5 border border-white/10"
    : "mt-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-slate-50 to-purple-50/50 px-5 py-3.5 border border-slate-100";
  const deltaColor = delta === 0 ? (isMapache ? "text-white" : "text-slate-600") : delta > 0 ? (isMapache ? "text-emerald-300" : "text-emerald-600") : isMapache ? "text-rose-300" : "text-rose-600";

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={titleClass}>{t("title")}</p>
            <h3 className={headingClass}>
              {metricsT("goal")}
            </h3>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {isSuperAdmin && (
              <select
                className={selectClass}
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
                className={editCtaClass}
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
          <div
            className={`rounded-2xl border-2 border-dashed ${
              isMapache
                ? "border-white/20 bg-white/5 text-white"
                : "border-purple-200 bg-purple-50/30"
            } p-8 text-center`}
          >
            <div className="mx-auto max-w-md">
              <p className={`text-sm font-medium ${isMapache ? "text-white" : "text-purple-900"}`}>
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

            <div className={bodyPanelClass}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className={mutedText}>{t("progressLabel")}</p>
                  <p className={`text-2xl font-bold ${positiveText}`}>{formatUSD(teamProgress)}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className={mutedText}>{t("remainingLabel")}</p>
                  <p className={`text-2xl font-bold ${warningText}`}>{formatUSD(remaining)}</p>
                </div>
              </div>

              <div className="mt-6">
                <div className={barTrack}>
                  <div className={barFill} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                  {teamGoal > 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-[3px] bg-amber-400 shadow-sm"
                      style={{ left: `calc(${Math.min(100, Math.max(0, monthlyPct))}% - 1.5px)` }}
                    />
                  )}
                  <div className="absolute inset-0 flex">
                    <div className={barGridLine} />
                    <div className={barGridLine} />
                    <div className="h-full w-1/3" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className={completedClass}>
                  {t("completed", { pct: Math.max(0, pct).toFixed(0) })}
                </span>
                <span className={isMapache ? "text-xs font-medium text-white/60" : "text-xs font-medium text-slate-500"}>
                  {t("progressTitle", { year, quarter })}
                </span>
              </div>

              <div className={timelineClass}>
                <span className={isMapache ? "font-semibold text-white" : "font-semibold text-slate-700"}>
                  {t("deltaLabelShort")}
                </span>
                <span className={`text-lg font-bold ${deltaColor}`}>
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
