// src/app/api/glossary/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body: { label: string; url: string } = await req.json();

  const updated = await prisma.glossaryLink.update({
    where: { id },
    data: { label: body.label, url: body.url },
    select: { id: true, label: true, url: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  await prisma.glossaryLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
