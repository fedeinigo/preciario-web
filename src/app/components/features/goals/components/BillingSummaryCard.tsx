// src/app/components/features/goals/components/BillingSummaryCard.tsx
"use client";

import React from "react";
import { useTranslations } from "@/app/LanguageProvider";
import { formatUSD } from "../../proposals/lib/format";
import DealDetailsModal from "./DealDetailsModal";

export type UserWonDeal = {
  id: string;
  type: "auto" | "manual";
  companyName: string;
  monthlyFee: number;
  billedAmount: number;
  pendingAmount: number;
  billingPct: number;
  link: string | null;
  createdAt: string;
  proposalId?: string;
  manualDealId?: string;
  docId?: string | null;
  docUrl?: string | null;
  wonType: "NEW_CUSTOMER" | "UPSELL";
};

type Totals = {
  monthlyFees: number;
  billed: number;
  pending: number;
};

type Props = {
  deals: UserWonDeal[];
  totals: Totals;
  loading: boolean;
  goal: number;
  onEditBilling: (deal: UserWonDeal) => void;
  onAddManual?: () => void;
  onDeleteDeal?: (deal: UserWonDeal) => void;
  theme?: "direct" | "mapache";
};

export default function BillingSummaryCard({
  deals,
  totals,
  loading,
  goal,
  onEditBilling,
  onAddManual,
  onDeleteDeal,
  theme = "direct",
}: Props) {
  const t = useTranslations("goals.billing");
  const [selectedDeal, setSelectedDeal] = React.useState<UserWonDeal | null>(null);

  const sortedDeals = React.useMemo(() => {
    return [...deals].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [deals]);

  const percentLabel = React.useCallback((value: number) => {
    if (!Number.isFinite(value)) return "0%";
    return `${value.toFixed(1)}%`;
  }, []);

  const totalFees = totals.monthlyFees;
  const billedPct = totalFees > 0 ? (totals.billed / totalFees) * 100 : 0;
  const pendingPct = totalFees > 0 ? (totals.pending / totalFees) * 100 : 0;
  const goalPct = goal > 0 ? (totalFees / goal) * 100 : 0;

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
  const ctaClass = isMapache
    ? "inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.35)] transition-all hover:scale-[1.02]"
    : "inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]";
  const emptyCardClass = isMapache
    ? "rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center text-white"
    : "rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-8 text-center";
  const dealCardClass = isMapache
    ? "rounded-2xl border border-white/10 bg-gradient-to-br from-[#121520] to-[#0c0e17] px-5 py-4 shadow-sm hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-all cursor-pointer group"
    : "rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30 px-5 py-4 shadow-sm hover:shadow-md transition-all cursor-pointer group";
  const dealTitleClass = isMapache ? "text-base font-bold text-white group-hover:text-[#a78bfa] transition" : "text-base font-bold text-slate-900";
  const pillDeleteClass = isMapache
    ? "rounded-xl border border-rose-400/60 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 hover:border-rose-300/70"
    : "rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 hover:border-rose-300";
  const pillEditClass = isMapache
    ? "rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
    : "rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 hover:border-purple-300";
  const labelMuted = isMapache ? "text-xs font-bold uppercase tracking-wider text-white/60" : "text-xs font-bold uppercase tracking-wider text-purple-600";
  const sectionText = isMapache ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900";
  const dealMetaMuted = isMapache ? "text-xs font-semibold uppercase tracking-wide text-white/60" : "text-xs font-semibold uppercase tracking-wide text-purple-600";
  const billedColor = isMapache ? "text-lg font-bold text-emerald-300" : "text-lg font-bold text-emerald-600";
  const pendingColor = isMapache ? "text-lg font-bold text-amber-300" : "text-lg font-bold text-amber-600";
  const barTrack = isMapache ? "relative h-3 w-full overflow-hidden rounded-xl bg-white/10" : "relative h-3 w-full overflow-hidden rounded-xl bg-slate-200/60";
  const barFill = isMapache
    ? "absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-[#22d3ee] via-[#8b5cf6] to-[#a855f7] shadow-sm"
    : "absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 shadow-sm";
  const footerClass = isMapache
    ? "mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-[#121520] to-[#0c0e17] px-6 py-5"
    : "mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-purple-50/30 px-6 py-5";
  const footerLabel = isMapache ? "text-xs font-bold uppercase tracking-wider text-white/60" : "text-xs font-bold uppercase tracking-wider text-purple-600";
  const footerValue = isMapache ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900";
  const footerMeta = isMapache ? "ml-2 text-xs font-semibold text-white/60" : "ml-2 text-xs font-semibold text-slate-500";

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={titleClass}>{t("title")}</p>
            <h3 className={headingClass}>
              {t("subtitle", { count: deals.length })}
            </h3>
          </div>
          {onAddManual && (
            <button
              className={ctaClass}
              onClick={onAddManual}
            >
              {t("manualCta")}
            </button>
          )}
        </div>
      </div>

      <div className={contentClass}>
        <div className="space-y-4">
          {loading ? (
            <div className={emptyCardClass}>
              <p className="text-sm font-medium">{t("loading")}</p>
            </div>
          ) : sortedDeals.length === 0 ? (
            <div className={emptyCardClass}>
              <p className="text-sm font-medium">{t("empty")}</p>
            </div>
          ) : (
            sortedDeals.map((deal) => (
              <div
                key={deal.id}
                className={dealCardClass}
                onClick={() => setSelectedDeal(deal)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 group-hover:text-purple-600 transition">
                    <p className={dealTitleClass}>{deal.companyName}</p>
                  <p className={dealMetaMuted}>
                    {deal.type === "auto" ? t("autoLabel") : t("manualLabel")}
                    <span className="mx-1 text-slate-300">·</span>
                    <span
                      className={
                        deal.wonType === "UPSELL"
                          ? isMapache
                            ? "text-amber-300"
                            : "text-amber-600"
                          : isMapache
                            ? "text-sky-300"
                            : "text-blue-600"
                      }
                    >
                      {deal.wonType === "UPSELL" ? t("wonTypeUpsell") : t("wonTypeNew")}
                    </span>
                  </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {deal.type === "manual" && onDeleteDeal && (
                      <button
                        className={pillDeleteClass}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDeal(deal);
                        }}
                      >
                        {t("deleteManual")}
                      </button>
                    )}
                    <button
                      className={pillDeleteClass}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBilling(deal);
                      }}
                    >
                      {t("editBilling")}
                    </button>
                  )}
                  <button
                    className={pillEditClass}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBilling(deal);
                    }}
                  >
                    {t("editBilling")}
                  </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <p className={labelMuted}>
                    {t("monthlyFee")}
                  </p>
                  <p className={sectionText}>{formatUSD(deal.monthlyFee)}</p>
                </div>
                <div className="text-left sm:text-center">
                  <p className={isMapache ? "text-xs font-bold uppercase tracking-wider text-emerald-300" : "text-xs font-bold uppercase tracking-wider text-emerald-600"}>
                    {t("billed")}
                  </p>
                  <p className={billedColor}>{formatUSD(deal.billedAmount)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className={isMapache ? "text-xs font-bold uppercase tracking-wider text-amber-300" : "text-xs font-bold uppercase tracking-wider text-amber-600"}>
                    {t("pending")}
                  </p>
                  <p className={pendingColor}>{formatUSD(deal.pendingAmount)}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className={barTrack}>
                  <div
                    className={barFill}
                    style={{ width: `${Math.min(100, Math.max(0, deal.billingPct))}%` }}
                  />
                </div>
                <div className={`mt-2 flex flex-wrap items-center justify-between text-xs font-bold ${isMapache ? "text-white" : ""}`}>
                  <span className={isMapache ? "text-white" : "text-purple-600"}>{deal.billingPct.toFixed(0)}%</span>
                  {deal.link && (
                    <a
                      href={deal.link}
                      className={isMapache ? "text-[#93c5fd] underline hover:text-white transition" : "text-purple-600 underline hover:text-purple-700 transition"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("viewProposal")}
                    </a>
                  )}
                </div>
              </div>
              </div>
            ))
          )}
        </div>

        <div className={footerClass}>
          <div className="flex items-center justify-between">
            <span className={footerLabel}>
              {t("totalMonthly")}
            </span>
            <span className={footerValue}>
              {formatUSD(totals.monthlyFees)}
              <span className={footerMeta}>
                ({percentLabel(goalPct)})
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={isMapache ? "text-xs font-bold uppercase tracking-wider text-emerald-300" : "text-xs font-bold uppercase tracking-wider text-emerald-600"}>
              {t("totalBilled")}
            </span>
            <span className={isMapache ? "text-lg font-bold text-emerald-300" : "text-lg font-bold text-emerald-600"}>
              {formatUSD(totals.billed)}
              <span className={isMapache ? "ml-2 text-xs font-semibold text-emerald-200/80" : "ml-2 text-xs font-semibold text-emerald-600/70"}>
                ({percentLabel(billedPct)})
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={isMapache ? "text-xs font-bold uppercase tracking-wider text-amber-300" : "text-xs font-bold uppercase tracking-wider text-amber-600"}>
              {t("totalPending")}
            </span>
            <span className={isMapache ? "text-lg font-bold text-amber-300" : "text-lg font-bold text-amber-600"}>
              {formatUSD(totals.pending)}
              <span className={isMapache ? "ml-2 text-xs font-semibold text-amber-200/80" : "ml-2 text-xs font-semibold text-amber-600/70"}>
                ({percentLabel(pendingPct)})
              </span>
            </span>
          </div>
        </div>
      </div>

      <DealDetailsModal 
        deal={selectedDeal}
        isOpen={selectedDeal !== null}
        onClose={() => setSelectedDeal(null)}
      />
    </div>
  );
}
