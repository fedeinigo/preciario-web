// src/app/api/mapache/filters/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

import { ensureMapacheAccess } from "../tasks/access";
import {
  createFiltersSnapshotPayload,
  parseStoredFiltersSnapshot,
  type FiltersSnapshot,
} from "@/app/mapache-portal/filter-storage";
import type { MapacheTaskStatus } from "@/app/mapache-portal/types";

const createPresetSchema = z.object({
  name: z.string().min(1).max(120),
  filters: z.unknown(),
});

async function loadStatusKeys(): Promise<MapacheTaskStatus[]> {
  const statuses = await prisma.mapacheStatus.findMany({
    orderBy: { order: "asc" },
    select: { key: true },
  });

  return statuses
    .map((status) => status.key?.trim().toUpperCase())
    .filter((key): key is MapacheTaskStatus => Boolean(key));
}

function serializePreset(
  preset: {
    id: string;
    name: string;
    filters: unknown;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: { id: string; name: string | null; email: string | null } | null;
  },
  statusKeys: readonly MapacheTaskStatus[],
  snapshot?: FiltersSnapshot,
) {
  const parsed = snapshot ?? parseStoredFiltersSnapshot(preset.filters, statusKeys);

  return {
    id: preset.id,
    name: preset.name,
    filters: createFiltersSnapshotPayload(parsed.activeFilter, parsed.advancedFilters),
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

export async function GET() {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const access = ensureMapacheAccess(session);
  if (access.response) return access.response;

  const statusKeys = await loadStatusKeys();

  const presets = await prisma.mapacheFilterPreset.findMany({
    orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    presets: presets.map((preset) =>
      serializePreset(
        {
          id: preset.id,
          name: preset.name,
          filters: preset.filters,
          createdAt: preset.createdAt,
          updatedAt: preset.updatedAt,
          createdBy: preset.createdBy,
        },
        statusKeys,
      ),
    ),
  });
}

export async function POST(request: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const access = ensureMapacheAccess(session);
  if (access.response) return access.response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsedBody = createPresetSchema.safeParse(payload);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const name = parsedBody.data.name.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const statusKeys = await loadStatusKeys();
  const snapshot = parseStoredFiltersSnapshot(parsedBody.data.filters, statusKeys);
  const filtersPayload = createFiltersSnapshotPayload(
    snapshot.activeFilter,
    snapshot.advancedFilters,
  );

  const userId = session.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }

  const created = await prisma.mapacheFilterPreset.create({
    data: {
      name,
      filters: filtersPayload,
      createdById: String(userId),
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(
    {
      preset: serializePreset(
        {
          id: created.id,
          name: created.name,
          filters: created.filters,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          createdBy: created.createdBy,
        },
        statusKeys,
        snapshot,
      ),
    },
    { status: 201 },
  );
}
