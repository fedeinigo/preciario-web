"use client";

import * as React from "react";

import {
  defaultLocale,
  localeCookieName,
  normalizeLocale,
  storageKey,
  type Locale,
} from "@/lib/i18n/config";
import { formatMessage } from "@/lib/i18n/formatMessage";
import { getMessage } from "@/lib/i18n/messages";

type Replacements = Record<string, string | number>;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Replacements) => string;
};

const LanguageContext = React.createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);
  const persistLocale = React.useCallback((next: Locale) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage?.setItem(storageKey, next);
    } catch {}
    try {
      const doc = window.document;
      if (!doc) return;
      const expiration = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
      doc.cookie = `${localeCookieName}=${next};path=/;expires=${expiration.toUTCString()}`;
    } catch {}
  }, []);

  React.useEffect(() => {
    const stored = normalizeLocale(globalThis?.localStorage?.getItem(storageKey));
    if (stored) {
      setLocaleState(stored);
      persistLocale(stored);
    }
  }, [persistLocale]);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, [persistLocale]);

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
