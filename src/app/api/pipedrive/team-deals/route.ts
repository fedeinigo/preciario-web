import { NextResponse } from "next/server";

import logger from "@/lib/logger";
import { searchDealsByMapacheAssignedMany, searchDealsByOwnerEmails } from "@/lib/pipedrive";
import { requireApiSession } from "@/app/api/_utils/require-auth";

const log = logger.child({ route: "api/pipedrive/team-deals" });

const CACHE_TTL_MS = 60_000;
const dealsCache = new Map<string, { expiresAt: number; deals: Array<{ [key: string]: unknown }> }>();

function parseBooleanParam(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function readCache(key: string): Array<{ [key: string]: unknown }> | null {
  const cached = dealsCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt > Date.now()) return cached.deals;
  dealsCache.delete(key);
  return null;
}

function writeCache(key: string, deals: Array<{ [key: string]: unknown }>) {
  dealsCache.set(key, { deals, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function POST(req: Request) {
  const { response } = await requireApiSession();
  if (response) return response;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "mapache";
  const force = parseBooleanParam(url.searchParams.get("force"));

  let names: string[] = [];
  try {
    const payload = (await req.json()) as { names?: unknown };
    if (Array.isArray(payload?.names)) {
      names = payload.names.map((name) => String(name ?? ""));
    }
  } catch (error) {
    log.warn("parse_error", { error: error instanceof Error ? error.message : String(error) });
  }

  if (names.length === 0) {
    return NextResponse.json({ ok: false, error: "No se recibieron integrantes" }, { status: 400 });
  }

  try {
    const cacheKey = `${mode}:${names.map((name) => name.trim()).filter(Boolean).sort().join("|")}`;
    if (!force) {
      const cached = readCache(cacheKey);
      if (cached) {
        return NextResponse.json({ ok: true, deals: cached });
      }
    }

    const deals =
      mode === "owner"
        ? await searchDealsByOwnerEmails(names)
        : await searchDealsByMapacheAssignedMany(names);
    writeCache(cacheKey, deals as Array<{ [key: string]: unknown }>);
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
