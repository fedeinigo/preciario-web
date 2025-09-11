// src/app/api/items/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// /api/items/[id]
function getItemIdFromUrl(req: Request): string | null {
  try {
    const { pathname } = new URL(req.url);
    const parts = pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "items");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    return null;
  }
}

export async function PATCH(req: Request) {
  const id = getItemIdFromUrl(req);
  if (!id) {
    return NextResponse.json({ error: "id no encontrado en la URL" }, { status: 400 });
  }

  const body: {
    sku?: string;
    category?: string;
    name?: string;
    description?: string;
    unitPrice?: number;
    devHours?: number;
    active?: boolean;
  } = await req.json();

  if (typeof body.sku === "string") {
    const newSku = body.sku.trim();
    if (newSku) {
      const dup = await prisma.item.findFirst({
        where: {
          sku: { equals: newSku, mode: "insensitive" },
          NOT: { id },
        },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json({ error: "El SKU ya existe" }, { status: 409 });
      }
    }
  }

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

export async function DELETE(req: Request) {
  const id = getItemIdFromUrl(req);
  if (!id) {
    return NextResponse.json({ error: "id no encontrado en la URL" }, { status: 400 });
  }

  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
