// src/app/api/mapache/statuses/route.ts
import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

import {
  ensureMapacheAccess,
  mapacheStatusWithMetaSelect,
} from "../tasks/access";
import {
  badRequest,
  getNextOrder,
  parseLabel,
  parseOrder,
  parseStatusKey,
} from "./utils";

export async function GET() {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const access = ensureMapacheAccess(session);
  if (access.response) return access.response;

  const statuses = await prisma.mapacheStatus.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: mapacheStatusWithMetaSelect,
  });

  return NextResponse.json({ statuses });
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
    return badRequest("Invalid JSON payload");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return badRequest("Invalid payload");
  }

  const body = payload as Record<string, unknown>;

  const keyResult = parseStatusKey(body.key, { required: true });
  if (keyResult instanceof NextResponse) return keyResult;
  if (keyResult === undefined) {
    return badRequest("key is required");
  }
  const key = keyResult;

  const labelResult = parseLabel(body.label, { required: true });
  if (labelResult instanceof NextResponse) return labelResult;
  if (labelResult === undefined) {
    return badRequest("label is required");
  }
  const label = labelResult;

  const orderResult = parseOrder(body.order, { required: false });
  if (orderResult instanceof NextResponse) return orderResult;
  const order =
    orderResult !== undefined ? orderResult : await getNextOrder();

  const existing = await prisma.mapacheStatus.findUnique({
    where: { key },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A status with this key already exists" },
      { status: 409 },
    );
  }

  const created = await prisma.mapacheStatus.create({
    data: { key, label, order },
    select: mapacheStatusWithMetaSelect,
  });

  return NextResponse.json({ status: created }, { status: 201 });
}
