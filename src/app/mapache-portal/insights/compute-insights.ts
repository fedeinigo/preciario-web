import type {
  MapachePortalInsightsMetrics,
  MapachePortalInsightsSegments,
  MapachePortalInsightsUpcomingEntry,
  MapachePortalInsightsWorkloadEntry,
  NeedMetricKey,
} from "../MapachePortalInsights";
import type {
  MapacheTask,
  MapacheTaskStatus,
  MapacheTaskSubstatus,
} from "../types";
import { NEED_METRIC_KEYS, MS_IN_DAY } from "../constants";
import { formatTaskAssigneeLabel, getTaskAssigneeId } from "../utils/task-assignees";

type SegmentAccumulator = {
  key: string;
  label: string;
  type: "assignee" | "team";
  statusTotals: Record<MapacheTaskStatus, number>;
  substatusTotals: Record<MapacheTaskSubstatus, number>;
  needTotals: Record<NeedMetricKey, number>;
  total: number;
};

function createSegmentAccumulator(
  key: string,
  label: string,
  type: "assignee" | "team",
  statusKeys: MapacheTaskStatus[],
): SegmentAccumulator {
  const statusTotals: Record<MapacheTaskStatus, number> = {};
  statusKeys.forEach((status) => {
    statusTotals[status] = 0;
  });

  const substatusTotals: Record<MapacheTaskSubstatus, number> = {
    BACKLOG: 0,
    WAITING_CLIENT: 0,
    BLOCKED: 0,
  };

  const needTotals = NEED_METRIC_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<NeedMetricKey, number>);

  return {
    key,
    label,
    type,
    statusTotals,
    substatusTotals,
    needTotals,
    total: 0,
  };
}

function serializeSegments(entries: SegmentAccumulator[]) {
  return entries
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      type: entry.type,
      total: entry.total,
      statusTotals: { ...entry.statusTotals },
      substatusTotals: { ...entry.substatusTotals },
      needTotals: { ...entry.needTotals },
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.label.localeCompare(b.label, "es", { sensitivity: "base" });
    });
}

export type ComputeInsightsPayload = {
  tasks: MapacheTask[];
  statusKeys: MapacheTaskStatus[];
  assigneeLabelEntries: Array<[string, string]>;
  mapacheTeamMemberIds: string[];
};

export type ComputeInsightsResult = MapachePortalInsightsMetrics;

