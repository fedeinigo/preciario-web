import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import type {
  MapacheStatusIndex,
  MapacheTaskStatus,
} from "@/app/mapache-portal/types";
import { createStatusIndex } from "@/app/mapache-portal/types";
import { mapacheStatusSummarySelect } from "../tasks/access";
import prisma from "@/lib/prisma";

import type { MapacheBoardColumnFilters } from "@/app/mapache-portal/board-types";

export type ColumnFiltersPayload = MapacheBoardColumnFilters;

export type ColumnPayload = {
  id?: string;
  title: string;
  filters: ColumnFiltersPayload;
};

export type BoardPayload = {
  name: string;
  columns: ColumnPayload[];
};

type NormalizeOptions = {
  allowEmptyStatuses?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function loadStatusIndex(): Promise<MapacheStatusIndex> {
  const statuses = await prisma.mapacheStatus.findMany({
    orderBy: { order: "asc" },
    select: mapacheStatusSummarySelect,
  });

  return createStatusIndex(
    statuses.map((status) => ({
      id: status.id,
      key: status.key,
      label: status.label,
      order: status.order,
    })),
  );
}

function normalizeStatuses(
  value: unknown,
  statusIndex: MapacheStatusIndex,
  { allowEmptyStatuses = false }: NormalizeOptions = {},
): MapacheTaskStatus[] | null {
  if (!Array.isArray(value)) {
    return allowEmptyStatuses ? [] : null;
  }
  const statuses: MapacheTaskStatus[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (typeof entry !== "string") {
      continue;
    }
    const normalized = entry.trim().toUpperCase();
    if (!normalized) continue;
    if (!statusIndex.byKey.has(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    statuses.push(normalized);
  }
  if (!allowEmptyStatuses && statuses.length === 0) {
    return null;
  }
  return statuses;
}

function normalizeColumnFilters(
  value: unknown,
  statusIndex: MapacheStatusIndex,
  options?: NormalizeOptions,
): ColumnFiltersPayload | null {
  if (!isRecord(value)) return null;
  const statuses = normalizeStatuses(value.statuses, statusIndex, options);
  if (!statuses) return null;
  return { statuses };
}

function parseColumn(
  value: unknown,
  index: number,
  statusIndex: MapacheStatusIndex,
  options?: NormalizeOptions,
): ColumnPayload | NextResponse {
  if (!isRecord(value)) {
    return badRequest(`columns[${index}] must be an object`);
  }

  const { id, title, filters } = value;
  const columnId =
    typeof id === "string" && id.trim() ? (id as string) : undefined;
  if (columnId && columnId.length > 128) {
    return badRequest(`columns[${index}].id is too long`);
  }

  if (typeof title !== "string" || !title.trim()) {
    return badRequest(`columns[${index}].title is required`);
  }

  const normalizedFilters = normalizeColumnFilters(filters, statusIndex, options);
  if (!normalizedFilters) {
    return badRequest(
      `columns[${index}].filters.statuses must include at least one status`,
    );
  }

  return {
    id: columnId,
    title: title.trim(),
    filters: normalizedFilters,
  };
}

export function parseColumnsPayload(
  value: unknown,
  statusIndex: MapacheStatusIndex,
  options?: NormalizeOptions,
): ColumnPayload[] | NextResponse {
  if (!Array.isArray(value)) {
    return badRequest(`columns must be an array`);
  }

  if (value.length === 0) {
    return badRequest(`columns must include at least one column`);
  }

  const parsed: ColumnPayload[] = [];
  const seenIds = new Set<string>();

  for (let index = 0; index < value.length; index += 1) {
    const column = parseColumn(value[index], index, statusIndex, options);
    if (column instanceof NextResponse) {
      return column;
    }

    if (column.id) {
      if (seenIds.has(column.id)) {
        return badRequest(`columns[${index}].id is duplicated`);
      }
      seenIds.add(column.id);
    }

    parsed.push(column);
  }

  return parsed;
}

export function createDefaultBoardColumns(
  statusIndex: MapacheStatusIndex,
): ColumnPayload[] {
  return statusIndex.ordered.map((status) => ({
    title: status.label,
    filters: { statuses: [status.key] },
  }));
}

export type MapacheBoardWithColumns = Prisma.MapacheBoardGetPayload<{
  include: { columns: true };
}>;

function normalizeColumnFromDb(
  column: MapacheBoardWithColumns["columns"][number],
  statusIndex: MapacheStatusIndex,
) {
  const filters = normalizeColumnFilters(column.filters, statusIndex, {
    allowEmptyStatuses: false,
  });
  if (!filters) {
    return null;
  }
  return {
    id: column.id,
    title: column.title,
    order: column.position,
    filters,
  };
}

export function normalizeBoardFromDb(
  board: MapacheBoardWithColumns,
  statusIndex: MapacheStatusIndex,
): {
  id: string;
  name: string;
  order: number;
  columns: {
    id: string;
    title: string;
    order: number;
    filters: ColumnFiltersPayload;
  }[];
} {
  const columns = board.columns
    .map((column) => normalizeColumnFromDb(column, statusIndex))
    .filter(
      (
        column,
      ): column is {
        id: string;
        title: string;
        order: number;
        filters: ColumnFiltersPayload;
      } => column !== null,
    )
    .sort((a, b) => a.order - b.order);

  return {
    id: board.id,
    name: board.name,
    order: board.position,
    columns,
  };
}
