"use client";

import * as React from "react";

import { defaultLocale, locales, storageKey, type Locale } from "@/lib/i18n/config";
import { formatMessage } from "@/lib/i18n/formatMessage";
import { getMessage } from "@/lib/i18n/messages";

type Replacements = Record<string, string | number>;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Replacements) => string;
};

const LanguageContext = React.createContext<LanguageContextValue | undefined>(
  undefined
);

function normalizeLocale(value: string | null): Locale | null {
  if (!value) return null;
  return locales.includes(value as Locale) ? (value as Locale) : null;
}

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(defaultLocale);

  React.useEffect(() => {
    const stored = normalizeLocale(globalThis?.localStorage?.getItem(storageKey));
    if (stored) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      globalThis?.localStorage?.setItem(storageKey, next);
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      globalThis?.document?.documentElement?.setAttribute("lang", locale);
    } catch {}
  }, [locale]);

  const value = React.useMemo<LanguageContextValue>(() => {
    return {
      locale,
      setLocale,
      t: (key, replacements) =>
        formatMessage(getMessage(locale, key, defaultLocale), locale, replacements),
    };
  }, [locale, setLocale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

export function useTranslations(namespace?: string) {
  const { t } = useLanguage();
  return React.useCallback(
    (key: string, replacements?: Replacements) =>
      t(namespace ? `${namespace}.${key}` : key, replacements),
    [namespace, t]
  );
}
