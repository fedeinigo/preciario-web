// src/app/api/goals/user/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role as DbRole } from "@prisma/client";

type Quarter = 1 | 2 | 3 | 4;

function parseIntParam(v: string | null, fallback: number): number {
  const n = Number(v ?? "");
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const session = await auth();
  const viewerId = (session?.user?.id as string | undefined) ?? undefined;

  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const year = parseIntParam(url.searchParams.get("year"), new Date().getFullYear());
  const quarterRaw = parseIntParam(url.searchParams.get("quarter"), 1);
  const quarter: Quarter = Math.min(4, Math.max(1, quarterRaw)) as Quarter;

  const idParam = url.searchParams.get("userId");
  const emailParam = url.searchParams.get("email");

  // Quién pregunta
  const me = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { id: true, role: true, team: true },
  });
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Por defecto: yo mismo
  let targetUserId: string = viewerId;

  if (idParam || emailParam) {
    // Resolver usuario objetivo por id o email
    const target = await prisma.user.findFirst({
      where: idParam ? { id: idParam } : { email: emailParam ?? "" },
      select: { id: true, team: true },
    });
    if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const myRole = me.role;
    if (myRole === DbRole.superadmin) {
      targetUserId = target.id;
    } else if (myRole === DbRole.lider) {
      if (!!me.team && me.team === target.team) {
        targetUserId = target.id;
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // usuario común: sólo a sí mismo
      if (target.id !== viewerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      targetUserId = viewerId;
    }
  }

  const goal = await prisma.quarterlyGoal.findUnique({
    where: {
      userId_year_quarter: {
        userId: targetUserId,
        year,
        quarter,
      },
    },
    select: { amount: true },
  });

  return NextResponse.json({
    amount: Number(goal?.amount ?? 0),
    year,
    quarter,
    userId: targetUserId,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  const viewerId = (session?.user?.id as string | undefined) ?? undefined;
  const viewerRole = (session?.user?.role as string | undefined) ?? "usuario";
  const viewerTeam = (session?.user?.team as string | null | undefined) ?? null;

  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    amount?: number;
    year?: number;
    quarter?: Quarter;
    /** opcional: sólo para superadmin/líder editar a otro */
    userId?: string;
  };

  const now = new Date();
  const year = Number.isFinite(body.year) ? (body.year as number) : now.getFullYear();
  const quarter = (([1, 2, 3, 4] as const).includes(body.quarter ?? 1)
    ? (body.quarter as Quarter)
    : 1) as Quarter;
  const amount = Number(body.amount ?? 0);

  let targetUserId: string = viewerId;

  // Permitir que superadmin/líder editen objetivos de otro usuario (si es de su equipo).
  if (body.userId && (viewerRole === "superadmin" || viewerRole === "lider")) {
    const target = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true, team: true },
    });
    if (!target) return NextResponse.json({ error: "Usuario objetivo no encontrado" }, { status: 404 });

    if (viewerRole === "lider") {
      if (!viewerTeam || target.team !== viewerTeam) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    targetUserId = target.id;
  }

  await prisma.quarterlyGoal.upsert({
    where: {
      userId_year_quarter: {
        userId: targetUserId,
        year,
        quarter,
      },
    },
    update: { amount },
    create: { userId: targetUserId, year, quarter, amount },
  });

  return NextResponse.json({ ok: true, userId: targetUserId, year, quarter, amount });
}
