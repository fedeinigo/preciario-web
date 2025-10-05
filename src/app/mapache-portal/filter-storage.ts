import { z } from "zod";

import type { MapacheTaskStatus } from "./types";
import {
  DATE_INPUT_REGEX,
  createDefaultFiltersState,
  createDefaultTaskFilterState,
  type AdvancedFiltersState,
  type OwnershipFilterValue,
  type PresentationDateFilter,
  type StatusFilterValue,
  type TaskFilterState,
} from "./filters";
import {
  MAPACHE_DIRECTNESS,
  MAPACHE_INTEGRATION_TYPES,
  MAPACHE_NEEDS_FROM_TEAM,
  MAPACHE_SIGNAL_ORIGINS,
} from "./types";

const OWNERSHIP_SCHEMA = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value): OwnershipFilterValue | null => {
    if (value === "mine" || value === "unassigned") {
      return value;
    }
    if (value === "all" || value === "") {
      return "all";
    }
    return null;
  });

const STATUS_STRING_SCHEMA = z
  .string()
  .trim()
  .transform((value) => (value ? value.toUpperCase() : ""));

const STRING_ARRAY_SCHEMA = z
  .union([
    z.string(),
    z.array(z.string()),
  ])
  .transform<string[]>((value) => {
    const items = Array.isArray(value) ? value : value.split(",");
    return items
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  });

const ASSIGNEE_ARRAY_SCHEMA = z
  .union([
    z.string(),
    z.array(z.string()),
  ])
  .transform<string[]>((value) => {
    const seen = new Set<string>();
    const values = Array.isArray(value) ? value : value.split(",");
    values.forEach((item) => {
      const normalized = item.trim();
      if (!normalized) return;
      seen.add(normalized);
    });
    return Array.from(seen);
  });

function parseEnumArray<T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number][] {
  if (value === undefined) return [];
  const result = STRING_ARRAY_SCHEMA.safeParse(value);
  if (!result.success) return [];
  const allowedSet = new Set(allowed);
  const selected = new Set<T[number]>();
  result.data.forEach((item) => {
    const upper = item.toUpperCase();
    if (allowedSet.has(upper as T[number])) {
      selected.add(upper as T[number]);
    }
  });
  if (selected.size === 0) return [];
  return allowed.filter((option) => selected.has(option)) as T[number][];
}

function parseAssigneeArray(value: unknown): string[] {
  if (value === undefined) return [];
  const result = ASSIGNEE_ARRAY_SCHEMA.safeParse(value);
  if (!result.success) return [];
  return result.data;
}

function parsePresentationDate(
  value: unknown,
  extras: Record<string, unknown>,
): PresentationDateFilter {
  const recordResult = z
    .object({})
    .passthrough()
    .safeParse(value);

  const fromCandidates: unknown[] = [];
  const toCandidates: unknown[] = [];

  if (recordResult.success) {
    const record = recordResult.data as Record<string, unknown>;
    if ("from" in record) {
      fromCandidates.push(record.from);
    }
    if ("to" in record) {
      toCandidates.push(record.to);
    }
  }

  if ("presentationDate" in extras && extras.presentationDate !== value) {
    const extraRecordResult = z
      .object({})
      .passthrough()
      .safeParse(extras.presentationDate);
    if (extraRecordResult.success) {
      const extraRecord = extraRecordResult.data as Record<string, unknown>;
      if ("from" in extraRecord) {
        fromCandidates.push(extraRecord.from);
      }
      if ("to" in extraRecord) {
        toCandidates.push(extraRecord.to);
      }
    }
  }

  const alternateFrom = extras.presentationFrom ?? extras.presentation_from;
  const alternateTo = extras.presentationTo ?? extras.presentation_to;
  if (alternateFrom !== undefined) {
    fromCandidates.unshift(alternateFrom);
  }
  if (alternateTo !== undefined) {
    toCandidates.unshift(alternateTo);
  }

  return {
    from: pickValidDate(fromCandidates),
    to: pickValidDate(toCandidates),
  };
}

function pickValidDate(candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    if (!DATE_INPUT_REGEX.test(trimmed)) continue;
    return trimmed;
  }
  return null;
}

function parseStatusFilterValue(
  value: unknown,
  allowedStatuses: readonly MapacheTaskStatus[],
): StatusFilterValue {
  if (value === undefined || value === null) {
    return "all";
  }
  if (typeof value === "string") {
    const parsed = STATUS_STRING_SCHEMA.safeParse(value);
    if (parsed.success) {
      const normalized = parsed.data;
      if (!normalized) return "all";
      if (allowedStatuses.includes(normalized as MapacheTaskStatus)) {
        return normalized as MapacheTaskStatus;
      }
      if (normalized === "ALL") {
        return "all";
      }
    }
  }
  return "all";
}

