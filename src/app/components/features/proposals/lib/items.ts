// Utilidades para catálogo: fetch / CRUD hacia la API de ítems
import type { CatalogItem, UIItem } from "./types";
import type { ItemFormData } from "@/app/components/ui/ItemForm";

/** Estado inicial inmediato (evita undefined en el primer render) */
export function getInitialItems(): UIItem[] {
  return [];
}

/** Carga ítems activos desde /api/items y los adapta a UIItem */
export async function fetchCatalogItems(): Promise<UIItem[]> {
  const res = await fetch("/api/items", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar el catálogo");
  const data = (await res.json()) as CatalogItem[];
  return data.map(toUIItem);
}

/** Crea un ítem en DB y lo retorna adaptado a UIItem */
export async function createCatalogItem(data: ItemFormData): Promise<UIItem> {
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
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "No se pudo crear el ítem");
  }
  const created = (await res.json()) as CatalogItem;
  return toUIItem(created);
}

/** Actualiza un ítem en DB (no devuelve nada) */
export async function updateCatalogItem(id: string, data: ItemFormData): Promise<void> {
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
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "No se pudo actualizar el ítem");
  }
}

/** Elimina un ítem en DB */
export async function deleteCatalogItem(id: string): Promise<void> {
  const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "No se pudo eliminar el ítem");
  }
}

/** Adaptador a UI */
function toUIItem(row: CatalogItem): UIItem {
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
  };
}
