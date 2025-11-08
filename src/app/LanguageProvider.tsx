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
import {
  extractMessage,
  loadMessages,
  getCachedMessages,
  type DeepRecord,
} from "@/lib/i18n/messages";

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
  initialMessages,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialMessages?: DeepRecord;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);
  const initialDict = React.useMemo(() => {
    if (initialMessages) return initialMessages;
    return getCachedMessages(initialLocale);
  }, [initialMessages, initialLocale]);

  const [messagesByLocale, setMessagesByLocale] = React.useState<
    Partial<Record<Locale, DeepRecord>>
  >(() => (initialDict ? { [initialLocale]: initialDict } : {}));
  const loadedLocalesRef = React.useRef<Set<Locale>>(
    new Set(initialDict ? [initialLocale] : [])
  );

  const rememberMessages = React.useCallback(
    (target: Locale, dict: DeepRecord) => {
      loadedLocalesRef.current.add(target);
      setMessagesByLocale((prev) => {
        if (prev[target]) return prev;
        return { ...prev, [target]: dict };
      });
    },
    []
  );

  const ensureMessages = React.useCallback(
    async (target: Locale) => {
      if (loadedLocalesRef.current.has(target)) return;
      try {
        const dict = await loadMessages(target);
        rememberMessages(target, dict);
      } catch {
        // Silently ignore load errors; t() will fallback to key.
      }
    },
    [rememberMessages]
  );

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
      void ensureMessages(stored);
    }
  }, [persistLocale, ensureMessages]);

  React.useEffect(() => {
    void ensureMessages(initialLocale);
    if (initialLocale !== defaultLocale) {
      void ensureMessages(defaultLocale);
    }
  }, [initialLocale, ensureMessages]);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
    void ensureMessages(next);
  }, [persistLocale, ensureMessages]);

  React.useEffect(() => {
    try {
      globalThis?.document?.documentElement?.setAttribute("lang", locale);
    } catch {}
  }, [locale]);

  const value = React.useMemo<LanguageContextValue>(() => {
    const resolve = (key: string): string => {
      const primary = extractMessage(messagesByLocale[locale], key);
      const fallback =
        locale !== defaultLocale
          ? extractMessage(messagesByLocale[defaultLocale], key)
          : undefined;
      return primary ?? fallback ?? key;
    };

    return {
      locale,
      setLocale,
      t: (key, replacements) =>
        formatMessage(resolve(key), locale, replacements),
    };
  }, [locale, messagesByLocale, setLocale]);
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
