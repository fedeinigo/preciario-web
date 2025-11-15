"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslations } from "@/app/LanguageProvider";

import { formatUSD } from "../../lib/format";
import { priceWhatsApp } from "../../lib/pricingClient";
import type { ProposalErrorCode } from "../../lib/errors";

type CalculatorProps = {
  subsidiary: string;
  defaultCountry: string;
  resolveErrorMessage: (error: unknown, fallback: ProposalErrorCode) => string;
};

type ConversationTotals = {
  marketing: number;
  utility: number;
  auth: number;
};

const ZERO_TOTALS: ConversationTotals = { marketing: 0, utility: 0, auth: 0 };

export default function WhatsAppCalculatorCard({
  subsidiary,
  defaultCountry,
  resolveErrorMessage,
}: CalculatorProps) {
  const t = useTranslations("proposals.generator.whatsappCalculator");
  const sharedT = useTranslations("proposals.generator");
  const countriesT = useTranslations("proposals.countries");

  const [destCountry, setDestCountry] = useState(defaultCountry);
  const [quantities, setQuantities] = useState<ConversationTotals>(ZERO_TOTALS);
  const [credit, setCredit] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDestCountry(defaultCountry);
  }, [defaultCountry]);

  const selectedCountryLabel = useMemo(() => {
    if (!destCountry) return sharedT("emptyValue");
    return countriesT(destCountry) || destCountry;
  }, [destCountry, countriesT, sharedT]);

  const handleQuantityChange = useCallback(
    (key: keyof ConversationTotals, raw: string) => {
      const numeric = Number(raw);
      setQuantities((prev) => ({
        ...prev,
        [key]: Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0,
      }));
    },
    []
  );

  const resetCalculator = useCallback(() => {
    setQuantities(ZERO_TOTALS);
    setCredit(null);
    setError("");
  }, []);

  const { marketing, utility, auth } = quantities;

  const calculateCredit = useCallback(async () => {
    if (!marketing && !utility && !auth) {
      setCredit(0);
      setError("");
      return;
    }

    if (!subsidiary) {
      setError(t("errors.missingSubsidiary"));
      return;
    }

    const targetCountry = destCountry || defaultCountry;
    if (!targetCountry) {
      setError(t("errors.missingCountry"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      let total = 0;

      if (marketing > 0) {
        const pricing = await priceWhatsApp({
          subsidiary,
          destCountry: targetCountry,
          kind: "marketing",
          qty: marketing,
        });
        total += pricing.totalAmount;
      }

      if (utility > 0) {
        const pricing = await priceWhatsApp({
          subsidiary,
          destCountry: targetCountry,
          kind: "utility",
          qty: utility,
        });
        total += pricing.totalAmount;
      }

      if (auth > 0) {
        const pricing = await priceWhatsApp({
          subsidiary,
          destCountry: targetCountry,
          kind: "auth",
          qty: auth,
        });
        total += pricing.totalAmount;
      }

      setCredit(total);
    } catch (err) {
      const message = resolveErrorMessage(err, "pricing.whatsAppFailed");
      setError(message);
      setCredit(null);
    } finally {
      setLoading(false);
    }
  }, [
    defaultCountry,
    destCountry,
    marketing,
    utility,
    auth,
    resolveErrorMessage,
    subsidiary,
    t,
  ]);

  const marketingValue = quantities.marketing === 0 ? "" : String(quantities.marketing);
  const utilityValue = quantities.utility === 0 ? "" : String(quantities.utility);
  const authValue = quantities.auth === 0 ? "" : String(quantities.auth);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg backdrop-blur-sm overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-4 py-3">
        <h3 className="text-base font-bold text-white">{t("title")}</h3>
      </div>
      <div className="space-y-4 p-5">
        <p className="text-sm text-slate-600">{t("description")}</p>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-700">
            {t("fields.subsidiary")}
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm text-slate-600 shadow-sm"
            value={subsidiary || sharedT("emptyValue")}
            readOnly
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-700">
            {t("fields.destination")}
          </label>
          <input className="h-10 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm text-slate-600 shadow-sm" value={selectedCountryLabel} readOnly />
          <p className="mt-1 text-xs text-slate-500">{t("fields.destinationPlaceholder")}</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">
              {t("fields.marketing")}
            </label>
            <input
              type="number"
              min={0}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20"
              value={marketingValue}
              onChange={(event) =>
                handleQuantityChange("marketing", event.target.value)
              }
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">
              {t("fields.utility")}
            </label>
            <input
              type="number"
              min={0}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20"
              value={utilityValue}
              onChange={(event) =>
                handleQuantityChange("utility", event.target.value)
              }
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">
              {t("fields.auth")}
            </label>
            <input
              type="number"
              min={0}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20"
              value={authValue}
              onChange={(event) =>
                handleQuantityChange("auth", event.target.value)
              }
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-50" onClick={resetCalculator} disabled={loading}>
            {t("actions.reset")}
          </button>
          <button className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:from-green-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-green-400/50 disabled:opacity-50" onClick={calculateCredit} disabled={loading}>
            {loading ? t("actions.calculating") : t("actions.calculate")}
          </button>
        </div>

        <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white px-4 py-3 shadow-sm">
          <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t("result.label")}</div>
          <div className="mt-1 text-xl font-bold text-green-700">
            {credit == null ? sharedT("emptyValue") : formatUSD(credit)}
          </div>
        </div>
      </div>
    </div>
  );
}
