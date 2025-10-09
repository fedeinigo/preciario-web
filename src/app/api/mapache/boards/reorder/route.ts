// src/app/api/mapache/boards/reorder/route.ts
import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

import { ensureMapacheAccess } from "../../tasks/access";
import { badRequest } from "../utils";

export async function PATCH(request: Request) {
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

  const boardIdsRaw = (payload as Record<string, unknown>).boardIds;
  if (!Array.isArray(boardIdsRaw)) {
    return badRequest("boardIds must be an array");
  }

  const boardIds: string[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < boardIdsRaw.length; index += 1) {
    const entry = boardIdsRaw[index];
    if (typeof entry !== "string" || !entry.trim()) {
      return badRequest(`boardIds[${index}] must be a string`);
    }
    const trimmed = entry.trim();
    if (seen.has(trimmed)) {
      return badRequest(`boardIds[${index}] is duplicated`);
    }
    seen.add(trimmed);
    boardIds.push(trimmed);
  }

  const existingBoards = await prisma.mapacheBoard.findMany({
    select: { id: true },
  });

  if (existingBoards.length !== boardIds.length) {
    return badRequest("boardIds must include every board");
  }

  const existingSet = new Set(existingBoards.map((board) => board.id));
  const missing = boardIds.find((id) => !existingSet.has(id));
  if (missing) {
    return badRequest(`Unknown board id: ${missing}`);
  }

  await prisma.$transaction(
    boardIds.map((id, index) =>
      prisma.mapacheBoard.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  return NextResponse.json({ success: true });
}
