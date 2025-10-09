import prisma from "@/lib/prisma";

import {
  createFiltersSnapshotPayload,
  parseStoredFiltersSnapshot,
  type FiltersSnapshot,
} from "@/app/mapache-portal/filter-storage";
import type { MapacheTaskStatus } from "@/app/mapache-portal/types";

export async function loadStatusKeys(): Promise<MapacheTaskStatus[]> {
  const statuses = await prisma.mapacheStatus.findMany({
    orderBy: { order: "asc" },
    select: { key: true },
  });

  return statuses
    .map((status) => status.key?.trim().toUpperCase())
    .filter((key): key is MapacheTaskStatus => Boolean(key));
}

type FilterPresetRecord = {
  id: string;
  name: string;
  filters: unknown;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { id: string; name: string | null; email: string | null } | null;
};

export function serializePreset(
  preset: FilterPresetRecord,
  statusKeys: readonly MapacheTaskStatus[],
  snapshot?: FiltersSnapshot,
) {
  const parsed =
    snapshot ?? parseStoredFiltersSnapshot(preset.filters, statusKeys);

  return {
    id: preset.id,
    name: preset.name,
    filters: createFiltersSnapshotPayload(
      parsed.activeFilter,
      parsed.advancedFilters,
    ),
    createdAt: preset.createdAt.toISOString(),
    updatedAt: preset.updatedAt.toISOString(),
    createdBy: preset.createdBy
      ? {
          id: preset.createdBy.id,
          name: preset.createdBy.name,
          email: preset.createdBy.email,
        }
      : null,
  };
}
