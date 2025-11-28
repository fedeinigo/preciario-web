import { NextResponse } from "next/server";

import logger from "@/lib/logger";
import { searchDealsByMapacheAssignedMany, searchDealsByOwnerEmails } from "@/lib/pipedrive";
import { requireApiSession } from "@/app/api/_utils/require-auth";

const log = logger.child({ route: "api/pipedrive/team-deals" });

export async function POST(req: Request) {
  const { response } = await requireApiSession();
  if (response) return response;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "mapache";

  let identifiers: string[] = [];
  try {
    const payload = (await req.json()) as { names?: unknown };
    if (Array.isArray(payload?.names)) {
      identifiers = payload.names.map((name) => String(name ?? ""));
    }
  } catch (error) {
    log.warn("parse_error", { error: error instanceof Error ? error.message : String(error) });
  }

  if (identifiers.length === 0) {
    return NextResponse.json({ ok: false, error: "No se recibieron integrantes" }, { status: 400 });
  }

  try {
    const deals = mode === "owner"
      ? await searchDealsByOwnerEmails(identifiers)
      : await searchDealsByMapacheAssignedMany(identifiers);
    return NextResponse.json({ ok: true, deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("team_search_failed", { error: message });
    return NextResponse.json(
      { ok: false, error: "No se pudo cargar los deals del equipo" },
      { status: 500 },
    );
  }
}
