// src/app/api/my-team/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, team: session.user.team ?? null });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  const { team } = (await req.json()) as { team?: string | null };

  // permitir null para "sin equipo"
  if (team) {
    const exists = await prisma.teamCatalog.findFirst({ where: { name: team } });
    if (!exists) {
      return NextResponse.json({ ok: false, error: "Equipo inválido" }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { team: team ?? null },
  });

  return NextResponse.json({ ok: true });
}
