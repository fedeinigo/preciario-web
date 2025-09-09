// src/app/api/filiales/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = params;
  const body: { title: string } = await req.json();

  const updated = await prisma.filialGroup.update({
    where: { id },
    data: { title: body.title },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = params;
  await prisma.filialGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
