// src/app/api/proposals/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type SaveProposalInput = {
  companyName: string;
  country: string;
  countryId?: string | null;
  subsidiary?: string | null;
  subsidiaryId?: string | null;
  items: Array<{ itemId: string; quantity: number; unitPrice: number; devHours: number }>;
  totalAmount: number;
  totalHours: number;
  oneShot: number;
  docUrl?: string | null;
  docId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
};

const formatId = (seq: number) => `PPT-${String(seq).padStart(9, "0")}`;

export async function GET() {
  const rows = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      seq: true,
      userId: true,
      userEmail: true,
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
      createdAt: true,
      updatedAt: true,
      items: {
        select: {
          quantity: true,
          item: { select: { sku: true, name: true } },
        },
      },
    },
  });

  const mapped = rows.map((p) => ({
    ...p,
    items: p.items.map((pi) => ({
      sku: pi.item.sku,
      name: pi.item.name,
      quantity: pi.quantity,
    })),
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const body: SaveProposalInput = await req.json();

  // Siguiente secuencia + ID formateado
  const max = await prisma.proposal.aggregate({ _max: { seq: true } });
  const nextSeq = (max._max.seq ?? 0) + 1;
  const nextId = formatId(nextSeq);

  const created = await prisma.proposal.create({
    data: {
      id: nextId,              // 👈 requerido por el schema
      seq: nextSeq,
      userId: body.userId ?? null,
      userEmail: body.userEmail ?? null,
      companyName: body.companyName,
      country: body.country,
      countryId: body.countryId ?? null,
      subsidiary: body.subsidiary ?? null,
      subsidiaryId: body.subsidiaryId ?? null,
      totalAmount: body.totalAmount,
      totalHours: body.totalHours,
      oneShot: body.oneShot,
      docUrl: body.docUrl ?? null,
      docId: body.docId ?? null,
      items: {
        createMany: {
          data: body.items.map((it) => ({
            itemId: it.itemId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            devHours: it.devHours,
          })),
        },
      },
    },
    select: {
      id: true,
      seq: true,
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
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
