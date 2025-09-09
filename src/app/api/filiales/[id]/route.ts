// src/app/api/filiales/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// /api/filiales/[id]
function getGroupIdFromUrl(req: Request): string | null {
  try {
    const { pathname } = new URL(req.url);
    const parts = pathname.split("/").filter(Boolean); // ["api","filiales","{id}"]
    const idx = parts.findIndex((p) => p === "filiales");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    return null;
  }
}

export async function PATCH(req: Request) {
  const id = getGroupIdFromUrl(req);
  if (!id) {
    return NextResponse.json({ error: "id no encontrado en la URL" }, { status: 400 });
  }

  const body: { title: string } = await req.json();

  const updated = await prisma.filialGroup.update({
    where: { id },
    data: { title: body.title },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const id = getGroupIdFromUrl(req);
  if (!id) {
    return NextResponse.json({ error: "id no encontrado en la URL" }, { status: 400 });
  }

  await prisma.filialGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
