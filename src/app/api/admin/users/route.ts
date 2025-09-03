import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { AppRole } from "@/constants/teams";
import { toDbRole, fromDbRole } from "@/lib/roles";

async function requireSuperadmin() {
  const session = await auth();
  const role = session?.user?.role as AppRole | undefined;
  if (!session || role !== "superadmin") {
    return {
      ok: false as const,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true as const };
}

export async function GET() {
  const guard = await requireSuperadmin();
  if (!guard.ok) return guard.res;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      team: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped = users.map((u) => ({
    ...u,
    role: fromDbRole(u.role),
  }));

  return NextResponse.json(mapped);
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSuperadmin();
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    role?: AppRole;
    team?: string | null;
  };

  const email = body.email?.toLowerCase();
  const role = body.role;
  const team = body.team ?? null;
  if (!email) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (role === "superadmin" || role === "lider" || role === "comercial") {
    data.role = toDbRole(role);
  }
  if (typeof team === "string" || team === null) {
    data.team = team;
  }

  const updated = await prisma.user.update({
    where: { email },
    data,
    select: { id: true, email: true, role: true, team: true, updatedAt: true },
  });

  return NextResponse.json({
    ...updated,
    role: fromDbRole(updated.role),
  });
}

export const PUT = PATCH;
