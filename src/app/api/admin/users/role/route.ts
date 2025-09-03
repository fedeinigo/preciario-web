// src/app/api/admin/users/role/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role as DbRole } from "@prisma/client";

const TEAMS = [
  "Leones","Lobos","Tigres","Panteras","Jaguares","Pirañas","Tiburones",
  "Gorilas","Abejas","Mapaches","Hormigas","Carpinchos","Buhos",
] as const;

type RoleChange = "lider" | "usuario";

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { userId, role, team } = (await req.json().catch(() => ({}))) as {
    userId?: string;
    role?: RoleChange;
    team?: string;
  };

  if (!userId || !role) {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }
  if (role === "lider" && (!team || !TEAMS.includes(team as (typeof TEAMS)[number]))) {
    return NextResponse.json({ ok: false, error: "Equipo inválido para Líder" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: role === "lider" ? DbRole.lider : DbRole.usuario,
      team: role === "lider" ? team : null,
    },
  });

  return NextResponse.json({ ok: true });
}
