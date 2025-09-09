// src/app/api/filiales/[id]/countries/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const groupId = params.id;
  const body: { name: string } = await req.json();

  const created = await prisma.filialCountry.create({
    data: { groupId, name: body.name },
    select: { id: true, name: true, groupId: true, createdAt: true },
  });

  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: Request) {
  const body: { id: string; name: string } = await req.json();
  const updated = await prisma.filialCountry.update({
    where: { id: body.id },
    data: { name: body.name },
    select: { id: true, name: true, updatedAt: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const body: { id: string } = await req.json();
  await prisma.filialCountry.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}
