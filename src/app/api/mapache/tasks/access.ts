// src/app/api/mapache/tasks/access.ts
import { NextResponse } from "next/server";

import type { ApiSession } from "@/app/api/_utils/require-auth";

export const MAPACHE_TEAM = "Mapaches" as const;
export const VALID_STATUSES = ["PENDING", "IN_PROGRESS", "DONE"] as const;
export type MapacheStatus = (typeof VALID_STATUSES)[number];

export function parseStatus(status: unknown): MapacheStatus | null {
  if (typeof status !== "string") return null;
  return VALID_STATUSES.includes(status as MapacheStatus)
    ? (status as MapacheStatus)
    : null;
}

export type AccessResult = { response: NextResponse | null; userId?: string };

export function ensureMapacheAccess(session: ApiSession | null): AccessResult {
  const user = session?.user;
  if (!user?.id) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const isAdmin = user.role === "superadmin";
  const isMapache = user.team === MAPACHE_TEAM;

  if (!isAdmin && !isMapache) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { response: null, userId: user.id };
}

export const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  substatus: true,
  assigneeId: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  deliverables: {
    select: {
      id: true,
      type: true,
      title: true,
      url: true,
      addedById: true,
      createdAt: true,
    },
  },
} as const;
