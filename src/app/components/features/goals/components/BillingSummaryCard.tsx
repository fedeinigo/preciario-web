// src/app/components/features/goals/components/BillingSummaryCard.tsx
"use client";

import React from "react";
import { useTranslations } from "@/app/LanguageProvider";
import { formatUSD } from "../../proposals/lib/format";

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
  onEditBilling: (deal: UserWonDeal) => void;
  onAddManual?: () => void;
};

export default function BillingSummaryCard({ deals, totals, loading, onEditBilling, onAddManual }: Props) {
  const t = useTranslations("goals.billing");

  const sortedDeals = React.useMemo(() => {
    return [...deals].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [deals]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#eadeff] bg-gradient-to-br from-white via-white to-[#f4f0ff] p-6 shadow-[0_24px_60px_rgba(79,29,149,0.12)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7c3aed]">{t("title")}</p>
          <h3 className="mt-1 text-2xl font-semibold text-[#2f0f5d]">
            {t("subtitle", { count: deals.length })}
          </h3>
        </div>
        {onAddManual && (
          <button
            className="inline-flex items-center justify-center rounded-full border border-[#c4b5fd] bg-white px-4 py-2 text-sm font-semibold text-[#4c1d95] shadow-sm transition hover:border-[#a78bfa] hover:text-[#3c0d7a]"
            onClick={onAddManual}
          >
            {t("manualCta")}
          </button>
        )}
      </div>

      <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
        {loading ? (
          <div className="rounded-3xl border border-dashed border-[#d8c7ff] bg-[#faf7ff] p-6 text-sm text-[#5b21b6]">
            {t("loading")}
          </div>
        ) : sortedDeals.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#d8c7ff] bg-[#faf7ff] p-6 text-sm text-[#5b21b6]">
            {t("empty")}
          </div>
        ) : (
          sortedDeals.map((deal) => (
            <div
              key={deal.id}
              className="rounded-3xl border border-[#efe7ff] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(124,58,237,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[#2f0f5d]">{deal.companyName}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#7c3aed]">
                    {deal.type === "auto" ? t("autoLabel") : t("manualLabel")}
                  </p>
                </div>
                <button
                  className="rounded-full border border-[#d8c7ff] px-3 py-1 text-xs font-semibold text-[#6d28d9] transition hover:bg-[#f4edff]"
                  onClick={() => onEditBilling(deal)}
                >
                  {t("editBilling")}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7c3aed]">
                    {t("monthlyFee")}
                  </p>
                  <p className="text-lg font-semibold text-[#4c1d95]">{formatUSD(deal.monthlyFee)}</p>
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#047857]">
                    {t("billed")}
                  </p>
                  <p className="text-lg font-semibold text-[#047857]">{formatUSD(deal.billedAmount)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#b45309]">
                    {t("pending")}
                  </p>
                  <p className="text-lg font-semibold text-[#b45309]">{formatUSD(deal.pendingAmount)}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#ede9fe]">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#c084fc] via-[#a855f7] to-[#7c3aed]"
                    style={{ width: `${Math.min(100, Math.max(0, deal.billingPct))}%` }}
                  />
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between text-xs font-semibold text-[#6d28d9]">
                  <span>{deal.billingPct.toFixed(0)}%</span>
                  {deal.link && (
                    <a
                      href={deal.link}
                      className="text-[#4c1d95] underline"
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

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-3xl border border-[#efe7ff] bg-white px-5 py-4 text-sm font-semibold text-[#5b21b6] shadow-[0_12px_30px_rgba(124,58,237,0.08)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#7c3aed]">
            {t("totalMonthly")}
          </span>
          <span className="text-lg text-[#4c1d95]">{formatUSD(totals.monthlyFees)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#047857]">
            {t("totalBilled")}
          </span>
          <span className="text-lg text-[#047857]">{formatUSD(totals.billed)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#b45309]">
            {t("totalPending")}
          </span>
          <span className="text-lg text-[#b45309]">{formatUSD(totals.pending)}</span>
        </div>
      </div>
    </div>
  );
}
