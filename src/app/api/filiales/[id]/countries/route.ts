// src/app/api/filiales/[id]/countries/route.ts
import { NextResponse } from "next/server";

import { ensureSessionRole, requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

// /api/filiales/[id]/countries
function getGroupIdFromUrl(req: Request): string | null {
  try {
    const { pathname } = new URL(req.url);
    const parts = pathname.split("/").filter(Boolean); // ["api","filiales","{id}","countries"]
    const idx = parts.findIndex((p) => p === "filiales");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    return null;
  }
}

/**
 * Crea un país dentro del grupo [id]
 * Body: { name: string }
 */
export async function POST(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const forbidden = ensureSessionRole(session, ["admin"]);
  if (forbidden) return forbidden;

  const groupId = getGroupIdFromUrl(req);
  if (!groupId) {
    return NextResponse.json({ error: "groupId no encontrado en la URL" }, { status: 400 });
  }

  const body: { name: string } = await req.json();

  const created = await prisma.filialCountry.create({
    data: { groupId, name: body.name },
    select: { id: true, name: true, groupId: true, createdAt: true },
  });

  return NextResponse.json(created, { status: 201 });
}

/**
 * Actualiza un país (por id)
 * Body: { id: string; name: string }
 */
export async function PATCH(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const forbidden = ensureSessionRole(session, ["admin"]);
  if (forbidden) return forbidden;

  const body: { id: string; name: string } = await req.json();

  const updated = await prisma.filialCountry.update({
    where: { id: body.id },
    data: { name: body.name },
    select: { id: true, name: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}

/**
 * Elimina un país (por id)
 * Body: { id: string }
 */
export async function DELETE(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const forbidden = ensureSessionRole(session, ["admin"]);
  if (forbidden) return forbidden;

  const body: { id: string } = await req.json();

  await prisma.filialCountry.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}
