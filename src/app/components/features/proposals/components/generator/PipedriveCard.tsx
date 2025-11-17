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
    <div className="rounded-xl border border-purple-300 bg-white shadow-md overflow-hidden">
      <div className="bg-[#4c1d95] px-5 py-3 border-b border-[#4c1d95]">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">{t("modeLabel")}</h3>
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
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 cursor-pointer"
              >
                <input
                  type="radio"
                  name="pipedrive-sync-mode"
                  value={option.value}
                  checked={mode === option.value}
                  onChange={handleModeChange}
                  className="h-4 w-4 border-slate-300 text-purple-600 focus:ring-2 focus:ring-purple-400/20"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {syncSelected ? (
          <div className="mt-5">
            <label className="block text-xs font-medium text-slate-700 mb-2">
              {t("label")}
              <span className="text-red-600 ml-0.5">*</span>
            </label>
            <input
              className="w-full h-11 rounded-lg border border-purple-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
              placeholder={t("placeholder", { example })}
              value={value}
              onChange={handleChange}
            />
            <div className="mt-2 text-xs text-slate-600">{t("description")}</div>
            {value && !dealId ? (
              <div className="mt-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700">{t("invalid")}</div>
            ) : null}
            {dealId ? (
              <div className="mt-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-xs font-medium text-green-700">
                {t("detected")}:
                <strong className="ml-1">{dealId}</strong>
              </div>
            ) : null}
          </div>
        ) : null}

        {createSelected ? (
          <div className="mt-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {t("notAvailable")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
