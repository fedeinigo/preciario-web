import prisma from "@/lib/prisma";

type StatusBreakdownEntry = {
  statusId: string | null;
  statusKey: string | null;
  label: string | null;
  count: number;
};

export type TaskSummary = {
  total: number;
  overdue: number;
  dueSoon: number;
  lastUpdatedAt: string | null;
  statusBreakdown: StatusBreakdownEntry[];
  error?: string | null;
};

export async function loadTaskSummary(options?: {
  dueSoonInDays?: number;
}): Promise<TaskSummary> {
  const dueSoonInDays = options?.dueSoonInDays ?? 7;
  const now = new Date();
  const dueSoonLimit = new Date(
    now.getTime() + dueSoonInDays * 24 * 60 * 60 * 1000,
  );

  try {
    const [total, overdue, dueSoon, statusGroups, statuses, latestUpdate] =
      await Promise.all([
        prisma.mapacheTask.count(),
        prisma.mapacheTask.count({
          where: {
            presentationDate: {
              lt: now,
            },
          },
        }),
        prisma.mapacheTask.count({
          where: {
            presentationDate: {
              gte: now,
              lte: dueSoonLimit,
            },
          },
        }),
        prisma.mapacheTask.groupBy({
          by: ["statusId"],
          _count: {
            _all: true,
          },
        }),
        prisma.mapacheStatus.findMany({
          select: {
            id: true,
            key: true,
            label: true,
          },
        }),
        prisma.mapacheTask.findFirst({
          orderBy: { updatedAt: "desc" },
          select: { updatedAt: true },
        }),
      ]);

    const statusMap = new Map(
      statuses.map((status) => [status.id, { key: status.key, label: status.label }]),
    );

    const statusBreakdown: StatusBreakdownEntry[] = statusGroups.map((group) => {
      const match =
        group.statusId && statusMap.has(group.statusId)
          ? statusMap.get(group.statusId)!
          : null;
      return {
        statusId: group.statusId ?? null,
        statusKey: match?.key ?? null,
        label: match?.label ?? null,
        count: group._count._all,
      };
    });

    statusBreakdown.sort((a, b) => b.count - a.count);

    return {
      total,
      overdue,
      dueSoon,
      lastUpdatedAt: latestUpdate?.updatedAt
        ? latestUpdate.updatedAt.toISOString()
        : null,
      statusBreakdown,
      error: null,
    };
  } catch (error) {
    console.error("[MapachePortal] Failed to load task summary", error);

    return {
      total: 0,
      overdue: 0,
      dueSoon: 0,
      lastUpdatedAt: null,
      statusBreakdown: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export type InsightsSnapshotSummary = {
  bucket: string;
  scope: string;
  capturedAt: string;
  total: number;
  dueSoonCount: number;
  overdueCount: number;
};

export type InsightsSummary = {
  latestAll: InsightsSnapshotSummary | null;
  latestFiltered: InsightsSnapshotSummary | null;
};

function toInsightsSummary(
  snapshot:
    | {
        bucket: string;
        scope: string;
        capturedAt: Date;
        total: number;
        dueSoonCount: number;
        overdueCount: number;
      }
    | null,
): InsightsSnapshotSummary | null {
  if (!snapshot) return null;
  return {
    bucket: snapshot.bucket,
    scope: snapshot.scope,
    capturedAt: snapshot.capturedAt.toISOString(),
    total: snapshot.total,
    dueSoonCount: snapshot.dueSoonCount,
    overdueCount: snapshot.overdueCount,
  };
}

export async function loadInsightsSummary(): Promise<InsightsSummary> {
  const [latestAll, latestFiltered] = await Promise.all([
    prisma.mapacheInsightsSnapshot.findFirst({
      where: { scope: "all" },
      orderBy: { capturedAt: "desc" },
    }),
    prisma.mapacheInsightsSnapshot.findFirst({
      where: { scope: "filtered" },
      orderBy: { capturedAt: "desc" },
    }),
  ]);

  return {
    latestAll: toInsightsSummary(latestAll),
    latestFiltered: toInsightsSummary(latestFiltered),
  };
}
