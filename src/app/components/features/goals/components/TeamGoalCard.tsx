// src/app/components/features/goals/components/TeamGoalCard.tsx
"use client";

import React from "react";
import GoalKpi from "./GoalKpi";
import ProgressBar from "./ProgressBar";
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
  onExportCsv,
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
  onExportCsv: () => void;
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

  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <div className="rounded-2xl border bg-white shadow-md overflow-hidden flex flex-col h-full">
      <div className="px-4 h-12 flex items-center justify-between text-white font-semibold bg-[#4c1d95]">
        <span>{t("title")}</span>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <select
              className="h-10 px-4 rounded-full border border-white/60 bg-white/15 text-white"
              value={effectiveTeam}
              onChange={(e) => onChangeTeam(e.target.value)}
            >
              <option className="text-black" value="">{t("selectPlaceholder")}</option>
              {allTeams.map((t) => (
                <option className="text-black" key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
          <button
            className="h-9 px-4 rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20"
            onClick={onExportCsv}
          >
            {t("exportCsv")}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {!effectiveTeam ? (
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
            {isSuperAdmin ? emptyT("superadmin") : emptyT("member")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GoalKpi label={metricsT("goal")} value={formatUSD(teamGoal)} />
              <GoalKpi label={metricsT("progress")} value={formatUSD(teamProgress)} />
              <GoalKpi label={metricsT("remaining")} value={formatUSD(remaining)} />
              <GoalKpi label={metricsT("pct")} value={`${(teamGoal ? (teamProgress / teamGoal) * 100 : 0).toFixed(1)}%`} />
            </div>

            <div className="rounded-xl border bg-white p-3">
              <div className="text-xs text-gray-600 mb-1">{t("progressTitle", { year, quarter })}</div>
              <ProgressBar pct={pct} height={12} title={`${pct.toFixed(1)}%`} />
              <div className="text-xs text-gray-600 mt-1">
                {t("deltaLabel")} {" "}
                <b className={delta === 0 ? "text-gray-600" : delta > 0 ? "text-emerald-600" : "text-rose-600"}>
                  {delta > 0 ? "+" : ""}{formatUSD(delta)}
                </b>
              </div>
            </div>

            {(isSuperAdmin || role === "lider") && (
              <div>
                <button
                  className="btn-bar"
                  onClick={() => setEditOpen(true)}
                >
                  {t("editCta")}
                </button>
              </div>
            )}
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
