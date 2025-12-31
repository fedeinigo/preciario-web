// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { PortalKey as DbPortalKey, Role as DbRole } from "@prisma/client";

import { ensureSessionRole, requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  MUTABLE_PORTAL_ACCESS,
  type PortalAccessId,
  includeDefaultPortal,
  normalizePortalInput,
} from "@/constants/portals";
import { appRoleFromDb } from "@/lib/roles";

import { normalizeRole } from "./normalize-role";

const DB_TO_PORTAL: Record<DbPortalKey, PortalAccessId> = {
  [DbPortalKey.DIRECT]: "direct",
  [DbPortalKey.MAPACHE]: "mapache",
  [DbPortalKey.PARTNER]: "partner",
  [DbPortalKey.MARKETING]: "marketing",
  [DbPortalKey.ANALYTICS]: "analytics",
};

const PORTAL_TO_DB: Record<(typeof MUTABLE_PORTAL_ACCESS)[number], DbPortalKey> = {
  mapache: DbPortalKey.MAPACHE,
  analytics: DbPortalKey.ANALYTICS,
};

function portalsFromDb(
  portalRows: { portal: DbPortalKey }[],
  role: DbRole,
  team: string | null,
): PortalAccessId[] {
  if (portalRows.length === 0) {
    const fallback = new Set<PortalAccessId>(["direct"]);
    const appRole = appRoleFromDb(role);
    if (appRole === "admin") {
      fallback.add("mapache");
      fallback.add("partner");
      fallback.add("marketing");
    } else if (team === "Mapaches") {
      fallback.add("mapache");
    }
    return includeDefaultPortal(fallback);
  }

  const keys = portalRows.map((row) => DB_TO_PORTAL[row.portal]);
  return includeDefaultPortal(keys);
}

export async function GET() {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const forbidden = ensureSessionRole(session, ["admin", "lider"]);
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
      positionName: true,
      leaderEmail: true,
      createdAt: true,
      updatedAt: true,
      portalAccesses: {
        select: {
          portal: true,
        },
      },
    },
  });
  const payload = users.map(({ portalAccesses, ...rest }) => ({
    ...rest,
    portals: portalsFromDb(portalAccesses, rest.role, rest.team ?? null),
  }));
  const responsePayload = NextResponse.json(payload);
  responsePayload.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=60");
  return responsePayload;
}

/**
 * PATCH: sólo admin puede modificar rol/equipo.
 * Body:
 * {
 *   userId: string;
 *   role?: "admin" | "lider" | "usuario" | "comercial"; // "comercial" => "usuario"
 *   team?: string | null;  // nombre del equipo o null
 * }
 */
export async function PATCH(req: Request) {
  const session = await auth();
  const myRole = (session?.user?.role as DbRole | undefined) ?? DbRole.usuario;

  if (myRole !== DbRole.admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    userId: string;
    role?: string;
    team?: string | null;
    portals?: unknown;
  };

  if (!body.userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  const data: { role?: DbRole; team?: string | null } = {};
  const r = normalizeRole(body.role);
  if (r) data.role = r;
  if ("team" in body) data.team = body.team ?? null;

  let portalsToStore: DbPortalKey[] | undefined;
  if ("portals" in body) {
    const sanitized = normalizePortalInput(body.portals);
    if (!sanitized) {
      return NextResponse.json({ error: "Portals inválidos" }, { status: 400 });
    }
    const keepDirect = sanitized.includes("direct");
    const mapped = sanitized
      .filter((portal): portal is (typeof MUTABLE_PORTAL_ACCESS)[number] => portal !== "direct")
      .map((portal) => PORTAL_TO_DB[portal]);
    if (keepDirect) {
      mapped.unshift(DbPortalKey.DIRECT);
    }
    portalsToStore = mapped;
  }

  const existing = await prisma.user.findUnique({
    where: { id: body.userId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.user.update({
        where: { id: body.userId },
        data,
      });
    }

    if (portalsToStore) {
      await tx.portalAccess.deleteMany({ where: { userId: body.userId } });
      if (portalsToStore.length > 0) {
        await tx.portalAccess.createMany({
          data: portalsToStore.map((portal) => ({
            userId: body.userId,
            portal,
          })),
        });
      }
    }

    return tx.user.findUnique({
      where: { id: body.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        team: true,
        positionName: true,
        leaderEmail: true,
        createdAt: true,
        updatedAt: true,
        portalAccesses: {
          select: {
            portal: true,
          },
        },
      },
    });
  });

  if (!updated) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const { portalAccesses, ...rest } = updated;

  return NextResponse.json({
    ...rest,
    portals: portalsFromDb(portalAccesses, rest.role, rest.team ?? null),
  });
}
