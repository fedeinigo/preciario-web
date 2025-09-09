// src/app/api/filiales/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body: { title: string } = await req.json();

  const updated = await prisma.filialGroup.update({
    where: { id },
    data: { title: body.title },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  await prisma.filialGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
