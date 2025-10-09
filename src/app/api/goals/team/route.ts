// src/app/api/goals/team/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { quarterRange } from "@/lib/quarter";
import { Role as DbRole } from "@prisma/client";

type Quarter = 1 | 2 | 3 | 4;

function parseIntParam(v: string | null, fallback: number): number {
  const n = Number(v ?? "");
  return Number.isFinite(n) ? n : fallback;
}

function parseQuarter(v: unknown, fallback: Quarter): Quarter {
  const n = Number(v ?? "");
  if (n >= 1 && n <= 4 && Number.isInteger(n)) return n as Quarter;
  return fallback;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const year = parseIntParam(url.searchParams.get("year"), new Date().getFullYear());
  const quarter = parseQuarter(url.searchParams.get("quarter"), 1);
  const teamParam = url.searchParams.get("team") || null;

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, team: true },
  });

  const isSuper = me?.role === DbRole.superadmin;
  const isLeader = me?.role === DbRole.lider;
  const isAdmin = me?.role === DbRole.admin;

  // equipo efectivo
  let team: string | null = teamParam;
  if (isLeader && !isSuper && !isAdmin) {
    team = me?.team ?? null; // líder: siempre su propio equipo
  }
  if (!isSuper && !isLeader && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!team) {
    return NextResponse.json({ team: null, members: [] });
  }

  const { from, to } = quarterRange(year, quarter);

  // miembros del equipo
  const members = await prisma.user.findMany({
    where: { team },
    select: { id: true, email: true, name: true },
    orderBy: { email: "asc" },
  });

  // metas individuales
  const goals = await prisma.quarterlyGoal.findMany({
    where: { userId: { in: members.map((m) => m.id) }, year, quarter },
    select: { userId: true, amount: true },
  });
  const goalByUser = new Map(goals.map((g) => [g.userId, Number(g.amount)]));

  // progreso WON del Q por usuario
  const progress = await prisma.proposal.groupBy({
    by: ["userId"],
    _sum: { totalAmount: true },
    _count: { _all: true },
    where: {
      userId: { in: members.map((m) => m.id) },
      status: "WON",
      deletedAt: null,
      createdAt: { gte: from, lte: to },
    },
  });
  const progByUser = new Map(progress.map((p) => [p.userId, Number(p._sum.totalAmount ?? 0)]));
  const proposalCountByUser = new Map(progress.map((p) => [p.userId, Number(p._count?._all ?? 0)]));

  const manualProgress = await prisma.manualWonDeal.groupBy({
    by: ["userId"],
    _sum: { monthlyFee: true },
    _count: { _all: true },
    where: {
      userId: { in: members.map((m) => m.id) },
      year,
      quarter,
    },
  });
  const manualByUser = new Map(
    manualProgress.map((p) => [p.userId, Number(p._sum.monthlyFee ?? 0)])
  );
  const manualCountByUser = new Map(
    manualProgress.map((p) => [p.userId, Number(p._count?._all ?? 0)])
  );

  const rows = members.map((m) => {
    const userGoal = goalByUser.get(m.id) ?? 0;
    const userProg = (progByUser.get(m.id) ?? 0) + (manualByUser.get(m.id) ?? 0);
    const pct = userGoal > 0 ? (userProg / userGoal) * 100 : 0;
    const proposalsCount = proposalCountByUser.get(m.id) ?? 0;
    const manualCount = manualCountByUser.get(m.id) ?? 0;
    const dealsCount = proposalsCount + manualCount;
    return {
      userId: m.id,
      email: m.email,
      name: m.name,
      goal: userGoal,
      progress: userProg,
      pct,
      dealsCount,
    };
  });

  // Objetivo del equipo guardado de forma independiente
  const teamGoalRow = await prisma.teamQuarterlyGoal.findUnique({
    where: { team_year_quarter: { team, year, quarter } },
    select: { amount: true },
  });
  const teamGoal = Number(teamGoalRow?.amount ?? 0);

  // Progreso total del equipo (suma de WON de miembros)
  const teamProgress = rows.reduce((a, r) => a + r.progress, 0);

  return NextResponse.json({
    team,
    year,
    quarter,
    teamGoal,       // objetivo propio del equipo (NO suma de individuales)
    teamProgress,   // avance WON del equipo en el trimestre
    members: rows,  // metas individuales
  });
}

/**
 * PUT: Actualiza el objetivo del equipo (independiente de metas individuales).
 *
 * Permisos:
 * - superadmin: cualquier equipo
 * - líder: sólo su equipo
 */
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, team: true },
  });

  const isSuper = me?.role === DbRole.superadmin;
  const isLeader = me?.role === DbRole.lider;

  if (!isSuper && !isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    team?: string | null;
    amount?: number;
    year?: number;
    quarter?: Quarter;
  };

  const now = new Date();
  const year = Number.isFinite(body.year) ? (body.year as number) : now.getFullYear();
  const quarter = parseQuarter(body.quarter, 1);
  const amount = Math.max(0, Number(body.amount ?? 0));

  let targetTeam = (body.team ?? "").trim() || null;
  if (isLeader && !isSuper) {
    targetTeam = me?.team ?? null; // líder: forzamos su equipo
  }
  if (!targetTeam) {
    return NextResponse.json({ error: "Equipo requerido" }, { status: 400 });
  }

  // Guardamos SOLO el objetivo del equipo (no tocamos objetivos individuales)
  await prisma.teamQuarterlyGoal.upsert({
    where: { team_year_quarter: { team: targetTeam, year, quarter } },
    update: { amount },
    create: { team: targetTeam, year, quarter, amount },
  });

  return NextResponse.json({ ok: true, team: targetTeam, year, quarter, amount });
}
