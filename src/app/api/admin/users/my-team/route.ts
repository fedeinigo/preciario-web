import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role as DbRole } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { role: true, team: true },
  });

  const myRole = me?.role ?? DbRole.usuario;
  const myTeam = me?.team ?? null;

  // admin puede usar esto también (devuelve vacío si no tiene team)
  if (myRole !== DbRole.lider && myRole !== DbRole.admin) {
    return NextResponse.json({ team: myTeam, members: [] });
  }

  if (!myTeam) return NextResponse.json({ team: null, members: [] });

  const members = await prisma.user.findMany({
    where: { team: myTeam },
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  });

  return NextResponse.json({ team: myTeam, members });
}
