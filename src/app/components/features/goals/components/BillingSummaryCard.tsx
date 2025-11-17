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
};

export default function BillingSummaryCard({
  deals,
  totals,
  loading,
  goal,
  onEditBilling,
  onAddManual,
  onDeleteDeal,
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

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
      <div className="bg-gradient-to-r from-purple-50 to-white px-6 py-5 border-b border-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600">{t("title")}</p>
            <h3 className="mt-1.5 text-2xl font-bold text-slate-900">
              {t("subtitle", { count: deals.length })}
            </h3>
          </div>
          {onAddManual && (
            <button
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]"
              onClick={onAddManual}
            >
              {t("manualCta")}
            </button>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-8 text-center">
              <p className="text-sm text-purple-900 font-medium">{t("loading")}</p>
            </div>
          ) : sortedDeals.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-8 text-center">
              <p className="text-sm text-purple-900 font-medium">{t("empty")}</p>
            </div>
          ) : (
            sortedDeals.map((deal) => (
              <div
                key={deal.id}
                className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30 px-5 py-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedDeal(deal)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 group-hover:text-purple-600 transition">
                    <p className="text-base font-bold text-slate-900">{deal.companyName}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                    {deal.type === "auto" ? t("autoLabel") : t("manualLabel")}
                    <span className="mx-1 text-slate-300">·</span>
                    <span
                      className={
                        deal.wonType === "UPSELL"
                          ? "text-amber-600"
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
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 hover:border-rose-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDeal(deal);
                      }}
                    >
                      {t("deleteManual")}
                    </button>
                  )}
                  <button
                    className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 hover:border-purple-300"
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
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
                    {t("monthlyFee")}
                  </p>
                  <p className="text-lg font-bold text-slate-900">{formatUSD(deal.monthlyFee)}</p>
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    {t("billed")}
                  </p>
                  <p className="text-lg font-bold text-emerald-600">{formatUSD(deal.billedAmount)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    {t("pending")}
                  </p>
                  <p className="text-lg font-bold text-amber-600">{formatUSD(deal.pendingAmount)}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="relative h-3 w-full overflow-hidden rounded-xl bg-slate-200/60">
                  <div
                    className="absolute left-0 top-0 h-full rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(0, deal.billingPct))}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between text-xs font-bold">
                  <span className="text-purple-600">{deal.billingPct.toFixed(0)}%</span>
                  {deal.link && (
                    <a
                      href={deal.link}
                      className="text-purple-600 underline hover:text-purple-700 transition"
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

        <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-purple-50/30 px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
              {t("totalMonthly")}
            </span>
            <span className="text-lg font-bold text-slate-900">
              {formatUSD(totals.monthlyFees)}
              <span className="ml-2 text-xs font-semibold text-slate-500">
                ({percentLabel(goalPct)})
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {t("totalBilled")}
            </span>
            <span className="text-lg font-bold text-emerald-600">
              {formatUSD(totals.billed)}
              <span className="ml-2 text-xs font-semibold text-emerald-600/70">
                ({percentLabel(billedPct)})
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              {t("totalPending")}
            </span>
            <span className="text-lg font-bold text-amber-600">
              {formatUSD(totals.pending)}
              <span className="ml-2 text-xs font-semibold text-amber-600/70">
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
