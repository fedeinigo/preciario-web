import { NextResponse } from "next/server";

import logger from "@/lib/logger";
import { fetchAllDealsForAnalytics } from "@/lib/pipedrive";
import { requireApiSession } from "@/app/api/_utils/require-auth";

const log = logger.child({ route: "api/analytics/deals" });

export async function GET(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const url = new URL(req.url);
  const statusesParam = url.searchParams.get("statuses");
  const statuses: ("open" | "won" | "lost")[] = statusesParam
    ? (statusesParam.split(",") as ("open" | "won" | "lost")[])
    : ["open", "won", "lost"];

  try {
    const deals = await fetchAllDealsForAnalytics(statuses);
    const syncedAt = new Date().toISOString();

    log.info("analytics_deals_fetched", {
      userId: session?.user?.id,
      totalDeals: deals.length,
    });

    return NextResponse.json({
      ok: true,
      deals,
      syncedAt,
      count: deals.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("analytics_deals_failed", {
      error: message,
      userId: session?.user?.id,
    });
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar los deals de Pipedrive" },
      { status: 500 },
    );
  }
}
