// src/app/api/mapache/boards/route.ts
import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

import { ensureMapacheAccess } from "../tasks/access";
import {
  DEFAULT_BOARD_COLUMNS,
  badRequest,
  normalizeBoardFromDb,
  parseColumnsPayload,
} from "./utils";

function parseName(value: unknown): string | NextResponse {
  if (typeof value !== "string" || !value.trim()) {
    return badRequest("name is required");
  }
  if (value.trim().length > 120) {
    return badRequest("name is too long");
  }
  return value.trim();
}

export async function GET() {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const access = ensureMapacheAccess(session);
  if (access.response) return access.response;

  const boards = await prisma.mapacheBoard.findMany({
    orderBy: { position: "asc" },
    include: {
      columns: { orderBy: { position: "asc" } },
    },
  });

  return NextResponse.json({
    boards: boards.map((board) => normalizeBoardFromDb(board)),
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
    return badRequest("Invalid JSON payload");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return badRequest("Invalid payload");
  }

  const name = parseName((payload as Record<string, unknown>).name);
  if (name instanceof NextResponse) {
    return name;
  }

  const columnsInputRaw = (payload as Record<string, unknown>).columns;
  const columnsResult =
    columnsInputRaw === undefined
      ? DEFAULT_BOARD_COLUMNS
      : parseColumnsPayload(columnsInputRaw);

  if (columnsResult instanceof NextResponse) {
    return columnsResult;
  }

  const lastBoard = await prisma.mapacheBoard.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const nextPosition = lastBoard ? lastBoard.position + 1 : 0;

  const created = await prisma.mapacheBoard.create({
    data: {
      name,
      position: nextPosition,
      columns: {
        create: columnsResult.map((column, index) => ({
          title: column.title,
          position: index,
          filters: column.filters,
        })),
      },
    },
    include: { columns: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json(
    { board: normalizeBoardFromDb(created) },
    { status: 201 },
  );
}
