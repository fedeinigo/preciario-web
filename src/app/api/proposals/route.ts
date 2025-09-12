// src/app/api/proposals/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

/** GET /api/proposals */
export async function GET() {
  const rows = await prisma.proposal.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          item: { select: { sku: true, name: true } },
        },
      },
    },
  });

  const data = rows.map((p) => ({
    id: p.id,
    companyName: p.companyName,
    country: p.country,
    countryId: p.countryId,
    subsidiary: p.subsidiary,
    subsidiaryId: p.subsidiaryId,
    totalAmount: Number(p.totalAmount),
    totalHours: Number(p.totalHours),
    oneShot: Number(p.oneShot),
    docUrl: p.docUrl,
    docId: p.docId,
    userId: p.userId,
    userEmail: p.userEmail,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    status: p.status,
    wonAt: p.wonAt,
    items: p.items.map((pi) => ({
      sku: pi.item?.sku ?? "",
      name: pi.item?.name ?? "",
      quantity: Number(pi.quantity),
    })),
  }));

  return NextResponse.json(data);
}

/** POST /api/proposals */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    companyName?: string;
    country?: string;
    countryId?: string;
    subsidiary?: string;
    subsidiaryId?: string;
    totalAmount?: number;
    totalHours?: number;
    oneShot?: number;
    docUrl?: string | null;
    docId?: string | null;
    userId?: string;
    userEmail?: string;
    items?: Array<{
      itemId: string;
      quantity: number;
      unitPrice: number; // NETO
      devHours: number;
    }>;
  };

  const missing: string[] = [];
  if (!body.companyName) missing.push("companyName");
  if (!body.country) missing.push("country");
  if (!body.countryId) missing.push("countryId");
  if (!body.subsidiary) missing.push("subsidiary");
  if (!body.subsidiaryId) missing.push("subsidiaryId");
  if (body.totalAmount == null) missing.push("totalAmount");
  if (body.totalHours == null) missing.push("totalHours");
  if (body.oneShot == null) missing.push("oneShot");
  if (!body.userId) missing.push("userId");
  if (!body.userEmail) missing.push("userEmail");
  if (!body.items || body.items.length === 0) missing.push("items");
  if (missing.length) {
    return NextResponse.json(
      { error: `Faltan campos requeridos: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const data: Prisma.ProposalCreateInput = {
    id: randomUUID(),
    companyName: body.companyName!,
    country: body.country!,
    countryId: body.countryId!,
    subsidiary: body.subsidiary!,
    subsidiaryId: body.subsidiaryId!,
    totalAmount: body.totalAmount!,
    totalHours: body.totalHours!,
    oneShot: body.oneShot!,
    docUrl: body.docUrl ?? null,
    docId: body.docId ?? null,
    userId: body.userId!,
    userEmail: body.userEmail!,
    status: "OPEN",
    items: {
      create: body.items!.map((it) => ({
        quantity: it.quantity,
        unitPrice: it.unitPrice, // NETO
        devHours: it.devHours,
        item: { connect: { id: it.itemId } },
      })),
    },
  };

  const created = await prisma.proposal.create({
    data,
    select: {
      id: true,
      companyName: true,
      country: true,
      countryId: true,
      subsidiary: true,
      subsidiaryId: true,
      totalAmount: true,
      totalHours: true,
      oneShot: true,
      docUrl: true,
      docId: true,
      userId: true,
      userEmail: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      wonAt: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
