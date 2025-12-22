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
  const userIdParam = url.searchParams.get("userId");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, team: true },
  });
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestedUserId = userIdParam || session.user.id;
  let targetUserId = session.user.id;

  if (requestedUserId !== session.user.id) {
    const target = await prisma.user.findUnique({
      where: { id: requestedUserId },
      select: { id: true, team: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const isAdmin = viewer.role === DbRole.admin;
    const isLeaderOfTarget =
      viewer.role === DbRole.lider && !!viewer.team && viewer.team === (target.team ?? null);

    if (!isAdmin && !isLeaderOfTarget) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    targetUserId = target.id;
  }

  try {
    const snapshot = await prisma.goalsProgressSnapshot.findUnique({
      where: {
        userId_year_quarter: {
          userId: targetUserId,
          year,
          quarter,
        },
      },
    });

    if (!snapshot) {
      return NextResponse.json({
        found: false,
        userId: targetUserId,
        year,
        quarter,
        goalAmount: 0,
        progressAmount: 0,
        pct: 0,
        dealsCount: 0,
        lastSyncedAt: null,
      });
    }

    return NextResponse.json({
      found: true,
      userId: snapshot.userId,
      year: snapshot.year,
      quarter: snapshot.quarter,
      goalAmount: Number(snapshot.goalAmount),
      progressAmount: Number(snapshot.progressAmount),
      pct: Number(snapshot.pct),
      dealsCount: snapshot.dealsCount,
      lastSyncedAt: snapshot.lastSyncedAt.toISOString(),
      lastSyncedById: snapshot.lastSyncedById,
      source: snapshot.source,
    });
  } catch (error) {
    console.error("[snapshot GET]", error);
    return NextResponse.json({ error: "Failed to fetch snapshot" }, { status: 500 });
  }
}

type SnapshotPayload = {
  userId: string;
  year: number;
  quarter: number;
  goalAmount: number;
  progressAmount: number;
  pct: number;
  dealsCount: number;
  source?: string;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, team: true },
  });

  const isAdmin = me?.role === DbRole.admin;
  const isLeader = me?.role === DbRole.lider;

  if (!isAdmin && !isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const snapshots = Array.isArray(body.snapshots) ? body.snapshots : [];

    if (snapshots.length === 0) {
      return NextResponse.json({ error: "No snapshots provided" }, { status: 400 });
    }

    const now = new Date();
    const results: Array<{ userId: string; success: boolean }> = [];

    for (const snap of snapshots as SnapshotPayload[]) {
      if (!snap.userId || !snap.year || !snap.quarter) {
        results.push({ userId: snap.userId || "unknown", success: false });
        continue;
      }

      try {
        await prisma.goalsProgressSnapshot.upsert({
          where: {
            userId_year_quarter: {
              userId: snap.userId,
              year: snap.year,
              quarter: snap.quarter,
            },
          },
          update: {
            goalAmount: snap.goalAmount ?? 0,
            progressAmount: snap.progressAmount ?? 0,
            pct: snap.pct ?? 0,
            dealsCount: snap.dealsCount ?? 0,
            lastSyncedAt: now,
            lastSyncedById: session.user.id,
            source: snap.source ?? "pipedrive",
            updatedAt: now,
          },
          create: {
            userId: snap.userId,
            year: snap.year,
            quarter: snap.quarter,
            goalAmount: snap.goalAmount ?? 0,
            progressAmount: snap.progressAmount ?? 0,
            pct: snap.pct ?? 0,
            dealsCount: snap.dealsCount ?? 0,
            lastSyncedAt: now,
            lastSyncedById: session.user.id,
            source: snap.source ?? "pipedrive",
            updatedAt: now,
          },
        });
        results.push({ userId: snap.userId, success: true });
      } catch (err) {
        console.error(`[snapshot POST] Failed to upsert snapshot for ${snap.userId}`, err);
        results.push({ userId: snap.userId, success: false });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      ok: true,
      total: snapshots.length,
      success: successCount,
      lastSyncedAt: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("[snapshot POST]", error);
    return NextResponse.json({ error: "Failed to save snapshots" }, { status: 500 });
  }
}
