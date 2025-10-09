import type {
  AdvancedFiltersState,
  TaskFilterState,
} from "../filters";

export const FILTER_QUERY_KEYS = [
  "status",
  "owner",
  "needs",
  "directness",
  "integration",
  "origins",
  "assignees",
  "presentationFrom",
  "presentationTo",
  "presentation_from",
  "presentation_to",
] as const;

export function normalizeQueryString(value: string): string {
  const trimmed = value.trim().replace(/^\?/, "");
  if (!trimmed) {
    return "";
  }

  const params = new URLSearchParams(trimmed);
  const entries = Array.from(params.entries());

  entries.sort((a, b) => {
    if (a[0] === b[0]) {
      return a[1].localeCompare(b[1]);
    }
    return a[0].localeCompare(b[0]);
  });

  const normalized = new URLSearchParams();
  for (const [key, entryValue] of entries) {
    normalized.append(key, entryValue);
  }

  return normalized.toString();
}

export function createFilterQueryString(
  searchParams: URLSearchParams | Readonly<URLSearchParams>,
  activeFilter: TaskFilterState,
  advancedFilters: AdvancedFiltersState,
): string {
  const params = new URLSearchParams(searchParams.toString());
  FILTER_QUERY_KEYS.forEach((key) => {
    params.delete(key);
  });

  if (activeFilter.status !== "all") {
    params.set("status", activeFilter.status);
  }

  if (activeFilter.ownership !== "all") {
    params.set("owner", activeFilter.ownership);
  }

  if (advancedFilters.needFromTeam.length > 0) {
    advancedFilters.needFromTeam.forEach((value) => {
      params.append("needs", value);
    });
  }

  if (advancedFilters.directness.length > 0) {
    advancedFilters.directness.forEach((value) => {
      params.append("directness", value);
    });
  }

  if (advancedFilters.integrationTypes.length > 0) {
    advancedFilters.integrationTypes.forEach((value) => {
      params.append("integration", value);
    });
  }

  if (advancedFilters.origins.length > 0) {
    advancedFilters.origins.forEach((value) => {
      params.append("origins", value);
    });
  }

  if (advancedFilters.assignees.length > 0) {
    advancedFilters.assignees.forEach((value) => {
      params.append("assignees", value);
    });
  }

  const { from, to } = advancedFilters.presentationDate;
  if (from) {
    params.set("presentationFrom", from);
  }
  if (to) {
    params.set("presentationTo", to);
  }

  return normalizeQueryString(params.toString());
}

export function parseQueryParamList(values: string[]): string[] {
  if (values.length === 0) return [];
  const seen = new Set<string>();
  values.forEach((value) => {
    value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .forEach((item) => {
        if (!seen.has(item)) {
          seen.add(item);
        }
      });
  });
  return Array.from(seen);
}

