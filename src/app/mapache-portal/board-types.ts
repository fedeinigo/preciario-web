import type { MapacheStatusIndex, MapacheTaskStatus } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export type MapacheBoardColumnFilters = {
  statuses: MapacheTaskStatus[];
};

export type MapacheBoardColumnConfig = {
  id: string;
  title: string;
  order: number;
  filters: MapacheBoardColumnFilters;
};

export type MapacheBoardConfig = {
  id: string;
  name: string;
  order: number;
  columns: MapacheBoardColumnConfig[];
};

function normalizeStatuses(
  value: unknown,
  statusIndex: MapacheStatusIndex,
): MapacheTaskStatus[] | null {
  if (!Array.isArray(value)) return null;
  const statuses: MapacheTaskStatus[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (typeof entry !== "string") continue;
    const normalized = entry.trim().toUpperCase();
    if (!normalized) continue;
    if (!statusIndex.byKey.has(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    statuses.push(normalized);
  }
  if (statuses.length === 0) return null;
  return statuses;
}

function normalizeColumnFilters(
  value: unknown,
  statusIndex: MapacheStatusIndex,
): MapacheBoardColumnFilters | null {
  if (!isRecord(value)) return null;
  const statuses = normalizeStatuses(value.statuses, statusIndex);
  if (!statuses || statuses.length === 0) return null;
  return { statuses };
}

function normalizeColumn(
  value: unknown,
  statusIndex: MapacheStatusIndex,
): MapacheBoardColumnConfig | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  const title = value.title;
  const order = value.order;
  const filters = normalizeColumnFilters(value.filters, statusIndex);

  if (typeof id !== "string") return null;
  if (typeof title !== "string") return null;
  if (typeof order !== "number" || !Number.isFinite(order)) return null;
  if (!filters) return null;

  return {
    id,
    title,
    order,
    filters,
  };
}

export function normalizeBoardConfig(
  value: unknown,
  statusIndex: MapacheStatusIndex,
): MapacheBoardConfig | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  const name = value.name;
  const order = value.order;
  const columnsRaw = value.columns;

  if (typeof id !== "string") return null;
  if (typeof name !== "string") return null;
  if (typeof order !== "number" || !Number.isFinite(order)) return null;
  if (!Array.isArray(columnsRaw)) return null;

  const columns = columnsRaw
    .map((column) => normalizeColumn(column, statusIndex))
    .filter((column): column is MapacheBoardColumnConfig => column !== null)
    .sort((a, b) => a.order - b.order);

  if (columns.length === 0) {
    return null;
  }

  return {
    id,
    name,
    order,
    columns,
  };
}

export function normalizeBoardList(
  value: unknown,
  statusIndex: MapacheStatusIndex,
): MapacheBoardConfig[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeBoardConfig(entry, statusIndex))
    .filter((board): board is MapacheBoardConfig => board !== null)
    .sort((a, b) => a.order - b.order);
}
