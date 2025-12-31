import { NextResponse } from "next/server";
import { ProposalStatus } from "@prisma/client";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";
import { buildProposalWhere, parseDate, parseEndOfDay } from "../query";

type SparklinePoint = { date: string; value: number };

type ProposalStatsResponse = {
  kpis: {
    totalCount: number;
    uniqueUsers: number;
    uniqueCompanies: number;
    totalMonthly: number;
    avgPerProposal: number;
    wonCount: number;
    wonAmount: number;
    winRate: number;
    wonAvgTicket: number;
  };
  bySku: Array<{ sku: string; name: string; qty: number }>;
  byCountry: Array<{ country: string; total: number }>;
  byUser: Array<{ email: string | null; total: number }>;
  sparklines: {
    proposals: SparklinePoint[];
    uniqueUsers: SparklinePoint[];
    uniqueCompanies: SparklinePoint[];
    totalMonthly: SparklinePoint[];
    avgPerProposal: SparklinePoint[];
    wonCount: SparklinePoint[];
    wonAmount: SparklinePoint[];
    winRate: SparklinePoint[];
    wonAvgTicket: SparklinePoint[];
  };
  lastUpdated: string;
};

const SPARKLINE_DAYS = 30;

function toISODate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function buildSparklineBuckets(
  start: Date,
  days: number,
  interval: number
) {
  const buckets: Array<{
    start: Date;
    count: number;
    totalAmount: number;
    wonCount: number;
    wonAmount: number;
    users: Set<string>;
    companies: Set<string>;
  }> = [];

  for (let i = 0; i <= days; i += interval) {
    const bucketStart = new Date(start);
    bucketStart.setDate(bucketStart.getDate() + i);
    bucketStart.setHours(0, 0, 0, 0);
    buckets.push({
      start: bucketStart,
      count: 0,
      totalAmount: 0,
      wonCount: 0,
      wonAmount: 0,
      users: new Set<string>(),
      companies: new Set<string>(),
    });
  }

  return buckets;
}

function mergeDateBounds(
  base: Date | undefined,
  extra: Date | undefined,
  preferMax: boolean
): Date | undefined {
  if (!base) return extra;
  if (!extra) return base;
  return preferMax ? (base > extra ? base : extra) : base < extra ? base : extra;
}

