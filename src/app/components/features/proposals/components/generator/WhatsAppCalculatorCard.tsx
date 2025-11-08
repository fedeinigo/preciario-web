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
    <div className="card border-2">
      <div className="heading-bar mb-3">{t("title")}</div>
      <div className="space-y-4 p-4">
        <p className="text-sm text-gray-600">{t("description")}</p>

        <div>
          <label className="mb-1 block text-xs text-gray-700">
            {t("fields.subsidiary")}
          </label>
          <input
            className="input h-9 w-full"
            value={subsidiary || sharedT("emptyValue")}
            readOnly
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-700">
            {t("fields.destination")}
          </label>
          <input className="input h-9 w-full" value={selectedCountryLabel} readOnly />
          <p className="mt-1 text-[12px] text-muted">{t("fields.destinationPlaceholder")}</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-700">
              {t("fields.marketing")}
            </label>
            <input
              type="number"
              min={0}
              className="input h-9 w-full"
              value={marketingValue}
              onChange={(event) =>
                handleQuantityChange("marketing", event.target.value)
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-700">
              {t("fields.utility")}
            </label>
            <input
              type="number"
              min={0}
              className="input h-9 w-full"
              value={utilityValue}
              onChange={(event) =>
                handleQuantityChange("utility", event.target.value)
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-700">
              {t("fields.auth")}
            </label>
            <input
              type="number"
              min={0}
              className="input h-9 w-full"
              value={authValue}
              onChange={(event) =>
                handleQuantityChange("auth", event.target.value)
              }
            />
          </div>
        </div>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <button className="btn-ghost" onClick={resetCalculator} disabled={loading}>
            {t("actions.reset")}
          </button>
          <button className="btn-bar" onClick={calculateCredit} disabled={loading}>
            {loading ? t("actions.calculating") : t("actions.calculate")}
          </button>
        </div>

        <div className="rounded-md border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))]/15 px-4 py-3">
          <div className="text-xs text-gray-600">{t("result.label")}</div>
          <div className="text-lg font-semibold text-primary">
            {credit == null ? sharedT("emptyValue") : formatUSD(credit)}
          </div>
        </div>
      </div>
    </div>
  );
}