function parseOwnershipFilterValue(value: unknown): OwnershipFilterValue {
  if (value === undefined || value === null) {
    return "all";
  }
  if (typeof value === "string") {
    const parsed = OWNERSHIP_SCHEMA.safeParse(value);
    if (parsed.success && parsed.data) {
      return parsed.data;
    }
  }
  return "all";
}

function parseStoredTaskFilterState(
  value: unknown,
  allowedStatuses: readonly MapacheTaskStatus[],
): TaskFilterState {
  if (typeof value === "string") {
    const normalized = value.trim();
    const ownership = parseOwnershipFilterValue(normalized);
    if (ownership !== "all") {
      return { status: "all", ownership };
    }
    const status = parseStatusFilterValue(normalized, allowedStatuses);
    if (status !== "all") {
      return { status, ownership: "all" };
    }
    if (!normalized || normalized.toLowerCase() === "all") {
      return createDefaultTaskFilterState();
    }
  }

  const recordResult = z
    .object({})
    .passthrough()
    .safeParse(value);
  if (!recordResult.success) {
    return createDefaultTaskFilterState();
  }

  const record = recordResult.data as Record<string, unknown>;
  const statusValue =
    record.status ?? record.state ?? record.statusKey ?? record.key;
  const ownershipValue = record.ownership ?? record.owner;

  return {
    status: parseStatusFilterValue(statusValue, allowedStatuses),
    ownership: parseOwnershipFilterValue(ownershipValue),
  };
}

function parseStoredAdvancedFilters(
  value: unknown,
  extras: Record<string, unknown>,
): AdvancedFiltersState {
  const recordResult = z
    .object({})
    .passthrough()
    .safeParse(value);

  const record = recordResult.success
    ? (recordResult.data as Record<string, unknown>)
    : {};

  const lookup = (keys: string[]): unknown => {
    for (const key of keys) {
      if (key in record) {
        return record[key];
      }
      if (key in extras) {
        return extras[key];
      }
    }
    return undefined;
  };

  return {
    needFromTeam: parseEnumArray(lookup(["needFromTeam", "needs"]), MAPACHE_NEEDS_FROM_TEAM),
    directness: parseEnumArray(lookup(["directness", "contact"]), MAPACHE_DIRECTNESS),
    integrationTypes: parseEnumArray(
      lookup(["integrationTypes", "integration"]),
      MAPACHE_INTEGRATION_TYPES,
    ),
    origins: parseEnumArray(lookup(["origins", "origin"]), MAPACHE_SIGNAL_ORIGINS),
    assignees: parseAssigneeArray(lookup(["assignees", "owners", "mapaches"])),
    presentationDate: parsePresentationDate(
      lookup(["presentationDate"]),
      {
        presentationDate: record.presentationDate ?? extras.presentationDate,
        presentationFrom:
          lookup([
            "presentationFrom",
            "presentation_from",
            "from",
          ]) ?? extras.presentationFrom,
        presentationTo:
          lookup(["presentationTo", "presentation_to", "to"]) ??
          extras.presentationTo,
      },
    ),
  };
}

export type FiltersSnapshot = {
  activeFilter: TaskFilterState;
  advancedFilters: AdvancedFiltersState;
};

export function parseStoredFiltersSnapshot(
  value: unknown,
  allowedStatuses: readonly MapacheTaskStatus[],
): FiltersSnapshot {
  const defaults = {
    activeFilter: createDefaultTaskFilterState(),
    advancedFilters: createDefaultFiltersState(),
  } as const;

  if (value === null || value === undefined) {
    return { ...defaults };
  }

  if (typeof value === "string") {
    return {
      activeFilter: parseStoredTaskFilterState(value, allowedStatuses),
      advancedFilters: defaults.advancedFilters,
    };
  }

  const recordResult = z
    .object({})
    .passthrough()
    .safeParse(value);

  if (!recordResult.success) {
    return { ...defaults };
  }

  const record = recordResult.data as Record<string, unknown>;

  const rawAdvanced =
    "advancedFilters" in record && record.advancedFilters !== null
      ? record.advancedFilters
      : record;

  const advancedFilters = parseStoredAdvancedFilters(rawAdvanced, record);

  let activeFilter = defaults.activeFilter;
  if ("activeFilter" in record) {
    activeFilter = parseStoredTaskFilterState(
      record.activeFilter,
      allowedStatuses,
    );
  } else if ("filter" in record) {
    activeFilter = parseStoredTaskFilterState(record.filter, allowedStatuses);
  } else if (
    "status" in record ||
    "state" in record ||
    "ownership" in record ||
    "owner" in record
  ) {
    activeFilter = parseStoredTaskFilterState(
      {
        status: record.status ?? record.state,
        ownership: record.ownership ?? record.owner,
      },
      allowedStatuses,
    );
  }

  return { activeFilter, advancedFilters };
}

export function createFiltersSnapshotPayload(
  activeFilter: TaskFilterState,
  advancedFilters: AdvancedFiltersState,
) {
  return {
    version: 2,
    activeFilter,
    advancedFilters,
  };
}
