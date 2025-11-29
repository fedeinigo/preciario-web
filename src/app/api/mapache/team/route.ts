import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

const MAPACHE_TEAM = "Mapaches";

export async function GET() {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const user = session?.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = user.role === "admin";
  const isMapache = user.team === MAPACHE_TEAM;

  if (!isAdmin && !isMapache) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { team: MAPACHE_TEAM },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return NextResponse.json(users);
}
