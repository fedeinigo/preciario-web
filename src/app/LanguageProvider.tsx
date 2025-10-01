"use client";

import * as React from "react";

import { defaultLocale, locales, storageKey, type Locale } from "@/lib/i18n/config";
import { getMessage } from "@/lib/i18n/messages";

type Replacements = Record<string, string | number>;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Replacements) => string;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
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
    const format = (template: string, replacements?: Replacements) => {
      if (!replacements) return template;
      return Object.entries(replacements).reduce(
        (acc, [token, replacement]) =>
          acc.replace(new RegExp(`\\{${token}\\}`, "g"), String(replacement)),
        template
      );
    };

    return {
      locale,
      setLocale,
      t: (key, replacements) =>
        format(getMessage(locale, key, defaultLocale), replacements),
    };
  }, [locale, setLocale]);


  const value = React.useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string) => getMessage(locale, key, defaultLocale),
    }),
    [locale, setLocale]
  );

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

    (key: string) => t(namespace ? `${namespace}.${key}` : key), 
    [namespace, t]
  );
}
