// src/app/api/mapache/tasks/route.ts
import { NextResponse } from "next/server";

import { requireApiSession, type ApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const MAPACHE_TEAM = "Mapaches" as const;
const VALID_STATUSES = ["PENDING", "IN_PROGRESS", "DONE"] as const;
type MapacheStatus = (typeof VALID_STATUSES)[number];

function parseStatus(status: unknown): MapacheStatus | null {
  if (typeof status !== "string") return null;
  return VALID_STATUSES.includes(status as MapacheStatus)
    ? (status as MapacheStatus)
    : null;
}

type AccessResult = { response: NextResponse | null; userId?: string };

function ensureMapacheAccess(session: ApiSession | null): AccessResult {
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

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
} satisfies Prisma.MapacheTaskSelect;

export async function GET() {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;

  const tasks = await prisma.mapacheTask.findMany({
    orderBy: { createdAt: "desc" },
    select: taskSelect,
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse, userId } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: unknown;
    description?: unknown;
    status?: unknown;
  };

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const status =
    body.status === undefined || body.status === null
      ? "PENDING"
      : parseStatus(body.status);

  if (!status) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const description =
    typeof body.description === "string"
      ? body.description
      : body.description == null
        ? null
        : undefined;

  const created = await prisma.mapacheTask.create({
    data: {
      title,
      status,
      description,
      createdById: userId,
    },
    select: taskSelect,
  });

  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;

  const body = (await req.json()) as {
    id?: unknown;
    title?: unknown;
    description?: unknown;
    status?: unknown;
  };

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Task id is required" }, { status: 400 });
  }

  const data: Prisma.MapacheTaskUpdateInput = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    data.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description === "string") {
      data.description = body.description;
    } else if (body.description == null) {
      data.description = null;
    } else {
      return NextResponse.json({ error: "Description must be a string" }, { status: 400 });
    }
  }

  if (body.status !== undefined) {
    const status = parseStatus(body.status);
    if (!status) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const updated = await prisma.mapacheTask.update({
    where: { id },
    data,
    select: taskSelect,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;

  const body = (await req.json()) as { id?: unknown };
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Task id is required" }, { status: 400 });
  }

  await prisma.mapacheTask.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

export { ensureMapacheAccess };
