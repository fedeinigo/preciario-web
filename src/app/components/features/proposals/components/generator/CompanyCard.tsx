"use client";

import * as React from "react";

import Combobox from "@/app/components/ui/Combobox";

interface CompanyCardProps {
  companyName: string;
  onCompanyNameChange: (value: string) => void;
  country: string;
  onCountryChange: (value: string) => void;
  subsidiary: string;
  emptyValue: string;
  countryOptions: { value: string; label: string }[];
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

export default function CompanyCard({
  companyName,
  onCompanyNameChange,
  country,
  onCountryChange,
  subsidiary,
  emptyValue,
  countryOptions,
  t,
}: CompanyCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
      <div className="bg-[#4c1d95] px-4 py-3 border-b border-[#4c1d95]">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">{t("title")}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
        <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-4 transition hover:shadow-sm">
          <label className="block text-xs font-medium text-slate-700 mb-2">{t("name.label")}</label>
          <input
            className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            placeholder={t("name.placeholder")}
            value={companyName}
            onChange={(event) => onCompanyNameChange(event.target.value)}
          />
        </div>

        <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-4 transition hover:shadow-sm">
          <label className="block text-xs font-medium text-slate-700 mb-2">{t("country.label")}</label>
          <Combobox
            options={countryOptions}
            value={country}
            onChange={onCountryChange}
            placeholder={t("country.placeholder")}
          />
        </div>

        <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-4 transition hover:shadow-sm">
          <label className="block text-xs font-medium text-slate-700 mb-2">{t("subsidiary.label")}</label>
          <input className="w-full h-10 rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm text-slate-600 shadow-sm" value={subsidiary || emptyValue} readOnly />
          <p className="mt-2 text-xs text-slate-600">{t("subsidiary.helper")}</p>
        </div>
      </div>
    </div>
  );
}
