// src/app/components/features/goals/components/TeamRankingCard.tsx
"use client";

import React from "react";
import { useTranslations } from "@/app/LanguageProvider";
import { formatUSD } from "../../proposals/lib/format";
import type { TeamGoalRow } from "./TeamMembersTable";

type Props = {
  rows: TeamGoalRow[];
  loading: boolean;
  dealCounts: Record<string, number>;
  effectiveTeam: string;
};

type Mode = "deals" | "amount";

export default function TeamRankingCard({ rows, loading, dealCounts, effectiveTeam }: Props) {
  const t = useTranslations("goals.ranking");
  const [mode, setMode] = React.useState<Mode>("amount");

  React.useEffect(() => {
    setMode("amount");
  }, [effectiveTeam]);

  const ranked = React.useMemo(() => {
    const withStats = rows.map((row) => ({
      ...row,
      deals: dealCounts[row.userId] ?? 0,
    }));

    withStats.sort((a, b) => {
      if (mode === "deals") {
        return (b.deals || 0) - (a.deals || 0);
      }
      return b.progress - a.progress;
    });

    return withStats;
  }, [rows, dealCounts, mode]);

  const displayName = (row: TeamGoalRow) => row.name || row.email || row.userId;

  const initialsFor = React.useCallback((name: string | null, email: string | null) => {
    const source = (name || email || "").trim();
    if (!source) return "--";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#eadeff] bg-gradient-to-br from-white via-white to-[#f4f0ff] p-6 shadow-[0_24px_60px_rgba(79,29,149,0.12)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7c3aed]">
            {t("title")}
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-[#2f0f5d]">
            {effectiveTeam ? t("subtitle", { team: effectiveTeam }) : t("subtitleNoTeam")}
          </h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c4b5fd] bg-white p-1 text-xs font-semibold text-[#4c1d95] shadow-sm">
          <button
            className={`rounded-full px-3 py-1 transition ${mode === "deals" ? "bg-[#ede9fe]" : ""}`}
            onClick={() => setMode("deals")}
            type="button"
          >
            {t("modeDeals")}
          </button>
          <button
            className={`rounded-full px-3 py-1 transition ${mode === "amount" ? "bg-[#ede9fe]" : ""}`}
            onClick={() => setMode("amount")}
            type="button"
          >
            {t("modeAmount")}
          </button>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-3">
        {!effectiveTeam ? (
          <div className="rounded-3xl border border-dashed border-[#d8c7ff] bg-[#faf7ff] p-6 text-sm text-[#5b21b6]">
            {t("emptyTeam")}
          </div>
        ) : loading ? (
          <div className="rounded-3xl border border-dashed border-[#d8c7ff] bg-[#faf7ff] p-6 text-sm text-[#5b21b6]">
            {t("loading")}
          </div>
        ) : ranked.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#d8c7ff] bg-[#faf7ff] p-6 text-sm text-[#5b21b6]">
            {t("empty")}
          </div>
        ) : (
          ranked.slice(0, 6).map((row, index) => (
            <div
              key={row.userId}
              className="flex items-center justify-between gap-4 rounded-3xl border border-[#efe7ff] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(124,58,237,0.08)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ede9fe] text-base font-semibold text-[#5b21b6]">
                  {initialsFor(row.name, row.email)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2f0f5d]">{displayName(row)}</p>
                  {row.email && <p className="text-xs text-[#7c3aed]">{row.email}</p>}
                </div>
              </div>
              <div className="text-right">
                <div className="mb-1 flex justify-end">
                  <span className="inline-flex rounded-full bg-[#ede9fe] px-3 py-0.5 text-[11px] font-semibold text-[#5b21b6]">
                    {t("positionLabel", { position: index + 1 })}
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7c3aed]">
                  {mode === "deals" ? t("dealsLabel") : t("amountLabel")}
                </p>
                <p className="text-lg font-semibold text-[#2f0f5d]">
                  {mode === "deals" ? row.deals : formatUSD(row.progress)}
                </p>
                {mode === "amount" ? (
                  <p className="text-xs text-[#6d28d9]">
                    {t("dealsCount", { count: row.deals })}
                  </p>
                ) : (
                  <p className="text-xs text-[#6d28d9]">
                    {t("amountShort", { amount: formatUSD(row.progress) })}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
