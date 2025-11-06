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
    <div className="mb-4 rounded-md border-2 border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))]/20 shadow-soft p-4">
      <fieldset>
        <legend className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-700">
          {t("modeLabel")}
        </legend>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {([
            { value: "sync", label: t("options.sync") },
            { value: "skip", label: t("options.skip") },
            { value: "create", label: t("options.create") },
          ] as const).map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 rounded-md border border-transparent bg-white/50 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[rgb(var(--primary))]/40 hover:text-[rgb(var(--primary))]"
            >
              <input
                type="radio"
                name="pipedrive-sync-mode"
                value={option.value}
                checked={mode === option.value}
                onChange={handleModeChange}
                className="h-4 w-4 border-gray-300 text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {syncSelected ? (
        <div className="mt-4">
          <label className="block text-xs text-gray-700 mb-1">
            {t("label")}
            <span className="text-red-600">*</span>
          </label>
          <input
            className="input w-full h-10 ring-2 ring-[rgb(var(--primary))]/40"
            placeholder={t("placeholder", { example })}
            value={value}
            onChange={handleChange}
          />
          <div className="mt-1 text-[12px] text-gray-600">{t("description")}</div>
          {value && !dealId ? (
            <div className="mt-2 text-[12px] text-red-600">{t("invalid")}</div>
          ) : null}
          {dealId ? (
            <div className="mt-2 text-[12px] text-green-700">
              {t("detected")}:
              <strong className="ml-1">{dealId}</strong>
            </div>
          ) : null}
        </div>
      ) : null}

      {createSelected ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {t("notAvailable")}
        </div>
      ) : null}
    </div>
  );
}
