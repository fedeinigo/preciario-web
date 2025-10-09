"use client";

import * as React from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";

import {
  areAdvancedFiltersEqual,
  areTaskFiltersEqual,
  createDefaultFiltersState,
  createDefaultTaskFilterState,
  type AdvancedFiltersState,
  type TaskFilterState,
} from "../filters";
import {
  createFiltersSnapshotPayload,
  parseStoredFiltersSnapshot,
} from "../filter-storage";
import {
  createFilterQueryString,
  normalizeQueryString,
  parseQueryParamList,
} from "../utils/filter-query";

type UseMapacheFiltersOptions = {
  pathname: string;
  replaceUrl: (url: string, options: { scroll: boolean }) => void;
  searchParams: ReadonlyURLSearchParams;
  searchParamsString: string;
  statusKeys: string[];
};

export type MapacheFiltersState = {
  activeFilter: TaskFilterState;
  advancedFilters: AdvancedFiltersState;
  filtersHydrated: boolean;
  updateActiveFilter: (value: React.SetStateAction<TaskFilterState>) => void;
  updateAdvancedFilters: (value: React.SetStateAction<AdvancedFiltersState>) => void;
};

const FILTERS_STORAGE_KEY = "mapache_portal_filters";

function resolveStateAction<S>(
  action: React.SetStateAction<S>,
  prev: S,
): S {
  return typeof action === "function"
    ? (action as (state: S) => S)(prev)
    : action;
}

function extractFiltersFromSearchParams(
  searchParams: ReadonlyURLSearchParams,
): Record<string, unknown> | null {
  let hasAny = false;
  const snapshot: Record<string, unknown> = {};

  const status = searchParams.get("status");
  if (status !== null) {
    snapshot.status = status;
    hasAny = true;
  }

  const owner = searchParams.get("owner");
  if (owner !== null) {
    snapshot.owner = owner;
    hasAny = true;
  }

  const needs = parseQueryParamList(searchParams.getAll("needs"));
  if (needs.length > 0) {
    snapshot.needs = needs;
    hasAny = true;
  }

  const directness = parseQueryParamList(searchParams.getAll("directness"));
  if (directness.length > 0) {
    snapshot.directness = directness;
    hasAny = true;
  }

  const integration = parseQueryParamList(searchParams.getAll("integration"));
  if (integration.length > 0) {
    snapshot.integration = integration;
    hasAny = true;
  }

  const origins = parseQueryParamList(searchParams.getAll("origins"));
  if (origins.length > 0) {
    snapshot.origins = origins;
    hasAny = true;
  }

  const assignees = parseQueryParamList(searchParams.getAll("assignees"));
  if (assignees.length > 0) {
    snapshot.assignees = assignees;
    hasAny = true;
  }

  const presentationFrom =
    searchParams.get("presentationFrom") ??
    searchParams.get("presentation_from");
  if (presentationFrom !== null) {
    snapshot.presentationFrom = presentationFrom;
    hasAny = true;
  }

  const presentationTo =
    searchParams.get("presentationTo") ?? searchParams.get("presentation_to");
  if (presentationTo !== null) {
    snapshot.presentationTo = presentationTo;
    hasAny = true;
  }

  return hasAny ? snapshot : null;
}

