import { NextResponse } from "next/server";

import logger from "@/lib/logger";
import { searchDealsByMapacheAssigned, searchDealsByOwnerEmail } from "@/lib/pipedrive";
import { requireApiSession } from "@/app/api/_utils/require-auth";

const log = logger.child({ route: "api/pipedrive/deals" });

export async function GET(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "mapache";

  const userName = session?.user?.name?.trim() ?? "";
  const userEmail = session?.user?.email?.trim() ?? "";
  if (mode === "owner" && !userEmail) {
    return NextResponse.json(
      { ok: false, error: "No se pudo resolver tu correo" },
      { status: 400 },
    );
  }
  if (mode !== "owner" && !userName) {
    return NextResponse.json(
      { ok: false, error: "No se pudo resolver tu nombre" },
      { status: 400 },
    );
  }

  try {
    const deals = mode === "owner" ? await searchDealsByOwnerEmail(userEmail) : await searchDealsByMapacheAssigned(userName);
    return NextResponse.json({ ok: true, deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("search_failed", {
      ownerEmail: mode === "owner" ? userEmail : undefined,
      mapache: mode === "owner" ? undefined : userName,
      mode,
      error: message,
      userId: session?.user?.id,
    });
    return NextResponse.json(
      { ok: false, error: "No se pudo cargar los deals de Pipedrive" },
      { status: 500 },
    );
  }
}
