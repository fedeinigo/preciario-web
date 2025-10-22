// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Role as DbRole } from "@prisma/client";

import { ensureSessionRole, requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

import { normalizeRole } from "./normalize-role";

export async function GET() {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const forbidden = ensureSessionRole(session, ["superadmin", "admin", "lider"]);
  if (forbidden) return forbidden;

  const role = (session?.user?.role as DbRole | undefined) ?? DbRole.usuario;
  const team = (session?.user?.team as string | null | undefined) ?? null;
  const userId = session?.user?.id ?? null;

  let where: Prisma.UserWhereInput | undefined;

  if (role === DbRole.lider) {
    if (!team && !userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!team && userId) {
      where = { id: userId };
    } else if (team && userId) {
      where = { OR: [{ team }, { id: userId }] };
    } else if (team) {
      where = { team };
    }
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      team: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(users);
}

/**
 * PATCH: sólo superadmin puede modificar rol/equipo.
 * Body:
 * {
 *   userId: string;
 *   role?: "superadmin" | "admin" | "lider" | "usuario" | "comercial"; // "comercial" => "usuario"
 *   team?: string | null;  // nombre del equipo o null
 * }
 */
export async function PATCH(req: Request) {
  const session = await auth();
  const myRole = (session?.user?.role as DbRole | undefined) ?? DbRole.usuario;

  if (myRole !== DbRole.superadmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    userId: string;
    role?: string;
    team?: string | null;
  };

  if (!body.userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  const data: { role?: DbRole; team?: string | null } = {};
  const r = normalizeRole(body.role);
  if (r) data.role = r;
  if ("team" in body) data.team = body.team ?? null;

  const updated = await prisma.user.update({
    where: { id: body.userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      team: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}
