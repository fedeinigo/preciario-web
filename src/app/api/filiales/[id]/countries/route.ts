// src/app/api/filiales/[id]/countries/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Utilidad: extraer el [id] de la ruta /api/filiales/[id]/countries
function getGroupIdFromUrl(req: Request): string | null {
  try {
    const { pathname } = new URL(req.url);
    // Ej: ["", "api", "filiales", "{id}", "countries"]
    const parts = pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "filiales");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    return null;
  }
}

// Crear país dentro del grupo (id = groupId proviniente de la URL)
export async function POST(req: Request) {
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

// Editar país (por body.id)
export async function PATCH(req: Request) {
  const body: { id: string; name: string } = await req.json();

  const updated = await prisma.filialCountry.update({
    where: { id: body.id },
    data: { name: body.name },
    select: { id: true, name: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}

// Borrar país (por body.id)
export async function DELETE(req: Request) {
  const body: { id: string } = await req.json();
  await prisma.filialCountry.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}
