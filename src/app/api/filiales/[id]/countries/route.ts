// src/app/api/filiales/[id]/countries/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Ctx = { params: { id: string } };

// Crear país dentro del grupo (id = groupId)
export async function POST(_req: NextRequest, { params }: Ctx) {
  const groupId = params.id;
  const body: { name: string } = await _req.json();

  const created = await prisma.filialCountry.create({
    data: { groupId, name: body.name },
    select: { id: true, name: true, groupId: true, createdAt: true },
  });

  return NextResponse.json(created, { status: 201 });
}

// Editar país (por body.id)
export async function PATCH(req: NextRequest) {
  const body: { id: string; name: string } = await req.json();

  const updated = await prisma.filialCountry.update({
    where: { id: body.id },
    data: { name: body.name },
    select: { id: true, name: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}

// Borrar país (por body.id)
export async function DELETE(req: NextRequest) {
  const body: { id: string } = await req.json();
  await prisma.filialCountry.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}
