// src/app/api/mapache/filters/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

import { ensureMapacheAccess } from "../tasks/access";
import {
  createFiltersSnapshotPayload,
  parseStoredFiltersSnapshot,
} from "@/app/mapache-portal/filter-storage";
import {
  loadStatusKeys,
  serializePreset,
} from "./utils";

const createPresetSchema = z.object({
  name: z.string().min(1).max(120),
  filters: z.unknown(),
});

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

  if (!session?.user?.id) {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }

  const userId = session.user.id;

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
