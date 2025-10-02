// src/app/api/glossary/[id]/route.ts
import { NextResponse } from "next/server";

import { ensureSessionRole, requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

// /api/glossary/[id]
function getGlossaryIdFromUrl(req: Request): string | null {
  try {
    const { pathname } = new URL(req.url);
    const parts = pathname.split("/").filter(Boolean); // ["api","glossary","{id}"]
    const idx = parts.findIndex((p) => p === "glossary");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    return null;
  }
}

export async function PATCH(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const forbidden = ensureSessionRole(session, ["superadmin"]);
  if (forbidden) return forbidden;

  const id = getGlossaryIdFromUrl(req);
  if (!id) {
    return NextResponse.json({ error: "id no encontrado en la URL" }, { status: 400 });
  }

  const body: { label: string; url: string } = await req.json();

  const updated = await prisma.glossaryLink.update({
    where: { id },
    data: { label: body.label, url: body.url },
    select: { id: true, label: true, url: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const forbidden = ensureSessionRole(session, ["superadmin"]);
  if (forbidden) return forbidden;

  const id = getGlossaryIdFromUrl(req);
  if (!id) {
    return NextResponse.json({ error: "id no encontrado en la URL" }, { status: 400 });
  }

  await prisma.glossaryLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
