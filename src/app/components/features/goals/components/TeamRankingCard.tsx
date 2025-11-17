// src/app/components/features/goals/components/TeamRankingCard.tsx
"use client";

import React from "react";
import { useTranslations } from "@/app/LanguageProvider";
import { formatUSD } from "../../proposals/lib/format";
import type { TeamGoalRow } from "./TeamMembersTable";
import UserAvatar from "@/app/components/ui/UserAvatar";

type Props = {
  rows: TeamGoalRow[];
  loading: boolean;
  effectiveTeam: string;
};

type Mode = "deals" | "amount";

export default function TeamRankingCard({ rows, loading, effectiveTeam }: Props) {
  const t = useTranslations("goals.ranking");
  const [mode, setMode] = React.useState<Mode>("amount");

  React.useEffect(() => {
    setMode("amount");
  }, [effectiveTeam]);

  const ranked = React.useMemo(() => {
    const withStats = rows.map((row) => ({
      ...row,
      deals: row.dealsCount ?? 0,
    }));

    withStats.sort((a, b) => {
      if (mode === "deals") {
        return (b.deals || 0) - (a.deals || 0);
      }
      return b.progress - a.progress;
    });

    return withStats;
  }, [rows, mode]);

  const displayName = (row: TeamGoalRow) => row.name || row.email || row.userId;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
      <div className="bg-gradient-to-r from-purple-50 to-white px-6 py-5 border-b border-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
              {t("title")}
            </p>
            <h3 className="mt-1.5 text-2xl font-bold text-slate-900">
              {effectiveTeam ? t("subtitle", { team: effectiveTeam }) : t("subtitleNoTeam")}
            </h3>
          </div>
          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm">
            <button
              className={`rounded-xl px-4 py-2 transition ${mode === "deals" ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setMode("deals")}
              type="button"
            >
              {t("modeDeals")}
            </button>
            <button
              className={`rounded-xl px-4 py-2 transition ${mode === "amount" ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setMode("amount")}
              type="button"
            >
              {t("modeAmount")}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-3">
          {!effectiveTeam ? (
            <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-8 text-center">
              <p className="text-sm text-purple-900 font-medium">{t("emptyTeam")}</p>
            </div>
          ) : loading ? (
            <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-8 text-center">
              <p className="text-sm text-purple-900 font-medium">{t("loading")}</p>
            </div>
          ) : ranked.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-8 text-center">
              <p className="text-sm text-purple-900 font-medium">{t("empty")}</p>
            </div>
          ) : (
            ranked.slice(0, 6).map((row, index) => (
              <div
                key={row.userId}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30 px-5 py-4 shadow-sm hover:shadow-md transition-all"
              >
              <div className="flex items-center gap-4">
                <UserAvatar
                  name={displayName(row)}
                  email={row.email ?? undefined}
                  image={row.image ?? undefined}
                  size={48}
                  className="shadow-sm ring-2 ring-purple-200/70"
                />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{displayName(row)}</p>
                    {row.email && <p className="text-xs text-slate-500 font-medium">{row.email}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-1 flex justify-end">
                    <span className="inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                      {t("positionLabel", { position: index + 1 })}
                    </span>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
                    {mode === "deals" ? t("dealsLabel") : t("amountLabel")}
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {mode === "deals" ? row.deals : formatUSD(row.progress)}
                  </p>
                  {mode === "amount" ? (
                    <p className="text-xs font-medium text-slate-500">
                      {t("dealsCount", { count: row.deals })}
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-slate-500">
                      {t("amountShort", { amount: formatUSD(row.progress) })}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
