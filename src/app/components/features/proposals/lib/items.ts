// src/app/components/features/proposals/lib/items.ts
import type { UIItem } from "./types";
import type { ItemFormData } from "@/app/components/ui/ItemForm";
import {
  createProposalCodeError,
  isProposalError,
  parseProposalErrorResponse,
} from "./errors";

type CatalogRow = {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unitPrice: number;
  devHours: number;
};

export function getInitialItems(): UIItem[] {
  return [];
}

export async function fetchCatalogItems(): Promise<UIItem[]> {
  try {
    const res = await fetch("/api/items", { cache: "no-store" });
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

// NEW: popularidad desde API (itemId -> totalQty)
export async function fetchItemsPopularity(): Promise<Record<string, number>> {
  const r = await fetch("/api/items/popularity", { cache: "no-store" });
  if (!r.ok) return {};
  return (await r.json()) as Record<string, number>;
}

export async function createCatalogItem(data: ItemFormData): Promise<UIItem> {
  try {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: data.sku,
        name: data.name,
        description: data.description ?? "",
        category: data.category ?? "general",
        unitPrice: data.unitPrice,
        devHours: data.devHours,
      }),
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

export async function updateCatalogItem(id: string, data: ItemFormData): Promise<void> {
  try {
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: data.sku,
        name: data.name,
        description: data.description ?? "",
        category: data.category ?? "general",
        unitPrice: data.unitPrice,
        devHours: data.devHours,
      }),
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
  };
}
