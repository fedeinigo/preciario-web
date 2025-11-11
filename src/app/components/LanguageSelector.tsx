"use client";

import { useLanguage, useTranslations } from "../LanguageProvider";

type LocaleOption = {
  value: "es" | "en" | "pt";
  flag: string;
  labelKey: "spanish" | "english" | "portuguese";
  aria: string;
};

const OPTIONS: LocaleOption[] = [
  { value: "es", flag: "🇦🇷", labelKey: "spanish", aria: "Español" },
  { value: "en", flag: "🇺🇸", labelKey: "english", aria: "English" },
  { value: "pt", flag: "🇧🇷", labelKey: "portuguese", aria: "Português" },
];

export default function LanguageSelector({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  const t = useTranslations("common.language");

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="sr-only">{t("label")}</span>
      {OPTIONS.map((option) => {
        const active = locale === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={t(option.labelKey)}
            title={option.aria}
            onClick={() => setLocale(option.value)}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
              active
                ? "border-white bg-white text-gray-900 shadow"
                : "border-white/30 bg-transparent text-white hover:bg-white/10"
            }`}
          >
            <span className="text-lg leading-none">{option.flag}</span>
          </button>
        );
      })}
    </div>
  );
}
