import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
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
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const year = parseIntParam(url.searchParams.get("year"), new Date().getFullYear());
  const quarter = parseQuarter(url.searchParams.get("quarter"), 1);
  const teamParam = url.searchParams.get("team") || null;

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, team: true },
  });
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = viewer.role === DbRole.admin;
  const isLeader = viewer.role === DbRole.lider;
  const canSelectAnyTeam = isAdmin;

  let team: string | null = canSelectAnyTeam ? teamParam : viewer.team ?? null;
  if (isLeader && !canSelectAnyTeam) {
    team = viewer.team ?? null;
  }

  if (!team) {
    return NextResponse.json({ team: null, members: [] });
  }

  const members = await prisma.user.findMany({
    where: { team },
    select: { 
      id: true, 
      email: true, 
      name: true, 
      role: true, 
      team: true, 
      image: true, 
      positionName: true, 
      leaderEmail: true 
    },
    orderBy: { email: "asc" },
  });

  const goals = await prisma.quarterlyGoal.findMany({
    where: { userId: { in: members.map((m) => m.id) }, year, quarter },
    select: { userId: true, amount: true },
  });
  const goalByUser = new Map(goals.map((g) => [g.userId, Number(g.amount)]));

  const snapshots = await prisma.goalsProgressSnapshot.findMany({
    where: {
      userId: { in: members.map((m) => m.id) },
      year,
      quarter,
    },
    select: {
      userId: true,
      progressAmount: true,
      pct: true,
      dealsCount: true,
      lastSyncedAt: true,
    },
  });
  const snapshotByUser = new Map(
    snapshots.map((s) => [s.userId, {
      progress: Number(s.progressAmount),
      pct: Number(s.pct),
      dealsCount: s.dealsCount,
      lastSyncedAt: s.lastSyncedAt?.toISOString() ?? null,
    }])
  );

  const teamGoalRow = await prisma.teamQuarterlyGoal.findUnique({
    where: { team_year_quarter: { team, year, quarter } },
    select: { amount: true },
  });
  const teamGoal = Number(teamGoalRow?.amount ?? 0);

  const rows = members.map((m) => {
    const userGoal = goalByUser.get(m.id) ?? 0;
    const snapshot = snapshotByUser.get(m.id);
    const progress = snapshot?.progress ?? 0;
    const pct = userGoal > 0 ? (progress / userGoal) * 100 : 0;
    const dealsCount = snapshot?.dealsCount ?? 0;
    const lastSyncedAt = snapshot?.lastSyncedAt ?? null;

    return {
      userId: m.id,
      email: m.email,
      name: m.name,
      role: m.role,
      team: m.team,
      image: m.image,
      positionName: m.positionName,
      leaderEmail: m.leaderEmail,
      goal: userGoal,
      progress,
      pct,
      dealsCount,
      lastSyncedAt,
    };
  });

  const teamProgress = rows.reduce((a, r) => a + r.progress, 0);
  const oldestSync = rows
    .map((r) => r.lastSyncedAt)
    .filter((s): s is string => !!s)
    .sort()[0] ?? null;

  return NextResponse.json({
    team,
    year,
    quarter,
    teamGoal,
    teamProgress,
    members: rows,
    oldestSync,
    source: "database",
  });
}
