"use client";

import * as React from "react";

import { toast } from "@/app/components/ui/toast";

import {
  createFiltersSnapshotPayload,
  parseStoredFiltersSnapshot,
  type FiltersSnapshot,
} from "../filter-storage";
import type {
  AdvancedFiltersState,
  TaskFilterState,
} from "../filters";
import type { MapacheTaskStatus } from "../types";

export type MapacheFilterPresetOwner = {
  id: string;
  name: string | null;
  email: string | null;
};

export type MapacheFilterPreset = {
  id: string;
  name: string;
  filters: FiltersSnapshot;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: MapacheFilterPresetOwner | null;
};

function normalizeFilterPreset(
  value: unknown,
  allowedStatuses: readonly MapacheTaskStatus[],
): MapacheFilterPreset | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = record.id;
  const name = record.name;
  const filters = record.filters;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof name !== "string" ||
    !filters
  ) {
    return null;
  }

  const parsedFilters = parseStoredFiltersSnapshot(filters, allowedStatuses);
  const createdAt =
    typeof record.createdAt === "string" ? record.createdAt : null;
  const updatedAt =
    typeof record.updatedAt === "string" ? record.updatedAt : null;

  let createdBy: MapacheFilterPresetOwner | null = null;
  if (
    record.createdBy &&
    typeof record.createdBy === "object" &&
    record.createdBy !== null
  ) {
    const ownerRecord = record.createdBy as Record<string, unknown>;
    const ownerId = ownerRecord.id;
    if (typeof ownerId === "string" || typeof ownerId === "number") {
      createdBy = {
        id: String(ownerId),
        name:
          typeof ownerRecord.name === "string" ? ownerRecord.name : null,
        email:
          typeof ownerRecord.email === "string" ? ownerRecord.email : null,
      };
    }
  }

  return {
    id: String(id),
    name: name.trim(),
    filters: parsedFilters,
    createdAt,
    updatedAt,
    createdBy,
  };
}

type UseFilterPresetsParams = {
  bootstrapPresets: unknown[];
  statusKeys: readonly MapacheTaskStatus[];
  activeFilter: TaskFilterState;
  advancedFilters: AdvancedFiltersState;
  updateActiveFilter: (
    value: React.SetStateAction<TaskFilterState>,
  ) => void;
  updateAdvancedFilters: (
    value: React.SetStateAction<AdvancedFiltersState>,
  ) => void;
  filtersT: (key: string) => string | undefined;
  toastT: (key: string) => string;
};

type UseFilterPresetsResult = {
  filterPresets: MapacheFilterPreset[];
  filterPresetsLoading: boolean;
  savingFilterPreset: boolean;
  selectedPresetId: string | null;
  setSelectedPresetId: React.Dispatch<React.SetStateAction<string | null>>;
  handleSaveCurrentFilters: () => Promise<void>;
  handleApplyPreset: (presetId: string | null) => void;
};

export function useFilterPresets({
  bootstrapPresets,
  statusKeys,
  activeFilter,
  advancedFilters,
  updateActiveFilter,
  updateAdvancedFilters,
  filtersT,
  toastT,
}: UseFilterPresetsParams): UseFilterPresetsResult {
  const bootstrapPresetList = React.useMemo(
    () =>
      bootstrapPresets
        .map((preset) => normalizeFilterPreset(preset, statusKeys))
        .filter((preset): preset is MapacheFilterPreset => preset !== null),
    [bootstrapPresets, statusKeys],
  );
  const [filterPresets, setFilterPresets] = React.useState<
    MapacheFilterPreset[]
  >(() => [...bootstrapPresetList]);
  const [filterPresetsLoading, setFilterPresetsLoading] =
    React.useState(false);
  const [savingFilterPreset, setSavingFilterPreset] = React.useState(false);
  const [selectedPresetId, setSelectedPresetId] = React.useState<string | null>(
    null,
  );
  const lastSavedPresetIdRef = React.useRef<string | null>(null);

  const fetchFilterPresetsFromApi = React.useCallback(async () => {
    const response = await fetch("/api/mapache/filters");
    if (!response.ok) {
      throw new Error(`Failed to load filter presets (${response.status})`);
    }
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return [];
    }
    return payload
      .map((preset: unknown) => normalizeFilterPreset(preset, statusKeys))
      .filter((preset): preset is MapacheFilterPreset => preset !== null)
      .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
  }, [statusKeys]);

  React.useEffect(() => {
    if (bootstrapPresetList.length > 0) {
      return;
    }
    let cancelled = false;
    async function loadPresets() {
      setFilterPresetsLoading(true);
      try {
        const presets = await fetchFilterPresetsFromApi();
        if (!cancelled) {
          setFilterPresets(presets);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          toast.error(toastT("filterPresetsLoadError"));
        }
      } finally {
        if (!cancelled) {
          setFilterPresetsLoading(false);
        }
      }
    }
    void loadPresets();
    return () => {
      cancelled = true;
    };
  }, [bootstrapPresetList.length, fetchFilterPresetsFromApi, toastT]);

  React.useEffect(() => {
    setSelectedPresetId((prev) => {
      if (lastSavedPresetIdRef.current) {
        const match = filterPresets.find(
          (preset) => preset.id === lastSavedPresetIdRef.current,
        );
        if (match) {
          const nextId = match.id;
          lastSavedPresetIdRef.current = null;
          return nextId;
        }
        lastSavedPresetIdRef.current = null;
      }

      if (prev && filterPresets.some((preset) => preset.id === prev)) {
        return prev;
      }

      if (filterPresets.length === 0) {
        return null;
      }

      return filterPresets[0]!.id;
    });
  }, [filterPresets]);

  const handleSaveCurrentFilters = React.useCallback(async () => {
    const promptMessage = filtersT("savePresetPrompt") ?? "";
    const name = window.prompt(promptMessage);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(toastT("filterPresetNameRequired"));
      return;
    }

    setSavingFilterPreset(true);
    try {
      const response = await fetch("/api/mapache/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          filters: createFiltersSnapshotPayload(activeFilter, advancedFilters),
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const created = normalizeFilterPreset(payload?.preset, statusKeys);
      if (created) {
        setFilterPresets((prev) => {
          const next = prev.filter((preset) => preset.id !== created.id);
          next.push(created);
          next.sort((a, b) =>
            a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
          );
          return next;
        });
        lastSavedPresetIdRef.current = created.id;
      } else {
        const presets = await fetchFilterPresetsFromApi();
        setFilterPresets(presets);
      }

      toast.success(toastT("filterPresetSaved"));
    } catch (error) {
      console.error(error);
      toast.error(toastT("filterPresetSaveError"));
    } finally {
      setSavingFilterPreset(false);
    }
  }, [
    activeFilter,
    advancedFilters,
    fetchFilterPresetsFromApi,
    filtersT,
    statusKeys,
    toastT,
  ]);

  const handleApplyPreset = React.useCallback(
    (presetId: string | null) => {
      if (!presetId) return;
      const preset = filterPresets.find((item) => item.id === presetId);
      if (!preset) {
        toast.error(toastT("filterPresetApplyError"));
        return;
      }
      updateActiveFilter(preset.filters.activeFilter);
      updateAdvancedFilters(preset.filters.advancedFilters);
      toast.success(toastT("filterPresetLoaded"));
    },
    [
      filterPresets,
      toastT,
      updateActiveFilter,
      updateAdvancedFilters,
    ],
  );

  return {
    filterPresets,
    filterPresetsLoading,
    savingFilterPreset,
    selectedPresetId,
    setSelectedPresetId,
    handleSaveCurrentFilters,
    handleApplyPreset,
  };
}
