"use client";

import * as React from "react";

import type { Locale } from "@/lib/i18n/config";
import type { UIItem } from "../lib/types";
import { fetchCatalogItems, fetchItemsPopularity } from "../lib/items";
import type { ProposalError } from "../lib/errors";
import { isProposalError } from "../lib/errors";

const itemsCache = new Map<Locale, UIItem[]>();
const popularityCache = new Map<Locale, Record<string, number>>();

const STORAGE_KEY = "proposals.catalogCache.v1";
const CACHE_TTL_MS = 1000 * 60 * 30;

function sanitizeItemsForStorage(data: UIItem[]): UIItem[] {
  return data.map((item) => ({
    ...item,
    selected: false,
    quantity: item.quantity ?? 1,
    discountPct: item.discountPct ?? 0,
  }));
}

function readStorage(): Record<string, { items: UIItem[]; popularity: Record<string, number>; timestamp: number }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { items: UIItem[]; popularity: Record<string, number>; timestamp: number }>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorage(data: Record<string, { items: UIItem[]; popularity: Record<string, number>; timestamp: number }>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

function hydrateLocaleFromStorage(locale: Locale) {
  if (itemsCache.has(locale)) return;
  const store = readStorage();
  const entry = store[locale];
  if (!entry) return;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    delete store[locale];
    writeStorage(store);
    return;
  }
  const items = sanitizeItemsForStorage(entry.items ?? []);
  itemsCache.set(locale, items);
  popularityCache.set(locale, entry.popularity ?? {});
}

function clearAllLocalesExcept(locale: Locale) {
  for (const key of Array.from(itemsCache.keys())) {
    if (key !== locale) {
      itemsCache.delete(key);
    }
  }

  for (const key of Array.from(popularityCache.keys())) {
    if (key !== locale) {
      popularityCache.delete(key);
    }
  }

  if (typeof window === "undefined") return;
  const store = readStorage();
  const retained = store[locale];
  if (retained) {
    writeStorage({ [locale]: retained });
  } else if (Object.keys(store).length > 0) {
    writeStorage({});
  }
}

function persistLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  const items = itemsCache.get(locale);
  if (!items) {
    writeStorage({});
    return;
  }
  const popularity = popularityCache.get(locale) ?? {};
  const entry = {
    items: sanitizeItemsForStorage(items),
    popularity: { ...popularity },
    timestamp: Date.now(),
  };
  writeStorage({ [locale]: entry });
}

function invalidateLocale(locale: Locale) {
  itemsCache.delete(locale);
  popularityCache.delete(locale);
  if (typeof window !== "undefined") {
    const store = readStorage();
    if (store[locale]) {
      delete store[locale];
      writeStorage(store);
    }
  }
}

function cloneItems(data: UIItem[]): UIItem[] {
  return structuredClone(data);
}

function clonePopularity(data: Record<string, number>): Record<string, number> {
  return structuredClone(data);
}

export type CatalogState = {
  items: UIItem[];
  setItems: React.Dispatch<React.SetStateAction<UIItem[]>>;
  mutateItems: (updater: React.SetStateAction<UIItem[]>) => void;
  popularity: Record<string, number>;
  setPopularity: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  mutatePopularity: (
    updater: React.SetStateAction<Record<string, number>>
  ) => void;
  loading: boolean;
  error: ProposalError | null;
  refresh: () => Promise<void>;
};

export function useCatalogData(
  locale: Locale,
  onError?: (error: ProposalError) => void
): CatalogState {
  hydrateLocaleFromStorage(locale);

  const [items, setItemsState] = React.useState<UIItem[]>(() => {
    const cached = itemsCache.get(locale);
    return cached ? cloneItems(cached) : [];
  });

  const [popularity, setPopularityState] = React.useState<Record<string, number>>(() => {
    const cached = popularityCache.get(locale);
    return cached ? clonePopularity(cached) : {};
  });

  const [loading, setLoading] = React.useState(!itemsCache.has(locale));
  const [error, setError] = React.useState<ProposalError | null>(null);

  const setItems = React.useCallback<React.Dispatch<React.SetStateAction<UIItem[]>>>(
    (updater) => {
      setItemsState((prev) => {
        const next =
          typeof updater === "function" ? (updater as (value: UIItem[]) => UIItem[])(prev) : updater;
        const snapshot = cloneItems(next);
        itemsCache.set(locale, snapshot);
        persistLocale(locale);
        return snapshot;
      });
    },
    [locale]
  );

  const mutateItems = React.useCallback(
    (updater: React.SetStateAction<UIItem[]>) => {
      clearAllLocalesExcept(locale);
      setItems(updater);
    },
    [locale, setItems]
  );

  const setPopularity = React.useCallback<
    React.Dispatch<React.SetStateAction<Record<string, number>>>
  >(
    (updater) => {
      setPopularityState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (value: Record<string, number>) => Record<string, number>)(prev)
            : updater;
        const snapshot = clonePopularity(next);
        popularityCache.set(locale, snapshot);
        persistLocale(locale);
        return snapshot;
      });
    },
    [locale]
  );

  const mutatePopularity = React.useCallback(
    (updater: React.SetStateAction<Record<string, number>>) => {
      clearAllLocalesExcept(locale);
      setPopularity(updater);
    },
    [locale, setPopularity]
  );

  const handleError = React.useCallback(
    (unknownError: unknown) => {
      if (isProposalError(unknownError)) {
        setError(unknownError);
        onError?.(unknownError);
      } else {
        const fallback: ProposalError = { kind: "code", code: "catalog.loadFailed" };
        setError(fallback);
        onError?.(fallback);
      }
    },
    [onError]
  );

  const fetchData = React.useCallback(
    async (signal?: AbortSignal) => {
      const [itemsResponse, popularityResponse] = await Promise.all([
        fetchCatalogItems(locale, signal),
        fetchItemsPopularity(signal),
      ]);
      const itemsSnapshot = cloneItems(itemsResponse);
      const popularitySnapshot = clonePopularity(popularityResponse);
      itemsCache.set(locale, itemsSnapshot);
      popularityCache.set(locale, popularitySnapshot);
      persistLocale(locale);
      setItemsState(itemsSnapshot);
      setPopularityState(popularitySnapshot);
    },
    [locale]
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchData();
    } catch (unknownError) {
      handleError(unknownError);
    } finally {
      setLoading(false);
    }
  }, [fetchData, handleError]);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    if (itemsCache.has(locale)) {
      setItemsState(cloneItems(itemsCache.get(locale)!));
      setPopularityState(clonePopularity(popularityCache.get(locale) ?? {}));
      setLoading(false);
    } else {
      setLoading(true);
      setError(null);
      (async () => {
        try {
          await fetchData(controller.signal);
          if (cancelled) return;
        } catch (unknownError) {
          if (unknownError instanceof DOMException && unknownError.name === "AbortError") {
            return;
          }
          if (cancelled) return;
          handleError(unknownError);
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [fetchData, handleError, locale]);

  const refresh = React.useCallback(async () => {
    invalidateLocale(locale);
    await load();
  }, [locale, load]);

  return {
    items,
    setItems,
    mutateItems,
    popularity,
    setPopularity,
    mutatePopularity,
    loading,
    error,
    refresh,
  };
}

export default useCatalogData;