export async function GET(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;

  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from")?.trim() ?? null;
  const toParam = url.searchParams.get("to")?.trim() ?? null;
  const userEmail = url.searchParams.get("userEmail")?.trim() ?? null;
  const team = url.searchParams.get("team")?.trim() ?? null;
  const country = url.searchParams.get("country")?.trim() ?? null;

  const where = await buildProposalWhere({
    from: fromParam,
    to: toParam,
    userEmail,
    team,
    country,
  });

  const hasUserEmailFilter = typeof where.userEmail !== "undefined";
  const [aggregateAll, uniqueCompaniesRows, uniqueUsersRows, wonAggregate] = await Promise.all([
    prisma.proposal.aggregate({
      where,
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.proposal.findMany({
      where,
      distinct: ["companyName"],
      select: { companyName: true },
    }),
    hasUserEmailFilter
      ? Promise.resolve([] as Array<{ userEmail: string | null }>)
      : prisma.proposal.findMany({
          where,
          distinct: ["userEmail"],
          select: { userEmail: true },
        }),
    prisma.proposal.aggregate({
      where: { ...where, status: ProposalStatus.WON },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
  ]);

  const totalCount = aggregateAll._count?._all ?? 0;
  const totalMonthly = Number(aggregateAll._sum?.totalAmount ?? 0);
  const uniqueCompanies = uniqueCompaniesRows.length;
  const uniqueUsers = hasUserEmailFilter ? (totalCount > 0 ? 1 : 0) : uniqueUsersRows.length;

  const wonCount = wonAggregate._count?._all ?? 0;
  const wonAmount = Number(wonAggregate._sum?.totalAmount ?? 0);
  const avgPerProposal = totalCount ? totalMonthly / totalCount : 0;
  const winRate = totalCount ? (wonCount / totalCount) * 100 : 0;
  const wonAvgTicket = wonCount ? wonAmount / wonCount : 0;

  const [byCountryRows, byUserRows, bySkuRows] = await Promise.all([
    prisma.proposal.groupBy({
      by: ["country"],
      where,
      _count: { _all: true },
    }),
    prisma.proposal.groupBy({
      by: ["userEmail"],
      where,
      _count: { _all: true },
    }),
    prisma.proposalItem.groupBy({
      by: ["itemId"],
      where: { proposal: where },
      _sum: { quantity: true },
    }),
  ]);

  const byCountry = byCountryRows
    .map((row) => ({ country: row.country, total: row._count._all }))
    .sort((a, b) => b.total - a.total);

  const byUser = byUserRows
    .map((row) => ({ email: row.userEmail ?? null, total: row._count._all }))
    .sort((a, b) => b.total - a.total);

  const itemIds = bySkuRows.map((row) => row.itemId);
  const items = itemIds.length
    ? await prisma.item.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, sku: true, name: true },
      })
    : [];
  const itemMap = new Map(items.map((item) => [item.id, item]));

  const bySku = bySkuRows
    .map((row) => {
      const item = itemMap.get(row.itemId);
      return {
        sku: item?.sku ?? "",
        name: item?.name ?? "",
        qty: row._sum.quantity ?? 0,
      };
    })
    .filter((row) => row.sku)
    .sort((a, b) => b.qty - a.qty);

  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setHours(23, 59, 59, 999);
  const windowStart = new Date(windowEnd);
  windowStart.setDate(windowStart.getDate() - SPARKLINE_DAYS);
  windowStart.setHours(0, 0, 0, 0);

  const fromDate = fromParam ? parseDate(fromParam) : undefined;
  const toDate = toParam ? parseEndOfDay(toParam) : undefined;

  const sparkFrom = mergeDateBounds(fromDate, windowStart, true) ?? windowStart;
  const sparkTo = mergeDateBounds(toDate, windowEnd, false) ?? windowEnd;

  let sparkRows: Array<{
    createdAt: Date;
    totalAmount: unknown;
    status: ProposalStatus;
    userEmail: string | null;
    companyName: string;
  }> = [];

  if (sparkFrom <= sparkTo) {
    const sparkWhere = await buildProposalWhere({
      from: sparkFrom.toISOString(),
      to: sparkTo.toISOString(),
      userEmail,
      team,
      country,
    });

    sparkRows = await prisma.proposal.findMany({
      where: sparkWhere,
      select: {
        createdAt: true,
        totalAmount: true,
        status: true,
        userEmail: true,
        companyName: true,
      },
    });
  }

  const interval = Math.max(1, Math.floor(SPARKLINE_DAYS / 10));
  const buckets = buildSparklineBuckets(windowStart, SPARKLINE_DAYS, interval);
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalSpanMs = SPARKLINE_DAYS * msPerDay;

  for (const proposal of sparkRows) {
    const createdAt = new Date(proposal.createdAt);
    const diffMs = createdAt.getTime() - windowStart.getTime();
    if (diffMs < 0 || diffMs > totalSpanMs) continue;
    const dayIndex = Math.floor(diffMs / msPerDay);
    const bucketIndex = Math.floor(dayIndex / interval);
    const bucket = buckets[bucketIndex];
    if (!bucket) continue;
    const amount = Number(proposal.totalAmount ?? 0);
    bucket.count += 1;
    bucket.totalAmount += amount;
    if (proposal.status === "WON") {
      bucket.wonCount += 1;
      bucket.wonAmount += amount;
    }
    bucket.users.add(proposal.userEmail ?? "__none__");
    bucket.companies.add(proposal.companyName ?? "__none__");
  }

  const proposalsSpark = buckets.map((b) => ({ date: toISODate(b.start), value: b.count }));
  const uniqueUsersSpark = buckets.map((b) => ({ date: toISODate(b.start), value: b.users.size }));
  const uniqueCompaniesSpark = buckets.map((b) => ({
    date: toISODate(b.start),
    value: b.companies.size,
  }));
  const totalMonthlySpark = buckets.map((b) => ({
    date: toISODate(b.start),
    value: b.totalAmount,
  }));
  const avgPerProposalSpark = buckets.map((b) => ({
    date: toISODate(b.start),
    value: b.count ? b.totalAmount / b.count : 0,
  }));
  const wonCountSpark = buckets.map((b) => ({
    date: toISODate(b.start),
    value: b.wonCount,
  }));
  const wonAmountSpark = buckets.map((b) => ({
    date: toISODate(b.start),
    value: b.wonAmount,
  }));
  const winRateSpark = buckets.map((b) => ({
    date: toISODate(b.start),
    value: b.count ? (b.wonCount / b.count) * 100 : 0,
  }));
  const wonAvgTicketSpark = buckets.map((b) => ({
    date: toISODate(b.start),
    value: b.wonCount ? b.wonAmount / b.wonCount : 0,
  }));

  const payload: ProposalStatsResponse = {
    kpis: {
      totalCount,
      uniqueUsers,
      uniqueCompanies,
      totalMonthly,
      avgPerProposal,
      wonCount,
      wonAmount,
      winRate,
      wonAvgTicket,
    },
    bySku,
    byCountry,
    byUser,
    sparklines: {
      proposals: proposalsSpark,
      uniqueUsers: uniqueUsersSpark,
      uniqueCompanies: uniqueCompaniesSpark,
      totalMonthly: totalMonthlySpark,
      avgPerProposal: avgPerProposalSpark,
      wonCount: wonCountSpark,
      wonAmount: wonAmountSpark,
      winRate: winRateSpark,
      wonAvgTicket: wonAvgTicketSpark,
    },
    lastUpdated: new Date().toISOString(),
  };

  const responsePayload = NextResponse.json(payload);
  responsePayload.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=30");
  return responsePayload;
}
