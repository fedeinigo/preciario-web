// src/app/api/my-team/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const CUSTOM_TEAM_VALUE = "__custom";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    team: session.user.team ?? null,
    positionName: (session.user as { positionName?: string | null })?.positionName ?? null,
    leaderEmail: (session.user as { leaderEmail?: string | null })?.leaderEmail ?? null,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  const {
    team,
    customTeam,
    positionName,
    leaderEmail,
  } = (await req.json()) as {
    team?: string | null;
    customTeam?: string | null;
    positionName?: string | null;
    leaderEmail?: string | null;
  };

  let normalizedTeam = (team ?? "").trim();
  const wantsCustom = normalizedTeam === CUSTOM_TEAM_VALUE;
  if (wantsCustom) {
    normalizedTeam = (customTeam ?? "").trim();
  }

  if (!normalizedTeam) {
    return NextResponse.json({ ok: false, error: "Equipo requerido" }, { status: 400 });
  }

  const normalizedPosition = (positionName ?? "").trim();
  if (!normalizedPosition) {
    return NextResponse.json({ ok: false, error: "Posición requerida" }, { status: 400 });
  }

  const normalizedLeader = (leaderEmail ?? "").trim().toLowerCase();
  if (
    !normalizedLeader ||
    !EMAIL_REGEX.test(normalizedLeader) ||
    !normalizedLeader.endsWith("@wisecx.com")
  ) {
    return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
  }

  try {
    const exists = await prisma.teamCatalog.findFirst({ where: { name: normalizedTeam } });
    if (!exists) {
      await prisma.teamCatalog.create({ data: { name: normalizedTeam } });
    }
  } catch {
    // Ignorar errores por nombres duplicados en creaciones simultáneas
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      team: normalizedTeam,
      positionName: normalizedPosition,
      leaderEmail: normalizedLeader,
    },
  });

  return NextResponse.json({ ok: true });
}
