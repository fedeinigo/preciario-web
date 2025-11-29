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

const cardStyles: React.CSSProperties = {
  borderRadius: "0.75rem",
  border: "1px solid rgb(var(--border-primary, 226 232 240))",
  backgroundColor: "rgb(var(--surface-primary, 255 255 255))",
  boxShadow: "var(--shadow-md)",
  overflow: "hidden",
};

const headerStyles: React.CSSProperties = {
  backgroundColor: "var(--form-card-header-bg, #4c1d95)",
  padding: "0.75rem 1rem",
  borderBottom: "1px solid var(--form-card-header-bg, #4c1d95)",
};

const headerTextStyles: React.CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "var(--form-card-header-text, #ffffff)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const sectionStyles: React.CSSProperties = {
  borderRadius: "0.5rem",
  border: "1px solid var(--form-card-section-border, #e9d5ff)",
  backgroundColor: "var(--form-card-section-bg, rgba(243, 232, 255, 0.3))",
  padding: "1rem",
};

const labelStyles: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 500,
  color: "var(--form-label-text, #334155)",
  marginBottom: "0.5rem",
};

const inputStyles: React.CSSProperties = {
  width: "100%",
  height: "2.5rem",
  borderRadius: "0.5rem",
  border: "1px solid rgb(var(--border-primary, 226 232 240))",
  backgroundColor: "var(--form-input-bg, #ffffff)",
  padding: "0 0.75rem",
  fontSize: "0.875rem",
  color: "var(--form-input-text, #0f172a)",
  boxShadow: "var(--shadow-sm)",
};

const readonlyInputStyles: React.CSSProperties = {
  ...inputStyles,
  backgroundColor: "rgb(var(--surface-secondary, 248 250 252))",
  color: "rgb(var(--text-secondary, 71 85 105))",
};

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
    <div style={cardStyles}>
      <div style={headerStyles}>
        <h3 style={headerTextStyles}>{t("title")}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
        <div style={sectionStyles} className="transition hover:shadow-sm">
          <label style={labelStyles}>{t("name.label")}</label>
          <input
            style={inputStyles}
            className="transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            placeholder={t("name.placeholder")}
            value={companyName}
            onChange={(event) => onCompanyNameChange(event.target.value)}
          />
        </div>

        <div style={sectionStyles} className="transition hover:shadow-sm">
          <label style={labelStyles}>{t("country.label")}</label>
          <Combobox
            options={countryOptions}
            value={country}
            onChange={onCountryChange}
            placeholder={t("country.placeholder")}
          />
        </div>

        <div style={sectionStyles} className="transition hover:shadow-sm">
          <label style={labelStyles}>{t("subsidiary.label")}</label>
          <input 
            style={readonlyInputStyles}
            value={subsidiary || emptyValue} 
            readOnly 
          />
          <p 
            className="mt-2 text-xs"
            style={{ color: "rgb(var(--text-secondary, 71 85 105))" }}
          >
            {t("subsidiary.helper")}
          </p>
        </div>
      </div>
    </div>
  );
}
