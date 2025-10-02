// src/app/components/features/proposals/components/SummaryModal.tsx
"use client";

import Modal from "@/app/components/ui/Modal";
import { formatUSD } from "../lib/format";
import React from "react";

import { useTranslations } from "@/app/LanguageProvider";

type SelectedItemRow = {
  name: string;
  quantity: number;
  unitPrice: number;   // base
  devHours: number;
  discountPct?: number;
  unitNet?: number;    // calculado
};

export function SummaryModal({
  open,
  creating,
  onClose,
  onGenerate,
  companyName,
  country,
  subsidiary,
  selectedItems,
  totalHours,
  totalAmount,
}: {
  open: boolean;
  creating: boolean;
  onClose: () => void;
  onGenerate: () => void;
  companyName: string;
  country: string;
  subsidiary: string;
  selectedItems: SelectedItemRow[];
  totalHours: number;
  totalAmount: number;
}) {
  const t = useTranslations("proposals.summary");
  const generatorT = useTranslations("proposals.generator");
  const emptyValue = generatorT("emptyValue");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("title")}
      panelClassName="max-h-[90vh] flex flex-col"
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <div className="text-xs text-gray-600">{t("company.label")}</div>
              <div className="font-semibold">{companyName || emptyValue}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">{t("country.label")}</div>
              <div className="font-semibold">{country || emptyValue}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">{t("subsidiary.label")}</div>
              <div className="font-semibold">{subsidiary || emptyValue}</div>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto rounded border-2 max-h-[50vh]">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="table-th">{t("table.headers.item")}</th>
                  <th className="table-th w-20 text-right">{t("table.headers.quantity")}</th>
                  <th className="table-th w-28 text-right">{t("table.headers.unitPrice")}</th>
                  <th className="table-th w-24 text-right">{t("table.headers.discount")}</th>
                  <th className="table-th w-32 text-right">{t("table.headers.netUnit")}</th>
                  <th className="table-th w-36 text-right">{t("table.headers.subtotal")}</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((it, i) => {
                  const pct = Math.max(0, Math.min(100, Number(it.discountPct ?? 0)));
                  const unitNet = it.unitNet ?? Math.max(0, it.unitPrice * (1 - pct / 100));
                  return (
                    <tr key={i}>
                      <td className="table-td">{it.name}</td>
                      <td className="table-td text-right">{it.quantity}</td>
                      <td className="table-td text-right">{formatUSD(it.unitPrice)}</td>
                      <td className="table-td text-right">{pct}</td>
                      <td className="table-td text-right">{formatUSD(unitNet)}</td>
                      <td className="table-td text-right">{formatUSD(unitNet * it.quantity)}</td>
                    </tr>
                  );
                })}
                {selectedItems.length === 0 && (
                  <tr>
                    <td className="table-td text-center text-gray-500" colSpan={6}>
                      {t("table.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="rounded-sm border-2 bg-white px-4 py-3 text-right shadow-soft">
              <div className="text-sm text-gray-500">{t("totals.monthly")}</div>
              <div className="text-xl font-semibold text-primary">
                {formatUSD(totalAmount)}
              </div>
            </div>
            <div className="rounded-sm border-2 bg-white px-4 py-3 text-right shadow-soft">
              <div className="text-sm text-gray-500">{t("totals.hours")}</div>
              <div className="text-xl font-semibold">{totalHours}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-gray-200 pt-4">
          <button className="btn-ghost" onClick={onClose} disabled={creating}>
            {t("actions.cancel")}
          </button>
          <button className="btn-primary" onClick={onGenerate} disabled={creating}>
            {creating ? t("actions.generating") : t("actions.generate")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
