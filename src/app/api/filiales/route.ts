// src/app/api/filiales/route.ts
import { NextResponse } from "next/server";

import { ensureSessionRole, requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

type GroupDTO = {
  id: string;
  title: string;
  countries: { id: string; name: string }[];
};

export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;

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

  const jsonResponse = NextResponse.json(data);
  jsonResponse.headers.set("Cache-Control", "private, max-age=300, stale-while-revalidate=300");
  return jsonResponse;
}

export async function POST(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const forbidden = ensureSessionRole(session, ["admin"]);
  if (forbidden) return forbidden;

  const body: { title: string } = await req.json();
  const created = await prisma.filialGroup.create({
    data: { title: body.title },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(created, { status: 201 });
}

