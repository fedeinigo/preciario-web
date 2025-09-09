// src/app/api/filiales/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type GroupDTO = {
  id: string;
  title: string;
  countries: { id: string; name: string }[];
};

export async function GET() {
  const groups = await prisma.filialGroup.findMany({
    orderBy: { title: "asc" },
    include: {
      countries: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });

  const data: GroupDTO[] = groups.map((g) => ({
    id: g.id,
    title: g.title,
    countries: g.countries.map((c) => ({ id: c.id, name: c.name })),
  }));

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body: { title: string } = await req.json();
  const created = await prisma.filialGroup.create({
    data: { title: body.title },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(created, { status: 201 });
}
