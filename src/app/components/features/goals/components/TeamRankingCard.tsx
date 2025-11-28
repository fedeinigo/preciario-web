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
  theme?: "direct" | "mapache";
  onSelectMember?: (row: TeamGoalRow) => void;
};

type Mode = "deals" | "amount";

export default function TeamRankingCard({ rows, loading, effectiveTeam, theme = "direct", onSelectMember }: Props) {
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

  const isMapache = theme === "mapache";
  const containerClass = isMapache
    ? "flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0f1118] shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
    : "flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)]";
  const headerClass = isMapache
    ? "bg-gradient-to-r from-[#161925] via-[#11131d] to-[#0d0f17] px-6 py-5 border-b border-white/10"
    : "bg-gradient-to-r from-purple-50 to-white px-6 py-5 border-b border-slate-100";
  const titleClass = isMapache
    ? "text-[11px] font-bold uppercase tracking-[0.2em] text-white/60"
    : "text-xs font-bold uppercase tracking-wider text-purple-600";
  const headingClass = isMapache ? "mt-1.5 text-2xl font-bold text-white" : "mt-1.5 text-2xl font-bold text-slate-900";
  const toggleWrapper = isMapache
    ? "inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-[#0b0d14] p-1 text-xs font-semibold shadow-sm"
    : "inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm";
  const toggleBtn = (active: boolean) =>
    `${
      active
        ? isMapache
          ? "bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white shadow-sm"
          : "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-sm"
        : isMapache
          ? "text-white/80 hover:bg-white/5"
          : "text-slate-700 hover:bg-slate-50"
    } rounded-xl px-4 py-2 transition`;
  const emptyCardClass = isMapache
    ? "rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center text-white"
    : "rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-8 text-center";
  const cardClass = isMapache
    ? "flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-[#121520] to-[#0c0e17] px-5 py-4 shadow-sm hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-all"
    : "flex items-center justify-between gap-4 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30 px-5 py-4 shadow-sm hover:shadow-md transition-all";
  const nameClass = isMapache ? "text-sm font-bold text-white" : "text-sm font-bold text-slate-900";
  const emailClass = isMapache ? "text-xs text-white/60 font-medium" : "text-xs text-slate-500 font-medium";
  const badgeClass = isMapache
    ? "inline-flex rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] px-3 py-1 text-[11px] font-bold text-white shadow-sm"
    : "inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1 text-[11px] font-bold text-white shadow-sm";
  const labelClass = isMapache ? "text-xs font-bold uppercase tracking-wider text-white/60" : "text-xs font-bold uppercase tracking-wider text-purple-600";
  const valueClass = isMapache ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900";
  const subLabel = isMapache ? "text-xs font-medium text-white/60" : "text-xs font-medium text-slate-500";
  const avatarRing = isMapache ? "shadow-sm ring-2 ring-white/20" : "shadow-sm ring-2 ring-purple-200/70";

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={titleClass}>
              {t("title")}
            </p>
            <h3 className={headingClass}>
              {effectiveTeam ? t("subtitle", { team: effectiveTeam }) : t("subtitleNoTeam")}
            </h3>
          </div>
          <div className={toggleWrapper}>
            <button
              className={toggleBtn(mode === "deals")}
              onClick={() => setMode("deals")}
              type="button"
            >
              {t("modeDeals")}
            </button>
            <button
              className={toggleBtn(mode === "amount")}
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
            <div className={emptyCardClass}>
              <p className="text-sm font-medium">{t("emptyTeam")}</p>
            </div>
          ) : loading ? (
            <div className={emptyCardClass}>
              <p className="text-sm font-medium">{t("loading")}</p>
            </div>
          ) : ranked.length === 0 ? (
            <div className={emptyCardClass}>
              <p className="text-sm font-medium">{t("empty")}</p>
            </div>
          ) : (
            ranked.slice(0, 6).map((row, index) => (
              <div
                key={row.userId}
                className={`${cardClass} ${onSelectMember ? "cursor-pointer" : ""}`}
                role={onSelectMember ? "button" : undefined}
                tabIndex={onSelectMember ? 0 : -1}
                onClick={() => onSelectMember?.(row)}
                onKeyDown={(e) => {
                  if (onSelectMember && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelectMember(row);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <UserAvatar
                    name={displayName(row)}
                    email={row.email ?? undefined}
                    image={row.image ?? undefined}
                    size={48}
                    className={avatarRing}
                  />
                  <div>
                    <p className={nameClass}>{displayName(row)}</p>
                    {row.email && <p className={emailClass}>{row.email}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-1 flex justify-end">
                    <span className={badgeClass}>
                      {t("positionLabel", { position: index + 1 })}
                    </span>
                  </div>
                  <p className={labelClass}>{mode === "deals" ? t("dealsLabel") : t("amountLabel")}</p>
                  <p className={valueClass}>{mode === "deals" ? row.deals : formatUSD(row.progress)}</p>
                  {mode === "amount" ? (
                    <p className={subLabel}>{t("dealsCount", { count: row.deals })}</p>
                  ) : (
                    <p className={subLabel}>{t("amountShort", { amount: formatUSD(row.progress) })}</p>
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
