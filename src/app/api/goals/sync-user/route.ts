import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { searchDealsByMapacheAssigned, searchDealsByOwnerEmails } from "@/lib/pipedrive";
import logger from "@/lib/logger";

const log = logger.child({ route: "api/goals/sync-user" });

type Quarter = 1 | 2 | 3 | 4;

const MAPACHE_TEAMS = ["Mapaches NC", "Mapaches Upsell"];

function getCurrentQuarter(): Quarter {
  const month = new Date().getMonth();
  if (month <= 2) return 1;
  if (month <= 5) return 2;
  if (month <= 8) return 3;
  return 4;
}

export async function POST(req: Request) {
  const session = await auth();
  const viewerId = session?.user?.id as string | undefined;

  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let targetUserId: string | undefined;
  try {
    const body = (await req.json()) as { userId?: string };
    targetUserId = body.userId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!targetUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { id: true, role: true, team: true },
  });

  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, name: true, team: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isAdmin = viewer.role === "admin";
  const isLeader = viewer.role === "lider";
  const isSelf = viewer.id === targetUser.id;
  const sameTeam = viewer.team && viewer.team === targetUser.team;

  if (!isSelf && !isAdmin && !(isLeader && sameTeam)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const quarter = getCurrentQuarter();

  const isMapacheTeam = MAPACHE_TEAMS.includes(targetUser.team ?? "");
  const syncMode = isMapacheTeam ? "mapache" : "owner";

  const searchName = targetUser.name?.trim() ?? "";
  const searchEmail = targetUser.email?.trim() ?? "";

  if (syncMode === "mapache" && !searchName) {
    return NextResponse.json(
      { ok: false, error: "No se pudo resolver el nombre del usuario" },
      { status: 400 }
    );
  }

  if (syncMode === "owner" && !searchEmail) {
    return NextResponse.json(
      { ok: false, error: "No se pudo resolver el email del usuario" },
      { status: 400 }
    );
  }

  log.info("sync_user_start", {
    targetUserId,
    searchName,
    searchEmail,
    team: targetUser.team,
    syncMode,
    year,
    quarter,
  });

  try {
    const deals = syncMode === "mapache"
      ? await searchDealsByMapacheAssigned(searchName)
      : await searchDealsByOwnerEmails([searchEmail]);

    log.info("sync_user_deals_fetched", {
      syncMode,
      searchIdentifier: syncMode === "mapache" ? searchName : searchEmail,
      totalDeals: deals.length,
    });

    const wonDeals = deals.filter((deal) => {
      const status = String(deal.status ?? "").toLowerCase();
      if (status !== "won") return false;

      const wonAt = deal.wonAt ?? null;
      const wonDate = wonAt ? new Date(wonAt) : null;
      const wonYear = wonDate?.getFullYear() ?? null;
      const wonQuarter = deal.wonQuarter ?? null;
      const wonMonthQuarter = wonDate ? Math.floor(wonDate.getMonth() / 3) + 1 : null;

      return wonYear === year && (wonQuarter === quarter || wonMonthQuarter === quarter);
    });

    log.info("sync_user_won_deals_filtered", {
      totalDeals: deals.length,
      wonDealsCount: wonDeals.length,
      currentYear: year,
      currentQuarter: quarter,
    });

    let progressAmount = 0;
    for (const deal of wonDeals) {
      const feeMensual = Number(deal.feeMensual ?? 0);
      const value = Number(deal.value ?? 0);
      const monthlyFee = Number.isFinite(feeMensual) && feeMensual > 0 ? feeMensual : value;
      progressAmount += Number.isFinite(monthlyFee) ? monthlyFee : 0;
    }

    const goal = await prisma.quarterlyGoal.findUnique({
      where: {
        userId_year_quarter: {
          userId: targetUserId,
          year,
          quarter,
        },
      },
      select: { amount: true },
    });

    const goalAmount = Number(goal?.amount ?? 0);
    const pct = goalAmount > 0 ? Math.round((progressAmount / goalAmount) * 100) : 0;
    const dealsCount = wonDeals.length;
    const lastSyncedAt = now.toISOString();

    await prisma.goalsProgressSnapshot.upsert({
      where: {
        userId_year_quarter: {
          userId: targetUserId,
          year,
          quarter,
        },
      },
      update: {
        goalAmount,
        progressAmount,
        pct,
        dealsCount,
        lastSyncedAt: now,
      },
      create: {
        userId: targetUserId,
        year,
        quarter,
        goalAmount,
        progressAmount,
        pct,
        dealsCount,
        lastSyncedAt: now,
      },
    });

    log.info("sync_user_complete", {
      targetUserId,
      syncMode,
      dealsFound: deals.length,
      wonDealsCount: dealsCount,
      progressAmount,
      goalAmount,
      pct,
    });

    return NextResponse.json({
      ok: true,
      userId: targetUserId,
      year,
      quarter,
      goalAmount,
      progressAmount,
      pct,
      dealsCount,
      lastSyncedAt,
      syncMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("sync_user_failed", { error: message, targetUserId, syncMode, searchName });
    return NextResponse.json(
      { ok: false, error: "Sync failed" },
      { status: 500 }
    );
  }
}
