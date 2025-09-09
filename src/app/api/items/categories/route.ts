// src/app/api/items/categories/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";


// GET: categorías distintas (string[])
export async function GET() {
  const rows = await prisma.item.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  const cats = rows.map((r) => r.category);
  return NextResponse.json(cats);
}

// PATCH: renombrar categoría { from: string, to: string } (requiere superadmin)
export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }
  const { from, to } = (await req.json()) as { from?: string; to?: string };
  if (!from || !to) {
    return NextResponse.json({ ok: false, error: "Parámetros inválidos" }, { status: 400 });
  }
  const res = await prisma.item.updateMany({
    where: { category: from },
    data: { category: to },
  });
  return NextResponse.json({ ok: true, updated: res.count });
}

// DELETE: eliminar categoría moviendo ítems a otra { name: string, replaceWith?: string }
// si no envías replaceWith, se usa "general". Requiere superadmin
export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }
  const { name, replaceWith } = (await req.json()) as { name?: string; replaceWith?: string };
  if (!name) {
    return NextResponse.json({ ok: false, error: "Parámetros inválidos" }, { status: 400 });
  }
  const target = replaceWith?.trim() || "general";
  const res = await prisma.item.updateMany({
    where: { category: name },
    data: { category: target },
  });
  return NextResponse.json({ ok: true, moved: res.count, to: target });
}