export function computeInsightsMetrics({
  tasks,
  statusKeys,
  assigneeLabelEntries,
  mapacheTeamMemberIds,
}: ComputeInsightsPayload): ComputeInsightsResult {
  const statusTotals: Record<MapacheTaskStatus, number> = {};
  statusKeys.forEach((status) => {
    statusTotals[status] = 0;
  });

  const substatusTotals: Record<MapacheTaskSubstatus, number> = {
    BACKLOG: 0,
    WAITING_CLIENT: 0,
    BLOCKED: 0,
  };

  const needTotals = NEED_METRIC_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<NeedMetricKey, number>);

  const assigneeLabelMap = new Map(assigneeLabelEntries);
  const mapacheTeamMemberSet = new Set(mapacheTeamMemberIds);

  const assigneeSegments = new Map<string, SegmentAccumulator>();
  const teamSegments = new Map<string, SegmentAccumulator>();

  const workloadMap = new Map<string, MapachePortalInsightsWorkloadEntry>();
  const upcomingMap = new Map<string, { date: Date; value: number }>();

  let dueSoonCount = 0;
  let overdueCount = 0;

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  tasks.forEach((task) => {
    statusTotals[task.status] = (statusTotals[task.status] ?? 0) + 1;
    substatusTotals[task.substatus] = (substatusTotals[task.substatus] ?? 0) + 1;

    const needKey: NeedMetricKey = task.needFromTeam
      ? (NEED_METRIC_KEYS.includes(task.needFromTeam as NeedMetricKey)
          ? (task.needFromTeam as NeedMetricKey)
          : "NONE")
      : "NONE";
    needTotals[needKey] = (needTotals[needKey] ?? 0) + 1;

    const assigneeId = getTaskAssigneeId(task);
    const workloadKey = assigneeId ?? "__unassigned__";
    const teamKey: "team:mapache" | "team:external" | "team:unassigned" =
      assigneeId === null
        ? "team:unassigned"
        : mapacheTeamMemberSet.has(assigneeId)
          ? "team:mapache"
          : "team:external";

    const existingWorkload = workloadMap.get(workloadKey);
    if (existingWorkload) {
      existingWorkload.value += 1;
    } else {
      const label =
        assigneeId === null
          ? null
          : assigneeLabelMap.get(assigneeId) ||
            formatTaskAssigneeLabel(task) ||
            assigneeId;

      workloadMap.set(workloadKey, {
        key: workloadKey,
        label,
        value: 1,
        isUnassigned: assigneeId === null,
        teamKey,
      });
    }

    const assigneeKey = assigneeId ?? "__unassigned__";
    const assigneeLabel =
      assigneeId === null
        ? "__unassigned__"
        : assigneeLabelMap.get(assigneeId) ||
          formatTaskAssigneeLabel(task) ||
          assigneeId;

    const assigneeSegment =
      assigneeSegments.get(assigneeKey) ??
      (() => {
        const segment = createSegmentAccumulator(
          assigneeKey,
          assigneeLabel,
          "assignee",
          statusKeys,
        );
        assigneeSegments.set(assigneeKey, segment);
        return segment;
      })();
    assigneeSegment.total += 1;
    assigneeSegment.statusTotals[task.status] =
      (assigneeSegment.statusTotals[task.status] ?? 0) + 1;
    assigneeSegment.substatusTotals[task.substatus] =
      (assigneeSegment.substatusTotals[task.substatus] ?? 0) + 1;
    assigneeSegment.needTotals[needKey] =
      (assigneeSegment.needTotals[needKey] ?? 0) + 1;

    const teamSegment =
      teamSegments.get(teamKey) ??
      (() => {
        const segment = createSegmentAccumulator(
          teamKey,
          teamKey,
          "team",
          statusKeys,
        );
        teamSegments.set(teamKey, segment);
        return segment;
      })();
    teamSegment.total += 1;
    teamSegment.statusTotals[task.status] =
      (teamSegment.statusTotals[task.status] ?? 0) + 1;
    teamSegment.substatusTotals[task.substatus] =
      (teamSegment.substatusTotals[task.substatus] ?? 0) + 1;
    teamSegment.needTotals[needKey] =
      (teamSegment.needTotals[needKey] ?? 0) + 1;

    if (task.presentationDate) {
      const parsed = new Date(task.presentationDate);
      if (!Number.isNaN(parsed.getTime())) {
        const normalized = new Date(
          parsed.getFullYear(),
          parsed.getMonth(),
          parsed.getDate(),
        );
        const diffDays = Math.round(
          (normalized.getTime() - startOfToday.getTime()) / MS_IN_DAY,
        );
        if (diffDays < 0) {
          overdueCount += 1;
        } else if (diffDays <= 7) {
          dueSoonCount += 1;
        }

        const bucketKey = normalized.toISOString();
        const bucket = upcomingMap.get(bucketKey);
        if (bucket) {
          bucket.value += 1;
        } else {
          upcomingMap.set(bucketKey, { date: normalized, value: 1 });
        }
      }
    }
  });

  const workload = Array.from(workloadMap.values())
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      const labelA = a.label ?? "";
      const labelB = b.label ?? "";
      return labelA.localeCompare(labelB, "es", { sensitivity: "base" });
    })
    .slice(0, 12);

  const upcomingDue: MapachePortalInsightsUpcomingEntry[] = Array.from(
    upcomingMap.entries(),
  )
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, { date, value }]) => ({
      key,
      date: date.toISOString(),
      value,
    }))
    .slice(0, 12);

  const segments: MapachePortalInsightsSegments = {
    assignee: serializeSegments(Array.from(assigneeSegments.values())),
    team: serializeSegments(Array.from(teamSegments.values())),
  };

  return {
    total: tasks.length,
    dueSoonCount,
    overdueCount,
    statusTotals,
    substatusTotals,
    needTotals,
    workload,
    upcomingDue,
    segments,
  };
}
