// src/app/api/mapache/statuses/[statusId]/route.ts
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

import {
  ensureMapacheAccess,
  mapacheStatusWithMetaSelect,
} from "../../tasks/access";
import { badRequest, parseLabel, parseOrder, parseStatusKey } from "../utils";

function parseStatusId(
  params: { statusId?: string } | null | undefined,
): string | NextResponse {
  const statusId = params?.statusId;
  if (!statusId || typeof statusId !== "string" || !statusId.trim()) {
    return badRequest("statusId is required");
  }
  return statusId;
}

async function handleUpdate(
  request: Request,
  params: Promise<{ statusId?: string }>,
  { requireAllFields }: { requireAllFields: boolean },
) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const access = ensureMapacheAccess(session);
  if (access.response) return access.response;

  const paramsValue = await params;
  const statusIdResult = parseStatusId(paramsValue);
  if (statusIdResult instanceof NextResponse) return statusIdResult;
  const statusId = statusIdResult;

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

  const keyResult = parseStatusKey(body.key, { required: requireAllFields });
  if (keyResult instanceof NextResponse) return keyResult;

  const labelResult = parseLabel(body.label, { required: requireAllFields });
  if (labelResult instanceof NextResponse) return labelResult;

  const orderResult = parseOrder(body.order, { required: requireAllFields });
  if (orderResult instanceof NextResponse) return orderResult;

  if (
    !requireAllFields &&
    keyResult === undefined &&
    labelResult === undefined &&
    orderResult === undefined
  ) {
    return badRequest("No updates provided");
  }

  if (keyResult !== undefined) {
    const existing = await prisma.mapacheStatus.findUnique({
      where: { key: keyResult },
      select: { id: true },
    });
    if (existing && existing.id !== statusId) {
      return NextResponse.json(
        { error: "A status with this key already exists" },
        { status: 409 },
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (keyResult !== undefined) data.key = keyResult;
  if (labelResult !== undefined) data.label = labelResult;
  if (orderResult !== undefined) data.order = orderResult;

  try {
    const updated = await prisma.mapacheStatus.update({
      where: { id: statusId },
      data,
      select: mapacheStatusWithMetaSelect,
    });

    return NextResponse.json({ status: updated });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 });
    }

    throw error;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ statusId: string }> },
) {
  return handleUpdate(request, params, { requireAllFields: false });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ statusId: string }> },
) {
  return handleUpdate(request, params, { requireAllFields: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ statusId: string }> },
) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const access = ensureMapacheAccess(session);
  if (access.response) return access.response;

  const paramsValue = await params;
  const statusIdResult = parseStatusId(paramsValue);
  if (statusIdResult instanceof NextResponse) return statusIdResult;
  const statusId = statusIdResult;

  try {
    await prisma.mapacheStatus.delete({ where: { id: statusId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Cannot delete status with existing tasks" },
        { status: 409 },
      );
    }

    throw error;
  }
}