export function useMapacheFilters({
  pathname,
  replaceUrl,
  searchParams,
  searchParamsString,
  statusKeys,
}: UseMapacheFiltersOptions): MapacheFiltersState {
  const [activeFilter, setActiveFilter] = React.useState<TaskFilterState>(
    () => createDefaultTaskFilterState(),
  );
  const [advancedFilters, setAdvancedFilters] =
    React.useState<AdvancedFiltersState>(() => createDefaultFiltersState());
  const [filtersHydrated, setFiltersHydrated] = React.useState(false);
  const lastSyncedQueryRef = React.useRef<string | null>(
    normalizeQueryString(searchParamsString),
  );

  const updateActiveFilter = React.useCallback(
    (value: React.SetStateAction<TaskFilterState>) => {
      setActiveFilter((prev) => resolveStateAction(value, prev));
    },
    [],
  );

  const updateAdvancedFilters = React.useCallback(
    (value: React.SetStateAction<AdvancedFiltersState>) => {
      setAdvancedFilters((prev) => resolveStateAction(value, prev));
    },
    [],
  );

  React.useEffect(() => {
    if (filtersHydrated) {
      return;
    }

    let hydratedFromUrl = false;
    let nextTaskFilter = createDefaultTaskFilterState();
    let nextAdvancedFilter = createDefaultFiltersState();

    const snapshotFromUrl = extractFiltersFromSearchParams(searchParams);
    if (snapshotFromUrl) {
      const parsed = parseStoredFiltersSnapshot(snapshotFromUrl, statusKeys);
      nextTaskFilter = parsed.activeFilter;
      nextAdvancedFilter = parsed.advancedFilters;
      hydratedFromUrl = true;
    } else if (typeof window !== "undefined") {
      try {
        const storedRaw = window.localStorage.getItem(FILTERS_STORAGE_KEY);
        if (storedRaw) {
          const stored = JSON.parse(storedRaw) as unknown;
          const parsed = parseStoredFiltersSnapshot(stored, statusKeys);
          nextTaskFilter = parsed.activeFilter;
          nextAdvancedFilter = parsed.advancedFilters;
        }
      } catch (error) {
        console.error(error);
      }
    }

    updateActiveFilter(nextTaskFilter);
    updateAdvancedFilters(nextAdvancedFilter);

    if (hydratedFromUrl) {
      lastSyncedQueryRef.current = normalizeQueryString(searchParamsString);
    } else {
      lastSyncedQueryRef.current = null;
    }

    setFiltersHydrated(true);
  }, [
    filtersHydrated,
    searchParams,
    searchParamsString,
    statusKeys,
    updateActiveFilter,
    updateAdvancedFilters,
  ]);

  React.useEffect(() => {
    if (!filtersHydrated || typeof window === "undefined") return;

    try {
      const snapshot = createFiltersSnapshotPayload(
        activeFilter,
        advancedFilters,
      );
      window.localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify(snapshot),
      );
    } catch (error) {
      console.error(error);
    }
  }, [activeFilter, advancedFilters, filtersHydrated]);

  React.useEffect(() => {
    if (!filtersHydrated) return;

    const desiredQuery = createFilterQueryString(
      searchParams,
      activeFilter,
      advancedFilters,
    );
    const normalizedDesired = normalizeQueryString(desiredQuery);
    const normalizedCurrent = normalizeQueryString(searchParamsString);

    if (normalizedDesired === normalizedCurrent) {
      lastSyncedQueryRef.current = normalizedCurrent;
      return;
    }

    if (normalizedDesired === lastSyncedQueryRef.current) {
      return;
    }

    lastSyncedQueryRef.current = normalizedDesired;
    const nextUrl = normalizedDesired
      ? `${pathname}?${normalizedDesired}`
      : pathname;
    replaceUrl(nextUrl, { scroll: false });
  }, [
    activeFilter,
    advancedFilters,
    filtersHydrated,
    pathname,
    replaceUrl,
    searchParams,
    searchParamsString,
  ]);

  React.useEffect(() => {
    if (!filtersHydrated) return;

    const normalizedCurrent = normalizeQueryString(searchParamsString);
    if (normalizedCurrent === lastSyncedQueryRef.current) {
      return;
    }

    const snapshotFromUrl = extractFiltersFromSearchParams(searchParams);
    if (!snapshotFromUrl) {
      const defaultTaskFilter = createDefaultTaskFilterState();
      const defaultAdvancedFilters = createDefaultFiltersState();
      if (!areTaskFiltersEqual(activeFilter, defaultTaskFilter)) {
        updateActiveFilter(defaultTaskFilter);
      }
      if (!areAdvancedFiltersEqual(advancedFilters, defaultAdvancedFilters)) {
        updateAdvancedFilters(defaultAdvancedFilters);
      }
      lastSyncedQueryRef.current = normalizedCurrent;
      return;
    }

    const parsed = parseStoredFiltersSnapshot(snapshotFromUrl, statusKeys);
    if (!areTaskFiltersEqual(parsed.activeFilter, activeFilter)) {
      updateActiveFilter(parsed.activeFilter);
    }
    if (!areAdvancedFiltersEqual(parsed.advancedFilters, advancedFilters)) {
      updateAdvancedFilters(parsed.advancedFilters);
    }
    lastSyncedQueryRef.current = normalizedCurrent;
  }, [
    activeFilter,
    advancedFilters,
    filtersHydrated,
    searchParams,
    searchParamsString,
    statusKeys,
    updateActiveFilter,
    updateAdvancedFilters,
  ]);

  return {
    activeFilter,
    advancedFilters,
    filtersHydrated,
    updateActiveFilter,
    updateAdvancedFilters,
  };
}
