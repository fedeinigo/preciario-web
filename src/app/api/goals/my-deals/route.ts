import { NextResponse } from "next/server";
import logger from "@/lib/logger";
import { requireApiSession } from "@/app/api/_utils/require-auth";
import { searchWonDealsByMapacheAssigned, searchWonDealsByOwnerEmail, type GoalsSearchOptions } from "@/lib/pipedrive";

const log = logger.child({ route: "api/goals/my-deals" });

const CACHE_TTL_MS = 60_000;
const dealsCache = new Map<string, { expiresAt: number; deals: Array<{ [key: string]: unknown }> }>();

function parseBooleanParam(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function parseIntParam(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
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

export async function GET(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "mapache";
  const force = parseBooleanParam(url.searchParams.get("force"));
  const year = parseIntParam(url.searchParams.get("year"));
  const quarter = parseIntParam(url.searchParams.get("quarter"));

  if (!year || !quarter || quarter < 1 || quarter > 4) {
    return NextResponse.json(
      { ok: false, error: "Año y trimestre son requeridos" },
      { status: 400 },
    );
  }

  const userName = session?.user?.name?.trim() ?? "";
  const userEmail = session?.user?.email?.trim().toLowerCase() ?? "";

  if (mode === "mapache" && !userName) {
    return NextResponse.json(
      { ok: false, error: "No se pudo resolver tu nombre" },
      { status: 400 },
    );
  }

  if (mode === "owner" && !userEmail) {
    return NextResponse.json(
      { ok: false, error: "No se pudo resolver tu email" },
      { status: 400 },
    );
  }

  try {
    const identifier = mode === "owner" ? userEmail : userName;
    const cacheKey = `goals:${mode}:${year}:${quarter}:${identifier}`;
    
    if (!force) {
      const cached = readCache(cacheKey);
      if (cached) {
        log.info("cache_hit", { cacheKey, count: cached.length });
        return NextResponse.json({ ok: true, deals: cached });
      }
    }

    const searchOptions: GoalsSearchOptions = { year, quarter };
    const deals = mode === "owner"
      ? await searchWonDealsByOwnerEmail(userEmail, searchOptions)
      : await searchWonDealsByMapacheAssigned(userName, searchOptions);

    const filteredDeals = deals.filter((deal) => {
      const wonAt = deal.wonAt ?? null;
      const wonDate = wonAt ? new Date(wonAt) : null;
      const wonYear = wonDate?.getFullYear() ?? null;
      const wonQuarter = deal.wonQuarter ?? null;
      const wonMonthQuarter = wonDate ? Math.floor(wonDate.getMonth() / 3) + 1 : null;
      return wonYear === year && (wonQuarter === quarter || wonMonthQuarter === quarter);
    });

    writeCache(cacheKey, filteredDeals as Array<{ [key: string]: unknown }>);
    
    log.info("my_deals_complete", {
      mode,
      year,
      quarter,
      identifier,
      totalFetched: deals.length,
      filteredCount: filteredDeals.length,
    });

    return NextResponse.json({ ok: true, deals: filteredDeals });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("my_deals_failed", { error: message, mode, year, quarter });
    return NextResponse.json(
      { ok: false, error: "No se pudo cargar los deals de Pipedrive" },
      { status: 500 },
    );
  }
}
