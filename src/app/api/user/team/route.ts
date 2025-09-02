// src/app/api/user/team/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const TEAMS = [
  "Leones","Lobos","Tigres","Panteras","Jaguares","Pirañas","Tiburones",
  "Gorilas","Abejas","Mapaches","Hormigas","Carpinchos","Buhos",
] as const;

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { team } = (await req.json().catch(() => ({}))) as { team?: string };
  if (!team || !TEAMS.includes(team as (typeof TEAMS)[number])) {
    return NextResponse.json({ ok: false, error: "Equipo inválido" }, { status: 400 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, team: true, role: true },
  });
  if (!me) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const isSuper = session.user.role === "superadmin";
  if (me.team && !isSuper) {
    return NextResponse.json({ ok: false, error: "El equipo ya fue seleccionado" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: me.id },
    data: { team },
  });

  return NextResponse.json({ ok: true });
}
