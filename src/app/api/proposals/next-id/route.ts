// src/app/api/proposals/next-id/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const formatId = (seq: number) => `PPT-${String(seq).padStart(9, "0")}`;

export async function GET() {
  const agg = await prisma.proposal.aggregate({ _max: { seq: true } });
  const nextSeq = (agg._max.seq ?? 0) + 1;
  return NextResponse.json({ id: formatId(nextSeq), seq: nextSeq });
}
