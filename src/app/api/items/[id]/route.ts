// src/app/api/items/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = params;
  const body: {
    sku?: string;
    category?: string;
    name?: string;
    description?: string;
    unitPrice?: number;
    devHours?: number;
    active?: boolean;
  } = await req.json();

  const updated = await prisma.item.update({
    where: { id },
    data: {
      sku: body.sku,
      category: body.category,
      name: body.name,
      description: body.description,
      unitPrice: body.unitPrice,
      devHours: body.devHours,
      active: body.active,
    },
    select: {
      id: true,
      sku: true,
      category: true,
      name: true,
      description: true,
      unitPrice: true,
      devHours: true,
      active: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = params;
  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
