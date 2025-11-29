"use client";

import * as React from "react";

export type PipedriveSyncMode = "sync" | "skip" | "create";

interface PipedriveCardProps {
  value: string;
  dealId: string;
  example: string;
  mode: PipedriveSyncMode;
  onChange: (next: string) => void;
  onModeChange: (mode: PipedriveSyncMode) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const cardStyles: React.CSSProperties = {
  borderRadius: "0.75rem",
  border: "1px solid var(--form-card-border, #d8b4fe)",
  backgroundColor: "rgb(var(--surface-primary, 255 255 255))",
  boxShadow: "var(--shadow-md)",
  overflow: "hidden",
};

const headerStyles: React.CSSProperties = {
  backgroundColor: "var(--form-card-header-bg, #4c1d95)",
  padding: "0.75rem 1.25rem",
  borderBottom: "1px solid var(--form-card-header-bg, #4c1d95)",
};

const headerTextStyles: React.CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "var(--form-card-header-text, #ffffff)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputStyles: React.CSSProperties = {
  width: "100%",
  height: "2.75rem",
  borderRadius: "0.5rem",
  border: "1px solid var(--form-card-border, #d8b4fe)",
  backgroundColor: "var(--form-input-bg, #ffffff)",
  padding: "0 0.75rem",
  fontSize: "0.875rem",
  color: "var(--form-input-text, #0f172a)",
};

const radioLabelStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  borderRadius: "0.5rem",
  border: "1px solid rgb(var(--border-primary, 226 232 240))",
  backgroundColor: "var(--form-input-bg, #ffffff)",
  padding: "0.625rem 1rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "rgb(var(--text-secondary, 71 85 105))",
  boxShadow: "var(--shadow-sm)",
  cursor: "pointer",
};

export default function PipedriveCard({
  value,
  dealId,
  example,
  mode,
  onChange,
  onModeChange,
  t,
}: PipedriveCardProps) {
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  const handleModeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onModeChange(event.target.value as PipedriveSyncMode);
    },
    [onModeChange]
  );

  const syncSelected = mode === "sync";
  const createSelected = mode === "create";

  return (
    <div style={cardStyles}>
      <div style={headerStyles}>
        <h3 style={headerTextStyles}>{t("modeLabel")}</h3>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-white p-5">
        <fieldset>
          <legend className="sr-only">{t("modeLabel")}</legend>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            {([
              { value: "sync", label: t("options.sync") },
              { value: "skip", label: t("options.skip") },
              { value: "create", label: t("options.create") },
            ] as const).map((option) => (
              <label
                key={option.value}
                style={radioLabelStyles}
                className="transition hover:border-[var(--form-input-focus-border)] hover:bg-[var(--form-card-section-bg)] hover:text-[var(--form-radio-checked)]"
              >
                <input
                  type="radio"
                  name="pipedrive-sync-mode"
                  value={option.value}
                  checked={mode === option.value}
                  onChange={handleModeChange}
                  className="h-4 w-4 focus:ring-2"
                  style={{ borderColor: "var(--form-radio-border, #cbd5e1)", accentColor: "var(--form-radio-checked, #9333ea)" }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {syncSelected ? (
          <div className="mt-5">
            <label 
              className="block text-xs font-medium mb-2"
              style={{ color: "var(--form-label-text, #334155)" }}
            >
              {t("label")}
              <span className="ml-0.5" style={{ color: "rgb(var(--status-error, 239 68 68))" }}>*</span>
            </label>
            <input
              style={inputStyles}
              className="transition focus:outline-none focus:ring-2"
              placeholder={t("placeholder", { example })}
              value={value}
              onChange={handleChange}
            />
            <div 
              className="mt-2 text-xs"
              style={{ color: "rgb(var(--text-secondary, 71 85 105))" }}
            >
              {t("description")}
            </div>
            {value && !dealId ? (
              <div 
                className="mt-2 rounded-md px-3 py-2 text-xs font-medium"
                style={{ 
                  backgroundColor: "rgba(var(--status-error), 0.1)",
                  border: "1px solid rgba(var(--status-error), 0.3)",
                  color: "rgb(var(--status-error, 239 68 68))"
                }}
              >
                {t("invalid")}
              </div>
            ) : null}
            {dealId ? (
              <div 
                className="mt-2 rounded-md px-3 py-2 text-xs font-medium"
                style={{ 
                  backgroundColor: "rgba(var(--status-success), 0.1)",
                  border: "1px solid rgba(var(--status-success), 0.3)",
                  color: "rgb(var(--status-success, 34 197 94))"
                }}
              >
                {t("detected")}:
                <strong className="ml-1">{dealId}</strong>
              </div>
            ) : null}
          </div>
        ) : null}

        {createSelected ? (
          <div 
            className="mt-5 rounded-lg px-4 py-3 text-sm font-medium"
            style={{ 
              backgroundColor: "rgba(var(--status-error), 0.1)",
              border: "1px solid rgba(var(--status-error), 0.3)",
              color: "rgb(var(--status-error, 239 68 68))"
            }}
          >
            {t("notAvailable")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
