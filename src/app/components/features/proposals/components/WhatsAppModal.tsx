"use client";

import { useCallback, useMemo } from "react";

import Modal from "@/app/components/ui/Modal";
import Combobox from "@/app/components/ui/Combobox";

import { useLanguage, useTranslations } from "@/app/LanguageProvider";
import { getLocalizedCountries } from "../lib/catalogs";

/** === Tipos expuestos para que Generator.tsx los importe === */
export type WppKind = "marketing" | "utility" | "auth";
export type WppForm = { qty: number; destCountry: string };

export function WhatsAppModal({
  open,
  kind,
  form,
  billingSubsidiary,
  onChange,
  onApply,
  onClose,
  error,
  applying = false,
}: {
  open: boolean;
  kind: WppKind;
  form: WppForm;
  /** Filial seteada por el país de la propuesta (solo lectura en el modal) */
  billingSubsidiary: string;
  onChange: (next: Partial<WppForm>) => void;
  onApply: () => void;
  onClose: () => void;
  error?: string;
  applying?: boolean;
}) {
  const { locale } = useLanguage();
  const t = useTranslations("proposals.whatsAppModal");
  const sharedT = useTranslations("proposals.generator");
  const emptyValue = sharedT("emptyValue");
  const kindLabel = t(`kinds.${kind}`);

  const countries = useMemo(() => getLocalizedCountries(locale), [locale]);
  const countryOptions = useMemo(() => countries.map((country) => country.label), [countries]);
  const selectedCountryLabel = useMemo(() => {
    if (!form.destCountry) return "";
    return (
      countries.find((country) => country.id === form.destCountry)?.label || form.destCountry
    );
  }, [countries, form.destCountry]);

  const handleCountryChange = useCallback(
    (label: string) => {
      const match = countries.find((country) => country.label === label);
      if (match) {
        onChange({ destCountry: match.id });
      }
    },
    [countries, onChange]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("title")}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose} disabled={applying}>
            {t("actions.cancel")}
          </button>
          <button className="btn-primary" onClick={onApply} disabled={applying}>
            {applying ? t("actions.calculating") : t("actions.apply")}
          </button>
        </div>
      }
    >
      <div className="relative space-y-4">
        {/* Encabezado con badge */}
        <div className="flex items-center justify-between">
          <span className="chip">{t("badge", { kind: kindLabel })}</span>
          <span className="text-xs text-muted">{t("hint")}</span>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Qty con sufijo */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">{kindLabel}</label>
            <div className="relative">
              <input
                className="input pr-16"
                type="number"
                min={0}
                value={form.qty}
                onChange={(e) => onChange({ qty: Math.max(0, Number(e.target.value || 0)) })}
                disabled={applying}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {t("fields.qtySuffix")}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-muted">{t("fields.qtyHelp")}</p>
          </div>

          {/* País destino (lista propia) */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t("fields.countryLabel")}</label>
            <Combobox
              options={countryOptions}
              value={selectedCountryLabel}
              onChange={handleCountryChange}
              placeholder={t("fields.countryPlaceholder")}
            />
            <p className="mt-1 text-[12px] text-muted">{t("fields.countryHelp")}</p>
          </div>

          {/* Filial de facturación (solo lectura) */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">{t("fields.billingLabel")}</label>
            <input className="input" value={billingSubsidiary || emptyValue} readOnly />
            <p className="mt-1 text-[12px] text-muted">{t("fields.billingHelp")}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Overlay de espera (tapa todo el modal content) */}
        {applying && (
          <div className="absolute inset-0 z-[60] rounded-sm bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-700">
              <span className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
              <span>{t("loading")}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
