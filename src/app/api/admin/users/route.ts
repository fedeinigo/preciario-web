// src/app/api/admin/users/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";

type Role = "admin" | "comercial";

async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!session || role !== "admin") {
    return {
      ok: false as const,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true as const };
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    role?: Role;
  };

  const email = body.email?.toLowerCase();
  const role = body.role;
  if (!email || (role !== "admin" && role !== "comercial")) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role, updatedAt: new Date() },
    select: { id: true, email: true, role: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}

export const PUT = PATCH;
