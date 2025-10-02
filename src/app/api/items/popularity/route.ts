// src/app/api/items/popularity/route.ts
import { NextResponse } from "next/server";
import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

/**
 * Devuelve un mapa itemId -> cantidad total cotizada (suma de ProposalItem.quantity)
 * sobre propuestas NO eliminadas. No filtra por status (populares = mas cotizados).
 */
export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;

  const rows = await prisma.proposalItem.groupBy({
    by: ["itemId"],
    _sum: { quantity: true },
    where: {
      proposal: { deletedAt: null },
    },
  });

  const map: Record<string, number> = {};
  rows.forEach((r) => {
    map[r.itemId] = r._sum.quantity ?? 0;
  });

  return NextResponse.json(map);
}
