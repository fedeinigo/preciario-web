// src/app/components/features/goals/components/BillingSummaryCard.tsx
"use client";

import React from "react";
import { useTranslations } from "@/app/LanguageProvider";
import { formatUSD } from "../../proposals/lib/format";

export type UserWonDeal = {
  id: string;
  companyName: string | null;
  totalAmount: number;
  docId?: string | null;
  docUrl?: string | null;
};

type Props = {
  deals: UserWonDeal[];
  goal: number;
  progress: number;
  loading: boolean;
};

export default function BillingSummaryCard({ deals, goal, progress, loading }: Props) {
  const t = useTranslations("goals.billing");

  const groupedDeals = React.useMemo(() => {
    const byCompany = new Map<
      string,
      { amount: number; count: number; autoCount: number }
    >();

    deals.forEach((deal) => {
      const company = (deal.companyName || t("unknownCompany")).trim() || t("unknownCompany");
      const entry = byCompany.get(company) ?? { amount: 0, count: 0, autoCount: 0 };
      entry.amount += Number(deal.totalAmount || 0);
      entry.count += 1;
      if (deal.docId || deal.docUrl) entry.autoCount += 1;
      byCompany.set(company, entry);
    });

    const raw = Array.from(byCompany.entries()).map(([company, stats]) => ({
      company,
      ...stats,
    }));

    raw.sort((a, b) => b.amount - a.amount);

    const baseGoal = goal > 0 ? goal / Math.max(1, raw.length) : 0;

    return raw.map((item) => {
      const pending = Math.max(0, baseGoal - item.amount);
      const pct = baseGoal > 0 ? (item.amount / baseGoal) * 100 : 0;
      return {
        company: item.company,
        amount: item.amount,
        count: item.count,
        auto: item.autoCount >= item.count / 2,
        pending,
        pct,
      };
    });
  }, [deals, goal, t]);

  const totalPending = Math.max(0, goal - progress);
  const companiesCount = groupedDeals.length;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#eadeff] bg-gradient-to-br from-white via-white to-[#f4f0ff] p-6 shadow-[0_24px_60px_rgba(79,29,149,0.12)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7c3aed]">
            {t("title")}
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-[#2f0f5d]">
            {t("subtitle", { count: companiesCount })}
          </h3>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
        {loading ? (
          <div className="rounded-3xl border border-dashed border-[#d8c7ff] bg-[#faf7ff] p-6 text-sm text-[#5b21b6]">
            {t("loading")}
          </div>
        ) : groupedDeals.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#d8c7ff] bg-[#faf7ff] p-6 text-sm text-[#5b21b6]">
            {t("empty")}
          </div>
        ) : (
          groupedDeals.map((item) => (
            <div
              key={item.company}
              className="rounded-3xl border border-[#efe7ff] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(124,58,237,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[#2f0f5d]">{item.company}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#7c3aed]">
                    {t("dealCount", { count: item.count })}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    item.auto
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-[#fee2e2] text-[#b91c1c]"
                  }`}
                >
                  {item.auto ? t("autoLabel") : t("manualLabel")}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7c3aed]">
                    {t("facturadoLabel")}
                  </p>
                  <p className="text-lg font-semibold text-[#047857]">{formatUSD(item.amount)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#a16207]">
                    {t("pendingLabel")}
                  </p>
                  <p className="text-lg font-semibold text-[#b45309]">{formatUSD(item.pending)}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#ede9fe]">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#c084fc] via-[#a855f7] to-[#7c3aed]"
                    style={{ width: `${Math.min(100, Math.max(0, item.pct))}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-xs font-semibold text-[#6d28d9]">
                  {Math.max(0, item.pct).toFixed(0)}%
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-3xl border border-[#efe7ff] bg-white px-5 py-4 text-sm font-semibold text-[#5b21b6] shadow-[0_12px_30px_rgba(124,58,237,0.08)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#7c3aed]">
            {t("totalFacturado")}
          </span>
          <span className="text-lg text-[#047857]">{formatUSD(progress)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#a16207]">
            {t("totalPending")}
          </span>
          <span className="text-lg text-[#b45309]">{formatUSD(totalPending)}</span>
        </div>
      </div>
    </div>
  );
}
