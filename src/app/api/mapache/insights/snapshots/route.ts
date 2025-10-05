// src/app/api/mapache/insights/snapshots/route.ts
import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

import { ensureMapacheAccess } from "../../tasks/access";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getWeekKey(date: Date) {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const firstDay = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const pastDays = Math.floor(
    (utc.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000),
  );
  const weekNumber = Math.floor((pastDays + firstDay.getUTCDay() + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function parseSnapshotPayload(value: unknown) {
  if (!isRecord(value)) return null;

  const total = toNumber(value.total);
  const dueSoonCount = toNumber(value.dueSoonCount);
  const overdueCount = toNumber(value.overdueCount);

  if (total === null || dueSoonCount === null || overdueCount === null) {
    return null;
  }

  const statusTotals: Prisma.JsonObject = isRecord(value.statusTotals)
    ? (value.statusTotals as Prisma.JsonObject)
    : {};
  const substatusTotals: Prisma.JsonObject = isRecord(value.substatusTotals)
    ? (value.substatusTotals as Prisma.JsonObject)
    : {};
  const needTotals: Prisma.JsonObject = isRecord(value.needTotals)
    ? (value.needTotals as Prisma.JsonObject)
    : {};

  const capturedAtRaw =
    typeof value.capturedAt === "string"
      ? value.capturedAt
      : typeof value.timestamp === "string"
        ? value.timestamp
        : new Date().toISOString();

  const capturedAt = new Date(capturedAtRaw);
  if (Number.isNaN(capturedAt.getTime())) {
    return null;
  }
  const scope =
    typeof value.scope === "string" && value.scope.trim()
      ? value.scope.trim()
      : "all";

  const bucket =
    typeof value.bucket === "string" && value.bucket.trim()
      ? value.bucket.trim()
      : getWeekKey(capturedAt);

  return {
    bucket,
    scope,
    capturedAt,
    total,
    dueSoonCount,
    overdueCount,
    statusTotals,
    substatusTotals,
    needTotals,
  } as const;
}

export async function GET() {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;

  const snapshots = await prisma.mapacheInsightsSnapshot.findMany({
    orderBy: { capturedAt: "asc" },
    take: 64,
  });

  return NextResponse.json(
    snapshots.map((snapshot) => ({
      bucket: snapshot.bucket,
      scope: snapshot.scope,
      capturedAt: snapshot.capturedAt.toISOString(),
      total: snapshot.total,
      dueSoonCount: snapshot.dueSoonCount,
      overdueCount: snapshot.overdueCount,
      statusTotals: snapshot.statusTotals,
      substatusTotals: snapshot.substatusTotals,
      needTotals: snapshot.needTotals,
    })),
  );
}

export async function POST(request: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseSnapshotPayload(payload);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid snapshot payload" }, { status: 400 });
  }

  await prisma.mapacheInsightsSnapshot.upsert({
    where: { bucket: parsed.bucket },
    update: {
      scope: parsed.scope,
      capturedAt: parsed.capturedAt,
      total: parsed.total,
      dueSoonCount: parsed.dueSoonCount,
      overdueCount: parsed.overdueCount,
      statusTotals: parsed.statusTotals,
      substatusTotals: parsed.substatusTotals,
      needTotals: parsed.needTotals,
    },
    create: {
      bucket: parsed.bucket,
      scope: parsed.scope,
      capturedAt: parsed.capturedAt,
      total: parsed.total,
      dueSoonCount: parsed.dueSoonCount,
      overdueCount: parsed.overdueCount,
      statusTotals: parsed.statusTotals,
      substatusTotals: parsed.substatusTotals,
      needTotals: parsed.needTotals,
    },
  });

  return NextResponse.json({ ok: true });
}
