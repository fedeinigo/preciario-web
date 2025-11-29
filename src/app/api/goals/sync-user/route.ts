import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { searchDealsByMapacheAssignedMany, searchDealsByOwnerEmails } from "@/lib/pipedrive";
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

function normalizeForComparison(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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

  log.info("sync_user_start", {
    targetUserId,
    team: targetUser.team,
    syncMode,
    year,
    quarter,
  });

  try {
    let deals: Array<{
      status?: string;
      wonAt?: string | null;
      wonQuarter?: number | null;
      feeMensual?: number | null;
      value?: number | null;
      mapacheAssigned?: string | null;
      ownerEmail?: string | null;
      id?: string | number;
      title?: string;
      dealUrl?: string | null;
    }> = [];

    if (syncMode === "mapache") {
      const searchName = targetUser.name ?? "";
      log.info("sync_user_mapache_search", { searchName, team: targetUser.team });
      if (searchName) {
        const rawDeals = await searchDealsByMapacheAssignedMany([searchName]);
        deals = rawDeals as typeof deals;
        log.info("sync_user_mapache_deals_found", { 
          dealsCount: deals.length,
          sampleDeals: deals.slice(0, 3).map(d => ({ 
            id: d.id, 
            title: d.title, 
            status: d.status, 
            mapacheAssigned: d.mapacheAssigned,
            wonAt: d.wonAt,
            wonQuarter: d.wonQuarter,
            feeMensual: d.feeMensual,
            value: d.value
          }))
        });
      }
    } else {
      const searchEmail = targetUser.email ?? "";
      if (searchEmail) {
        const rawDeals = await searchDealsByOwnerEmails([searchEmail]);
        deals = rawDeals as typeof deals;
      }
    }

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
      sampleWonDeals: wonDeals.slice(0, 3).map(d => ({
        id: d.id,
        title: d.title,
        wonAt: d.wonAt,
        wonQuarter: d.wonQuarter,
        mapacheAssigned: d.mapacheAssigned,
        feeMensual: d.feeMensual,
        value: d.value
      }))
    });

    const normalizedTargetName = normalizeForComparison(targetUser.name ?? "");
    const normalizedTargetEmail = (targetUser.email ?? "").toLowerCase().trim();

    const matchingDeals = wonDeals.filter((deal) => {
      if (syncMode === "mapache") {
        const dealMapache = normalizeForComparison(String(deal.mapacheAssigned ?? ""));
        const matches = dealMapache === normalizedTargetName;
        if (!matches && wonDeals.length > 0) {
          log.warn("sync_user_name_mismatch", { 
            dealMapache, 
            normalizedTargetName,
            dealId: deal.id 
          });
        }
        return matches;
      } else {
        const dealEmail = (deal.ownerEmail ?? "").toLowerCase().trim();
        return dealEmail === normalizedTargetEmail;
      }
    });

    log.info("sync_user_matching_deals", {
      wonDealsCount: wonDeals.length,
      matchingDealsCount: matchingDeals.length,
      normalizedTargetName,
      sampleMatchingDeals: matchingDeals.slice(0, 3).map(d => ({
        id: d.id,
        title: d.title,
        mapacheAssigned: d.mapacheAssigned,
        feeMensual: d.feeMensual,
        value: d.value
      }))
    });

    let progressAmount = 0;
    for (const deal of matchingDeals) {
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
    const dealsCount = matchingDeals.length;
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
      wonDeals: wonDeals.length,
      matchingDeals: dealsCount,
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
    log.error("sync_user_failed", { error: message, targetUserId });
    return NextResponse.json(
      { ok: false, error: "Sync failed" },
      { status: 500 }
    );
  }
}
