"use client";

import { locales } from "@/lib/i18n/config";

import { useLanguage, useTranslations } from "../LanguageProvider";

export default function LanguageSelector({
  className = "",
}: {
  className?: string;
}) {
  const { locale, setLocale } = useLanguage();
  const t = useTranslations("common.language");

  return (
    <label className={`flex flex-col gap-1 text-xs ${className}`}>
      <span className="font-semibold uppercase tracking-wide">{t("label")}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as (typeof locales)[number])}
        className="rounded-md border border-white/15 bg-white/90 px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-white focus:outline-none"
      >
        <option value="es">{t("spanish")}</option>
        <option value="en">{t("english")}</option>
        <option value="pt">{t("portuguese")}</option>
      </select>
    </label>
  );
}
