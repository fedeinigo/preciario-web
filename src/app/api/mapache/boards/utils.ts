import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import {
  MAPACHE_TASK_STATUSES,
  type MapacheTaskStatus,
} from "@/app/mapache-portal/types";

import type { MapacheBoardColumnFilters } from "@/app/mapache-portal/board-types";

const STATUS_SET = new Set<string>(MAPACHE_TASK_STATUSES);

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

function normalizeStatuses(
  value: unknown,
  { allowEmptyStatuses = false }: NormalizeOptions = {},
): MapacheTaskStatus[] | null {
  if (!Array.isArray(value)) {
    return allowEmptyStatuses ? [] : null;
  }
  const statuses: MapacheTaskStatus[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (typeof entry !== "string") {
      continue;
    }
    if (!STATUS_SET.has(entry)) {
      continue;
    }
    const status = entry as MapacheTaskStatus;
    if (!statuses.includes(status)) {
      statuses.push(status);
    }
  }
  if (!allowEmptyStatuses && statuses.length === 0) {
    return null;
  }
  return statuses;
}

function normalizeColumnFilters(
  value: unknown,
  options?: NormalizeOptions,
): ColumnFiltersPayload | null {
  if (!isRecord(value)) return null;
  const statuses = normalizeStatuses(value.statuses, options);
  if (!statuses) return null;
  return { statuses };
}

function parseColumn(
  value: unknown,
  index: number,
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

  const normalizedFilters = normalizeColumnFilters(filters, options);
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
    const column = parseColumn(value[index], index, options);
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

export const DEFAULT_BOARD_COLUMNS: ColumnPayload[] = MAPACHE_TASK_STATUSES.map(
  (status) => ({
    title: status,
    filters: { statuses: [status] },
  }),
);

export type MapacheBoardWithColumns = Prisma.MapacheBoardGetPayload<{
  include: { columns: true };
}>;

function normalizeColumnFromDb(column: MapacheBoardWithColumns["columns"][number]) {
  const filters = normalizeColumnFilters(column.filters, {
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
    .map((column) => normalizeColumnFromDb(column))
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
