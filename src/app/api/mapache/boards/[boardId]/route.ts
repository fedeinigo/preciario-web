// src/app/api/mapache/boards/[boardId]/route.ts
import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

import { ensureMapacheAccess } from "../../tasks/access";
import {
  badRequest,
  normalizeBoardFromDb,
  parseColumnsPayload,
  type ColumnPayload,
} from "../utils";

function parseName(value: unknown): string | null | NextResponse {
  if (value === undefined) return null;
  if (typeof value !== "string" || !value.trim()) {
    return badRequest("name is required");
  }
  if (value.trim().length > 120) {
    return badRequest("name is too long");
  }
  return value.trim();
}

async function applyColumnUpdates(
  boardId: string,
  columns: ColumnPayload[],
): Promise<NextResponse | null> {
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.mapacheBoardColumn.findMany({
        where: { boardId },
        select: { id: true },
      });
      const existingSet = new Set(existing.map((column) => column.id));

      const incomingIds = new Set(
        columns
          .map((column) => column.id)
          .filter((id): id is string => typeof id === "string"),
      );

      const invalidId = Array.from(incomingIds).find(
        (id) => !existingSet.has(id),
      );
      if (invalidId) {
        throw badRequest(`Unknown column id: ${invalidId}`);
      }

      const toDelete = existing
        .map((column) => column.id)
        .filter((id) => !incomingIds.has(id));

      if (toDelete.length > 0) {
        await tx.mapacheBoardColumn.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      for (let index = 0; index < columns.length; index += 1) {
        const column = columns[index]!;
        if (column.id) {
          await tx.mapacheBoardColumn.update({
            where: { id: column.id },
            data: {
              title: column.title,
              position: index,
              filters: column.filters,
            },
          });
        } else {
          await tx.mapacheBoardColumn.create({
            data: {
              boardId,
              title: column.title,
              position: index,
              filters: column.filters,
            },
          });
        }
      }
    });
    return null;
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    throw error;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { boardId: string } },
) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const access = ensureMapacheAccess(session);
  if (access.response) return access.response;

  const boardId = params.boardId;
  if (typeof boardId !== "string" || !boardId.trim()) {
    return badRequest("Invalid board id");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return badRequest("Invalid JSON payload");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return badRequest("Invalid payload");
  }

  const nameResult = parseName((payload as Record<string, unknown>).name);
  if (nameResult instanceof NextResponse) {
    return nameResult;
  }
  const nextName = nameResult;

  const columnsRaw = (payload as Record<string, unknown>).columns;
  let columns: ColumnPayload[] | null = null;
  if (columnsRaw !== undefined) {
    const parsed = parseColumnsPayload(columnsRaw);
    if (parsed instanceof NextResponse) {
      return parsed;
    }
    columns = parsed;
  }

  const existing = await prisma.mapacheBoard.findUnique({
    where: { id: boardId },
    include: { columns: { select: { id: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (columns) {
    const existingIds = new Set(existing.columns.map((column) => column.id));
    const invalidColumn = columns
      .map((column) => column.id)
      .filter((id): id is string => typeof id === "string")
      .find((id) => !existingIds.has(id));
    if (invalidColumn) {
      return badRequest(`Unknown column id: ${invalidColumn}`);
    }
  }

  if (nextName !== null) {
    await prisma.mapacheBoard.update({
      where: { id: boardId },
      data: { name: nextName },
    });
  }

  if (columns) {
    const columnResponse = await applyColumnUpdates(boardId, columns);
    if (columnResponse) {
      return columnResponse;
    }
  }

  const updated = await prisma.mapacheBoard.findUnique({
    where: { id: boardId },
    include: { columns: { orderBy: { position: "asc" } } },
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ board: normalizeBoardFromDb(updated) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { boardId: string } },
) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const access = ensureMapacheAccess(session);
  if (access.response) return access.response;

  const boardId = params.boardId;
  if (typeof boardId !== "string" || !boardId.trim()) {
    return badRequest("Invalid board id");
  }

  try {
    await prisma.mapacheBoard.delete({ where: { id: boardId } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
