// src/app/components/features/proposals/lib/items.ts
import type { Locale } from "@/lib/i18n/config";
import type { UIItem } from "./types";
import type { ItemFormData } from "@/app/components/ui/ItemForm";
import {
  createProposalCodeError,
  isProposalError,
  parseProposalErrorResponse,
} from "./errors";
import { defaultLocale } from "@/lib/i18n/config";

type ItemTranslations = Record<Locale, {
  name: string;
  description: string;
  category: string;
}>;

type CatalogRow = {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unitPrice: number;
  devHours: number;
  active: boolean;
  translations: ItemTranslations;
};

export function getInitialItems(): UIItem[] {
  return [];
}

export async function fetchCatalogItems(
  locale: Locale,
  signal?: AbortSignal
): Promise<UIItem[]> {
  try {
    const res = await fetch(`/api/items?locale=${locale}`, {
      cache: "no-store",
      signal,
    });
    if (!res.ok) {
      throw await parseProposalErrorResponse(res, "catalog.loadFailed");
    }
    const data = (await res.json()) as CatalogRow[];
    return data.map(toUIItem);
  } catch (error) {
    if (isProposalError(error)) throw error;
    throw createProposalCodeError("catalog.loadFailed");
  }
}

// Popularidad desde API (itemId -> totalQty)
export async function fetchItemsPopularity(
  signal?: AbortSignal
): Promise<Record<string, number>> {
  const res = await fetch("/api/items/popularity", { cache: "no-store", signal });
  if (!res.ok) return {};
  return (await res.json()) as Record<string, number>;
}

export async function createCatalogItem(
  locale: Locale,
  data: ItemFormData
): Promise<UIItem> {
  try {
    const res = await fetch(`/api/items?locale=${locale}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serializeItemPayload(data)),
    });
    if (!res.ok) {
      throw await parseProposalErrorResponse(res, "catalog.createFailed");
    }
    const created = (await res.json()) as CatalogRow;
    return toUIItem(created);
  } catch (error) {
    if (isProposalError(error)) throw error;
    throw createProposalCodeError("catalog.createFailed");
  }
}

export async function updateCatalogItem(
  id: string,
  data: ItemFormData
): Promise<void> {
  try {
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serializeItemPayload(data)),
    });
    if (!res.ok) {
      throw await parseProposalErrorResponse(res, "catalog.updateFailed");
    }
  } catch (error) {
    if (isProposalError(error)) throw error;
    throw createProposalCodeError("catalog.updateFailed");
  }
}

export async function deleteCatalogItem(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      throw await parseProposalErrorResponse(res, "catalog.deleteFailed");
    }
  } catch (error) {
    if (isProposalError(error)) throw error;
    throw createProposalCodeError("catalog.deleteFailed");
  }
}

function serializeItemPayload(data: ItemFormData) {
  const entries = Object.entries(data.translations);
  const base = data.translations[defaultLocale];

  const translations = entries
    .filter(([localeCode, value]) => {
      if (localeCode === defaultLocale) return true;
      const name = value.name?.trim() ?? "";
      const category = value.category?.trim() ?? "";
      const description = value.description?.trim() ?? "";
      return Boolean(name || category || description);
    })
    .map(([locale, value]) => ({
      locale,
      name: value.name,
      category: value.category,
      description: value.description,
    }));

  return {
    sku: data.sku,
    unitPrice: data.unitPrice,
    devHours: data.devHours,
    name: base?.name,
    category: base?.category,
    description: base?.description ?? "",
    translations,
  };
}

function toUIItem(row: CatalogRow): UIItem {
  return {
    id: row.id,
    dbId: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    category: row.category,
    unitPrice: row.unitPrice,
    devHours: row.devHours,
    selected: false,
    quantity: 1,
    discountPct: 0,
    translations: row.translations,
  };
}
