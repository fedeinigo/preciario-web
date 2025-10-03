// src/app/api/mapache/tasks/[taskId]/deliverables/route.ts
import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import {
  ensureMapacheAccess,
  parseDeliverableType,
} from "../../access";
import type { MapacheDeliverableType } from "../../access";
import prisma from "@/lib/prisma";

type MapacheTaskDeliverableDelegate = {
  create: (args: unknown) => Promise<unknown>;
};

const mapacheTaskDeliverable = (
  prisma as unknown as { mapacheTaskDeliverable: MapacheTaskDeliverableDelegate }
).mapacheTaskDeliverable;

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch {
    return false;
  }
}

export async function POST(
  req: Request,
  context: { params: { taskId: string } },
) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse, userId } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;

  const taskId = context.params?.taskId;
  if (!taskId) {
    return NextResponse.json({ error: "Task id is required" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    type?: unknown;
    title?: unknown;
    url?: unknown;
  };

  const type = parseDeliverableType(body.type);
  if (!type) {
    return NextResponse.json({ error: "Invalid deliverable type" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: "URL is invalid" }, { status: 400 });
  }

  const created = (await mapacheTaskDeliverable.create({
    data: {
      taskId,
      type,
      title,
      url,
      addedById: userId ?? null,
    },
    select: {
      id: true,
      type: true,
      title: true,
      url: true,
      addedById: true,
      createdAt: true,
    },
  })) as {
    id: string;
    type: MapacheDeliverableType;
    title: string;
    url: string;
    addedById: string | null;
    createdAt: Date;
  };

  return NextResponse.json(created, { status: 201 });
}
