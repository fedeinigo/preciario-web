// src/app/api/glossary/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.glossaryLink.findMany({
    orderBy: { label: "asc" },
    select: { id: true, label: true, url: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body: { label: string; url: string } = await req.json();
  const created = await prisma.glossaryLink.create({
    data: { label: body.label, url: body.url },
    select: { id: true, label: true, url: true, createdAt: true },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: Request) {
  const body: { id: string; label: string; url: string } = await req.json();
  const updated = await prisma.glossaryLink.update({
    where: { id: body.id },
    data: { label: body.label, url: body.url },
    select: { id: true, label: true, url: true, updatedAt: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const body: { id: string } = await req.json();
  await prisma.glossaryLink.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}
