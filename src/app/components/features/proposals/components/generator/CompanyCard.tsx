"use client";

import * as React from "react";

import Combobox from "@/app/components/ui/Combobox";
import { COUNTRY_NAMES } from "../../lib/catalogs";

interface CompanyCardProps {
  companyName: string;
  onCompanyNameChange: (value: string) => void;
  country: string;
  onCountryChange: (value: string) => void;
  subsidiary: string;
  emptyValue: string;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

export default function CompanyCard({
  companyName,
  onCompanyNameChange,
  country,
  onCountryChange,
  subsidiary,
  emptyValue,
  t,
}: CompanyCardProps) {
  return (
    <div className="mb-4 rounded-md border-2 bg-white shadow-soft overflow-hidden">
      <div className="heading-bar-sm">{t("title")}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div className="rounded-md border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))]/20 p-3">
          <label className="block text-xs text-gray-700 mb-1">{t("name.label")}</label>
          <input
            className="input w-full h-10"
            placeholder={t("name.placeholder")}
            value={companyName}
            onChange={(event) => onCompanyNameChange(event.target.value)}
          />
        </div>

        <div className="rounded-md border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))]/20 p-3">
          <label className="block text-xs text-gray-700 mb-1">{t("country.label")}</label>
          <Combobox
            options={COUNTRY_NAMES}
            value={country}
            onChange={onCountryChange}
            placeholder={t("country.placeholder")}
          />
        </div>

        <div className="rounded-md border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))]/20 p-3">
          <label className="block text-xs text-gray-700 mb-1">{t("subsidiary.label")}</label>
          <input className="input w-full h-10" value={subsidiary || emptyValue} readOnly />
          <p className="mt-1 text-[12px] text-gray-600">{t("subsidiary.helper")}</p>
        </div>
      </div>
    </div>
  );
}
