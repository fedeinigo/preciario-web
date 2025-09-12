// src/app/api/items/popularity/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Devuelve un mapa itemId -> cantidad total cotizada (suma de ProposalItem.quantity)
 * sobre propuestas NO eliminadas. No filtra por status (populares = más cotizados).
 */
export async function GET() {
  const rows = await prisma.proposalItem.groupBy({
    by: ["itemId"],
    _sum: { quantity: true },
    where: {
      proposal: { deletedAt: null },
    },
  });

  const map: Record<string, number> = {};
  rows.forEach((r) => {
    map[r.itemId] = (r._sum.quantity ?? 0);
  });

  return NextResponse.json(map);
}
