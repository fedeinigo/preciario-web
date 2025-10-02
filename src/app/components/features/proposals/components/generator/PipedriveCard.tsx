"use client";

import * as React from "react";

interface PipedriveCardProps {
  value: string;
  dealId: string;
  example: string;
  onChange: (next: string) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

export default function PipedriveCard({
  value,
  dealId,
  example,
  onChange,
  t,
}: PipedriveCardProps) {
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  return (
    <div className="mb-4 rounded-md border-2 border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))]/20 shadow-soft p-4">
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
          {t("detected")}: <strong>{dealId}</strong>
        </div>
      ) : null}
    </div>
  );
}
