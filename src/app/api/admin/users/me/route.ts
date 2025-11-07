// src/app/api/admin/users/me/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { id: true, email: true, role: true, team: true, name: true },
  });

  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: me.id,
    email: me.email,
    role: me.role,   // enum Prisma: admin | lider | usuario
    team: me.team,   // string | null
    name: me.name,
  });
}
