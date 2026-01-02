import { NextResponse } from "next/server";
import logger from "@/lib/logger";
import { requireApiSession } from "@/app/api/_utils/require-auth";

const log = logger.child({ route: "api/goals/team-sync" });

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
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

function getQuarterDateRange(year: number, quarter: number): { start: string; end: string } {
  const quarterStartMonth = (quarter - 1) * 3;
  const startDate = new Date(Date.UTC(year, quarterStartMonth, 1));
  const endDate = new Date(Date.UTC(year, quarterStartMonth + 3, 0, 23, 59, 59));
  return {
    start: startDate.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0],
  };
}

export async function POST(req: Request) {
  const { response } = await requireApiSession();
  if (response) return response;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "mapache";
  const force = parseBooleanParam(url.searchParams.get("force"));

  let names: string[] = [];
  let year: number | null = null;
  let quarter: number | null = null;
  
  try {
    const payload = (await req.json()) as { 
      names?: unknown; 
      year?: unknown; 
      quarter?: unknown;
    };
    if (Array.isArray(payload?.names)) {
      names = payload.names.map((name) => String(name ?? ""));
    }
    if (typeof payload?.year === "number") {
      year = payload.year;
    }
    if (typeof payload?.quarter === "number" && payload.quarter >= 1 && payload.quarter <= 4) {
      quarter = payload.quarter;
    }
  } catch (error) {
    log.warn("parse_error", { error: error instanceof Error ? error.message : String(error) });
  }

  if (names.length === 0) {
    return NextResponse.json({ ok: false, error: "No se recibieron integrantes" }, { status: 400 });
  }

  if (!year || !quarter) {
    return NextResponse.json({ ok: false, error: "Año y trimestre son requeridos" }, { status: 400 });
  }

  try {
    const cacheKey = `goals:${mode}:${year}:${quarter}:${names.map((name) => name.trim()).filter(Boolean).sort().join("|")}`;
    if (!force) {
      const cached = readCache(cacheKey);
      if (cached) {
        log.info("cache_hit", { cacheKey, count: cached.length });
        return NextResponse.json({ ok: true, deals: cached });
      }
    }

    const { searchWonDealsByMapacheAssignedMany, searchWonDealsByOwnerEmailsMany } = await import("@/lib/pipedrive");

    const deals =
      mode === "owner"
        ? await searchWonDealsByOwnerEmailsMany(names, { year, quarter })
        : await searchWonDealsByMapacheAssignedMany(names, { year, quarter });
    
    writeCache(cacheKey, deals as Array<{ [key: string]: unknown }>);
    
    log.info("team_sync_complete", { 
      mode, 
      year, 
      quarter, 
      namesCount: names.length,
      dealsCount: deals.length 
    });
    
    return NextResponse.json({ ok: true, deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("team_sync_failed", { error: message, mode, year, quarter });
    return NextResponse.json(
      { ok: false, error: "No se pudo cargar los deals del equipo" },
      { status: 500 },
    );
  }
}
