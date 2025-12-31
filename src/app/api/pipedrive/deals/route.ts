import { NextResponse } from "next/server";

import logger from "@/lib/logger";
import { searchDealsByMapacheAssigned, searchDealsByOwnerName } from "@/lib/pipedrive";
import { requireApiSession } from "@/app/api/_utils/require-auth";
import type { PipedriveDealSummary } from "@/types/pipedrive";

const log = logger.child({ route: "api/pipedrive/deals" });

const CACHE_TTL_MS = 60_000;
const dealsCache = new Map<string, { expiresAt: number; deals: PipedriveDealSummary[] }>();

function parseBooleanParam(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function readCache(key: string): PipedriveDealSummary[] | null {
  const cached = dealsCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt > Date.now()) return cached.deals;
  dealsCache.delete(key);
  return null;
}

function writeCache(key: string, deals: PipedriveDealSummary[]) {
  dealsCache.set(key, { deals, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function GET(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "mapache";
  const force = parseBooleanParam(url.searchParams.get("force"));

  const userName = session?.user?.name?.trim() ?? "";
  if (!userName) {
    return NextResponse.json(
      { ok: false, error: "No se pudo resolver tu nombre" },
      { status: 400 },
    );
  }

  try {
    const cacheKey = `${mode}:${userName}`;
    if (!force) {
      const cached = readCache(cacheKey);
      if (cached) {
        return NextResponse.json({ ok: true, deals: cached });
      }
    }

    const deals =
      mode === "owner"
        ? await searchDealsByOwnerName(userName)
        : await searchDealsByMapacheAssigned(userName);
    writeCache(cacheKey, deals);
    return NextResponse.json({ ok: true, deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("search_failed", {
      mapache: userName,
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
