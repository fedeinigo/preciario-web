// src/app/api/mapache/team/route.ts
import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import { ensureMapacheAccess, MAPACHE_TEAM } from "../tasks/access";
import prisma from "@/lib/prisma";

export async function GET() {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;

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
