// src/app/api/items/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
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
  const body: {
    sku?: string;
    category?: string;
    name: string;
    description?: string;
    unitPrice: number;
    devHours: number;
  } = await req.json();

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
