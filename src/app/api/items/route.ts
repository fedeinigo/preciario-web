// src/app/api/items/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

const itemPayloadSchema = z.object({
  sku: z.string().trim().optional(),
  category: z.string().trim().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  unitPrice: z.number().nonnegative(),
  devHours: z.number().nonnegative(),
});

export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;

  const rows = await prisma.item.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      sku: true,
      category: true,
      name: true,
      description: true,
      unitPrice: true,
      devHours: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { response } = await requireApiSession();
  if (response) return response;

  const raw = await req.json();
  const parsed = itemPayloadSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload inválido",
        details: parsed.error.format(),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const sku = (body.sku ?? "").trim();

  if (sku) {
    const exists = await prisma.item.findFirst({
      where: { sku: { equals: sku, mode: "insensitive" } },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json({ error: "El SKU ya existe" }, { status: 409 });
    }
  }

  const created = await prisma.item.create({
    data: {
      sku,
      category: body.category ?? "general",
      name: body.name,
      description: body.description ?? "",
      unitPrice: body.unitPrice,
      devHours: body.devHours,
      active: true,
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
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
