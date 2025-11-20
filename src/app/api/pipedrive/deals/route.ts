import { NextResponse } from "next/server";

import logger from "@/lib/logger";
import { searchDealsByMapacheAssigned } from "@/lib/pipedrive";
import { requireApiSession } from "@/app/api/_utils/require-auth";

const log = logger.child({ route: "api/pipedrive/deals" });

export async function GET() {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const mapacheName = session?.user?.name?.trim() ?? "";
  if (!mapacheName) {
    return NextResponse.json(
      { ok: false, error: "No se pudo resolver tu nombre" },
      { status: 400 },
    );
  }

  try {
    const deals = await searchDealsByMapacheAssigned(mapacheName);
    return NextResponse.json({ ok: true, deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("search_failed", {
      mapache: mapacheName,
      error: message,
      userId: session?.user?.id,
    });
    return NextResponse.json(
      { ok: false, error: "No se pudo cargar los deals de Pipedrive" },
      { status: 500 },
    );
  }
}
