// src/app/api/teams/route.ts
import { NextResponse } from "next/server";
import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role as DbRole } from "@prisma/client";

// Solo admin
async function ensureAdmin() {
  const session = await auth();
  const myRole = (session?.user?.role as DbRole | undefined) ?? "usuario";
  if (myRole !== "admin") {
    return false;
  }
  return true;
}

/**
 * Lista simple de equipos
 * GET -> [{id, name}]
 */
export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;

  const rows = await prisma.teamCatalog.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json(rows);
}

/**
 * Crea equipo
 * POST { name }
 */
export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name } = (await req.json()) as { name?: string };
  const n = (name ?? "").trim();
  if (!n) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const created = await prisma.teamCatalog.create({
    data: { name: n },
    select: { id: true, name: true },
  });
  return NextResponse.json(created, { status: 201 });
}

/**
 * Renombra equipo
 * PATCH { id, name }
 */
export async function PATCH(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, name } = (await req.json()) as { id?: string; name?: string };
  if (!id || !name?.trim()) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const current = await prisma.teamCatalog.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Actualiza nombre en catalogo
  const updated = await prisma.teamCatalog.update({
    where: { id },
    data: { name: name.trim() },
    select: { id: true, name: true },
  });

  // Tambien sincroniza usuarios que tenian el nombre anterior
  await prisma.user.updateMany({
    where: { team: current.name },
    data: { team: updated.name },
  });

  return NextResponse.json(updated);
}

/**
 * Elimina equipo (opcionalmente mueve usuarios a otro nombre)
 * DELETE { id, replaceWith?: string|null }
 */
export async function DELETE(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, replaceWith } = (await req.json()) as { id?: string; replaceWith?: string | null };
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const row = await prisma.teamCatalog.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Mueve o limpia usuarios que tenian ese equipo
  await prisma.user.updateMany({
    where: { team: row.name },
    data: { team: replaceWith ? replaceWith : null },
  });

  await prisma.teamCatalog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
