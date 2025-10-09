"use client";

import * as React from "react";

import { useTranslations } from "@/app/LanguageProvider";
import {
  AreaTrendChart,
  ChartCard,
  DonutChart,
  StackedBarChart,
  type AreaDatum,
  type StackedBarChartDatum,
} from "./components/analytics";

import type {
  MapacheNeedFromTeam,
  MapacheStatusDetails,
  MapacheTaskStatus,
  MapacheTaskSubstatus,
} from "./types";
import {
  MAPACHE_NEEDS_FROM_TEAM,
  MAPACHE_TASK_SUBSTATUSES,
} from "./types";

export type NeedMetricKey = MapacheNeedFromTeam | "NONE";

export type MapachePortalInsightsWorkloadEntry = {
  key: string;
  label: string | null;
  value: number;
  isUnassigned: boolean;
  teamKey: "team:mapache" | "team:external" | "team:unassigned";
};

export type MapachePortalInsightsUpcomingEntry = {
  key: string;
  date: string;
  value: number;
};

export type MapachePortalInsightsSegment = {
  key: string;
  label: string;
  type: "assignee" | "team";
  total: number;
  statusTotals: Record<MapacheTaskStatus, number>;
  substatusTotals: Record<MapacheTaskSubstatus, number>;
  needTotals: Record<NeedMetricKey, number>;
};

export type MapachePortalInsightsSegments = {
  assignee: MapachePortalInsightsSegment[];
  team: MapachePortalInsightsSegment[];
};

export type MapachePortalInsightsMetrics = {
  total: number;
  dueSoonCount: number;
  overdueCount: number;
  statusTotals: Record<MapacheTaskStatus, number>;
  substatusTotals: Record<MapacheTaskSubstatus, number>;
  needTotals: Record<NeedMetricKey, number>;
  workload: MapachePortalInsightsWorkloadEntry[];
  upcomingDue: MapachePortalInsightsUpcomingEntry[];
  segments: MapachePortalInsightsSegments;
};

export type MapachePortalInsightsScope = "filtered" | "all";

type MapachePortalInsightsProps = {
  scope: MapachePortalInsightsScope;
  onScopeChange: (scope: MapachePortalInsightsScope) => void;
  metricsByScope: Record<
    MapachePortalInsightsScope,
    MapachePortalInsightsMetrics
  >;
  statuses: MapacheStatusDetails[];
  formatStatusLabel: (status: MapacheTaskStatus) => string;
};

type TrendVariant = "positive" | "negative" | "neutral" | "muted" | "info";

type TrendDescriptor = {
  text: string;
  variant: TrendVariant;
};

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

type TrendMode = "full" | "compact";

type InsightsSnapshot = {
  bucket: string;
  capturedAt: string;
  total: number;
  dueSoonCount: number;
  overdueCount: number;
  statusTotals: Record<MapacheTaskStatus, number>;
  substatusTotals: Record<MapacheTaskSubstatus, number>;
  needTotals: Record<NeedMetricKey, number>;
};

const STORAGE_KEY = "mapache_portal_insights_snapshots";
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const SUBSTATUS_ORDER: MapacheTaskSubstatus[] = [...MAPACHE_TASK_SUBSTATUSES];
const NEED_KEYS: NeedMetricKey[] = [...MAPACHE_NEEDS_FROM_TEAM, "NONE"];

const SUBSTATUS_LABEL_KEYS: Record<
  MapacheTaskSubstatus,
  "backlog" | "waiting_client" | "blocked"
> = {
  BACKLOG: "backlog",
  WAITING_CLIENT: "waiting_client",
  BLOCKED: "blocked",
};

const TEAM_SEGMENT_LABEL_KEYS: Record<
  "team:mapache" | "team:external" | "team:unassigned",
  "segments.team.mapache" | "segments.team.external" | "segments.team.unassigned"
> = {
  "team:mapache": "segments.team.mapache",
  "team:external": "segments.team.external",
  "team:unassigned": "segments.team.unassigned",
};

const SEGMENT_COLOR_SCALE = [
  "#38bdf8",
  "#a855f7",
  "#f97316",
  "#22c55e",
  "#ec4899",
  "#6366f1",
];

const NEED_COLOR_SCALE = [
  "#38bdf8",
  "#f97316",
  "#a855f7",
  "#22d3ee",
  "#facc15",
  "#94a3b8",
];

const SNAPSHOT_LIMIT = 32;

type TimeRangeValue = "6w" | "12w" | "24w" | "all";

const TIME_RANGE_WEEKS: Record<TimeRangeValue, number | null> = {
  "6w": 6,
  "12w": 12,
  "24w": 24,
  all: null,
};

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

function parseSnapshot(value: unknown): InsightsSnapshot | null {
  if (!isRecord(value)) return null;

  const total = toNumber(value.total);
  const dueSoonCount = toNumber(value.dueSoonCount);
  const overdueCount = toNumber(value.overdueCount);

  if (total === null || dueSoonCount === null || overdueCount === null) {
    return null;
  }

  const statusTotals: Record<MapacheTaskStatus, number> = {};
  if (isRecord(value.statusTotals)) {
    Object.entries(value.statusTotals).forEach(([key, raw]) => {
      const num = toNumber(raw);
      if (num !== null) {
        statusTotals[key as MapacheTaskStatus] = num;
      }
    });
  }

  const substatusTotals: Record<MapacheTaskSubstatus, number> = {
    BACKLOG: 0,
    WAITING_CLIENT: 0,
    BLOCKED: 0,
  };
  if (isRecord(value.substatusTotals)) {
    Object.entries(value.substatusTotals).forEach(([key, raw]) => {
      const num = toNumber(raw);
      if (num !== null && SUBSTATUS_ORDER.includes(key as MapacheTaskSubstatus)) {
        substatusTotals[key as MapacheTaskSubstatus] = num;
      }
    });
  }

  const needTotals = NEED_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<NeedMetricKey, number>);
  if (isRecord(value.needTotals)) {
    Object.entries(value.needTotals).forEach(([key, raw]) => {
      const num = toNumber(raw);
      if (num !== null && NEED_KEYS.includes(key as NeedMetricKey)) {
        needTotals[key as NeedMetricKey] = num;
      }
    });
  }

  const capturedAtRaw =
    typeof value.capturedAt === "string"
      ? value.capturedAt
      : typeof value.timestamp === "string"
        ? value.timestamp
        : new Date().toISOString();

  const bucket =
    typeof value.bucket === "string" && value.bucket
      ? value.bucket
      : getWeekKey(new Date(capturedAtRaw));

  return {
    bucket,
    capturedAt: capturedAtRaw,
    total,
    dueSoonCount,
    overdueCount,
    statusTotals,
    substatusTotals,
    needTotals,
  };
}

function readLocalSnapshots(): Map<string, InsightsSnapshot> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return new Map();
    const entries: [string, InsightsSnapshot][] = [];
    Object.entries(parsed).forEach(([key, value]) => {
      const snapshot = parseSnapshot(value);
      if (snapshot) {
        entries.push([key, snapshot]);
      }
    });
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function writeLocalSnapshots(map: Map<string, InsightsSnapshot>) {
  if (typeof window === "undefined") return;
  const entries = Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-SNAPSHOT_LIMIT);
  const record = Object.fromEntries(entries.map(([key, snapshot]) => [key, snapshot]));
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage failures (quota, privacy modes).
  }
}

const TREND_VARIANT_CLASSNAMES: Record<TrendVariant, string> = {
  positive:
    "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.35)]",
  negative:
    "border-rose-400/40 bg-rose-500/15 text-rose-100 shadow-[inset_0_1px_0_0_rgba(244,114,182,0.25)]",
  neutral:
    "border-white/20 bg-white/10 text-white/80",
  muted: "border-white/10 bg-white/5 text-white/60",
  info: "border-sky-400/40 bg-sky-500/10 text-sky-100",
};

function getWeekKey(date: Date) {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = utc.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  utc.setUTCDate(utc.getUTCDate() - diff);
  return utc.toISOString().split("T")[0];
}

function createTrendDescriptor(
  current: number,
  previous: number | undefined,
  {
    canCompare,
    showWhenFiltered = true,
    mode,
    translate,
  }: {
    canCompare: boolean;
    showWhenFiltered?: boolean;
    mode: TrendMode;
    translate: TranslateFn;
  },
): TrendDescriptor | null {
  if (!canCompare) {
    if (!showWhenFiltered) return null;
    return {
      text: translate(
        mode === "compact" ? "trendShort.filtered" : "trend.filtered",
      ),
      variant: "info",
    };
  }

  if (previous === undefined) {
    return {
      text: translate(
        mode === "compact" ? "trendShort.unavailable" : "trend.unavailable",
      ),
      variant: "muted",
    };
  }

  const delta = current - previous;
  const absolute = Math.abs(delta);

  if (delta > 0) {
    return {
      text: translate(
        mode === "compact" ? "trendShort.positive" : "trend.positive",
        { value: absolute },
      ),
      variant: "positive",
    };
  }

  if (delta < 0) {
    return {
      text: translate(
        mode === "compact" ? "trendShort.negative" : "trend.negative",
        { value: absolute },
      ),
      variant: "negative",
    };
  }

  return {
    text: translate(mode === "compact" ? "trendShort.equal" : "trend.equal"),
    variant: "neutral",
  };
}

type TrendBadgeProps = {
  descriptor: TrendDescriptor;
  size?: "sm" | "md";
};

function TrendBadge({ descriptor, size = "md" }: TrendBadgeProps) {
  const sizeClasses =
    size === "sm"
      ? "px-1.5 py-0.5 text-[10px]"
      : "px-2 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${sizeClasses} font-medium uppercase tracking-wide ${TREND_VARIANT_CLASSNAMES[descriptor.variant]}`}
    >
      {descriptor.text}
    </span>
  );
}

type SummaryCardProps = {
  title: string;
  value: number;
  trend: TrendDescriptor;
  formatNumber: (value: number) => string;
};

function SummaryCard({ title, value, trend, formatNumber }: SummaryCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.35)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-white/60">
        {title}
      </div>
      <div className="text-2xl font-semibold text-white">
        {formatNumber(value)}
      </div>
      <TrendBadge descriptor={trend} />
    </div>
  );
}

export default function MapachePortalInsights({
  scope,
  onScopeChange,
  metricsByScope,
  statuses,
  formatStatusLabel,
}: MapachePortalInsightsProps) {
  const insightsT = useTranslations("mapachePortal.insights");
  const substatusesT = useTranslations("mapachePortal.substatuses");
  const needT = useTranslations("mapachePortal.enums.needFromTeam");
  const statusBadgeT = useTranslations("mapachePortal.statusBadges");

  const metrics = metricsByScope[scope];
  const numberFormatter = React.useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }),
    [],
  );
  const formatNumber = React.useCallback(
    (value: number) => numberFormatter.format(value),
    [numberFormatter],
  );
  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }),
    [],
  );


  const [historicalSnapshots, setHistoricalSnapshots] =
    React.useState<InsightsSnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = React.useState(true);
  const snapshotPersistRef = React.useRef<{
    bucket: string | null;
    hash: string | null;
  }>({ bucket: null, hash: null });
  const [segmentMode, setSegmentMode] =
    React.useState<"none" | "team" | "assignee">("none");
  const [segmentFocus, setSegmentFocus] = React.useState<string>("all");
  const [timeRange, setTimeRange] = React.useState<TimeRangeValue>("6w");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    async function loadSnapshots() {
      setSnapshotsLoading(true);
      const localMap = readLocalSnapshots();
      const merged = new Map(localMap);

      try {
        const response = await fetch("/api/mapache/insights/snapshots", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (response.ok) {
          const payload = (await response.json()) as unknown;
          if (Array.isArray(payload)) {
            payload.forEach((entry) => {
              const snapshot = parseSnapshot(entry);
              if (snapshot) {
                merged.set(snapshot.bucket, snapshot);
              }
            });
          }
        }
      } catch (error) {
        console.error(error);
      }

      const ordered = Array.from(merged.values()).sort(
        (a, b) =>
          new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
      );
      const sliced = ordered.slice(-SNAPSHOT_LIMIT);

      if (!cancelled) {
        setHistoricalSnapshots(sliced);
        setSnapshotsLoading(false);
      }

      if (!cancelled) {
        writeLocalSnapshots(new Map(sliced.map((item) => [item.bucket, item])));
      }
    }

    loadSnapshots();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const now = new Date();
    const bucket = getWeekKey(now);
    const snapshot: InsightsSnapshot = {
      bucket,
      capturedAt: now.toISOString(),
      total: metricsByScope.all.total,
      dueSoonCount: metricsByScope.all.dueSoonCount,
      overdueCount: metricsByScope.all.overdueCount,
      statusTotals: { ...metricsByScope.all.statusTotals },
      substatusTotals: { ...metricsByScope.all.substatusTotals },
      needTotals: { ...metricsByScope.all.needTotals },
    };
    const hash = JSON.stringify(snapshot);

    if (
      snapshotPersistRef.current.bucket === bucket &&
      snapshotPersistRef.current.hash === hash
    ) {
      return;
    }

    snapshotPersistRef.current = { bucket, hash };

    setHistoricalSnapshots((previous) => {
      const map = new Map<string, InsightsSnapshot>();
      previous.forEach((entry) => {
        if (entry.bucket !== bucket) {
          map.set(entry.bucket, entry);
        }
      });
      map.set(bucket, snapshot);
      const ordered = Array.from(map.values()).sort(
        (a, b) =>
          new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
      );
      const sliced = ordered.slice(-SNAPSHOT_LIMIT);
      writeLocalSnapshots(new Map(sliced.map((item) => [item.bucket, item])));
      return sliced;
    });

    void (async () => {
      try {
        await fetch("/api/mapache/insights/snapshots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshot),
        });
      } catch (error) {
        console.error(error);
      }
    })();
  }, [metricsByScope.all]);

  const snapshotMap = React.useMemo(() => {
    const map = new Map<string, InsightsSnapshot>();
    historicalSnapshots.forEach((entry) => {
      map.set(entry.bucket, entry);
    });
    return map;
  }, [historicalSnapshots]);

  const previousSnapshot = React.useMemo(() => {
    const target = new Date(Date.now() - WEEK_IN_MS);
    const key = getWeekKey(target);
    return snapshotMap.get(key) ?? null;
  }, [snapshotMap]);

  const canCompare = scope === "all";

  const totalTrend =
    createTrendDescriptor(metrics.total, previousSnapshot?.total, {
      canCompare,
      showWhenFiltered: true,
      mode: "full",
      translate: insightsT,
    }) ?? {
      text: insightsT("trend.filtered"),
      variant: "info",
    };

  const dueSoonTrend =
    createTrendDescriptor(metrics.dueSoonCount, previousSnapshot?.dueSoonCount, {
      canCompare,
      showWhenFiltered: true,
      mode: "full",
      translate: insightsT,
    }) ?? totalTrend;

  const overdueTrend =
    createTrendDescriptor(
      metrics.overdueCount,
      previousSnapshot?.overdueCount,
      {
        canCompare,
        showWhenFiltered: true,
        mode: "full",
        translate: insightsT,
      },
    ) ?? totalTrend;

  const statusOrder = React.useMemo(() => {
    const ordered: MapacheTaskStatus[] = [];
    const seen = new Set<string>();

    const append = (status: string | undefined) => {
      if (!status) return;
      const normalized = status.trim().toUpperCase();
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      ordered.push(normalized);
    };

    statuses.forEach((status) => append(status.key));

    const appendTotals = (totals: Record<MapacheTaskStatus, number>) => {
      Object.keys(totals).forEach((status) => append(status));
    };

    appendTotals(metricsByScope.filtered.statusTotals);
    appendTotals(metricsByScope.all.statusTotals);
    if (previousSnapshot) {
      appendTotals(previousSnapshot.statusTotals);
    }
    historicalSnapshots.forEach((snapshot) => {
      appendTotals(snapshot.statusTotals);
    });

    return ordered;
  }, [
    historicalSnapshots,
    metricsByScope.all.statusTotals,
    metricsByScope.filtered.statusTotals,
    previousSnapshot,
    statuses,
  ]);

  const formatTeamLabel = React.useCallback(
    (teamKey: "team:mapache" | "team:external" | "team:unassigned") => {
      const translationKey = TEAM_SEGMENT_LABEL_KEYS[teamKey];
      return translationKey ? insightsT(translationKey) : teamKey;
    },
    [insightsT],
  );

  const formatSegmentLabel = React.useCallback(
    (segment: MapachePortalInsightsSegment) => {
      if (segment.type === "team") {
        return formatTeamLabel(
          segment.key as "team:mapache" | "team:external" | "team:unassigned",
        );
      }
      if (segment.type === "assignee") {
        if (segment.key === "__unassigned__") {
          return statusBadgeT("unassigned");
        }
        return segment.label;
      }
      return segment.label;
    },
    [formatTeamLabel, statusBadgeT],
  );

  const segmentationModeOptions = React.useMemo(
    () => [
      { value: "none" as const, label: insightsT("segments.mode.none") },
      { value: "team" as const, label: insightsT("segments.mode.team") },
      { value: "assignee" as const, label: insightsT("segments.mode.assignee") },
    ],
    [insightsT],
  );

  const timeRangeOptions = React.useMemo(
    () => [
      { value: "6w" as TimeRangeValue, label: insightsT("timeRange.lastSixWeeks") },
      {
        value: "12w" as TimeRangeValue,
        label: insightsT("timeRange.lastTwelveWeeks"),
      },
      {
        value: "24w" as TimeRangeValue,
        label: insightsT("timeRange.lastTwentyFourWeeks"),
      },
      { value: "all" as TimeRangeValue, label: insightsT("timeRange.all") },
    ],
    [insightsT],
  );

  const segmentSource = React.useMemo(() => {
    if (segmentMode === "team") return metrics.segments.team;
    if (segmentMode === "assignee") return metrics.segments.assignee;
    return [];
  }, [
    metrics.segments.assignee,
    metrics.segments.team,
    segmentMode,
  ]);

  const filteredSegments = React.useMemo(
    () => segmentSource.filter((segment) => segment.total > 0),
    [segmentSource],
  );

  React.useEffect(() => {
    setSegmentFocus("all");
  }, [segmentMode]);

  React.useEffect(() => {
    if (segmentMode === "none") return;
    if (segmentFocus === "all") return;
    if (!filteredSegments.some((segment) => segment.key === segmentFocus)) {
      setSegmentFocus("all");
    }
  }, [filteredSegments, segmentFocus, segmentMode]);

  const activeSegment = React.useMemo(() => {
    if (segmentMode === "none" || segmentFocus === "all") return null;
    return filteredSegments.find((segment) => segment.key === segmentFocus) ?? null;
  }, [filteredSegments, segmentFocus, segmentMode]);

  const stackedSegments = React.useMemo(() => {
    if (segmentMode === "team") {
      if (segmentFocus === "all") return filteredSegments;
      return activeSegment ? [activeSegment] : [];
    }
    if (segmentMode === "assignee") {
      if (segmentFocus === "all") {
        return filteredSegments.slice(0, 4);
      }
      return activeSegment ? [activeSegment] : [];
    }
    return [];
  }, [activeSegment, filteredSegments, segmentFocus, segmentMode]);

  const hasOthersSegment =
    segmentMode === "assignee" &&
    segmentFocus === "all" &&
    filteredSegments.length > stackedSegments.length;

  const segmentFocusOptions = React.useMemo(() => {
    if (segmentMode === "none") return [];
    const options = filteredSegments.map((segment) => ({
      value: segment.key,
      label: formatSegmentLabel(segment),
    }));
    return [
      { value: "all", label: insightsT("segments.focus.all") },
      ...options,
    ];
  }, [filteredSegments, formatSegmentLabel, insightsT, segmentMode]);

  const statusChartData = React.useMemo<StackedBarChartDatum[]>(() => {
    return statusOrder.map((status) => {
      const label = formatStatusLabel(status);
      const total = metrics.statusTotals[status] ?? 0;

      if (segmentMode === "none") {
        return {
          key: status,
          label,
          total,
          segments: [
            {
              key: status,
              label,
              value: total,
              color: "rgb(var(--primary))",
            },
          ],
        };
      }

      if (segmentFocus === "all") {
        const segments = stackedSegments.map((segment, index) => ({
          key: segment.key,
          label: formatSegmentLabel(segment),
          value: segment.statusTotals[status] ?? 0,
          color: SEGMENT_COLOR_SCALE[index % SEGMENT_COLOR_SCALE.length],
        }));
        let combined = segments;
        if (hasOthersSegment) {
          const selected = new Set(stackedSegments.map((segment) => segment.key));
          const othersValue = filteredSegments.reduce((sum, segment) => {
            if (selected.has(segment.key)) return sum;
            return sum + (segment.statusTotals[status] ?? 0);
          }, 0);
          if (othersValue > 0) {
            combined = [
              ...segments,
              {
                key: "__others__",
                label: insightsT("segments.others"),
                value: othersValue,
                color: "rgba(148,163,184,0.6)",
              },
            ];
          }
        }
        const combinedTotal = combined.reduce(
          (sum, entry) => sum + entry.value,
          0,
        );
        return {
          key: status,
          label,
          total: combinedTotal,
          segments: combined,
        };
      }

      const focus = activeSegment;
      const value = focus
        ? focus.statusTotals[status] ?? 0
        : metrics.statusTotals[status] ?? 0;
      return {
        key: status,
        label,
        total: value,
        segments: [
          {
            key: focus?.key ?? status,
            label: focus ? formatSegmentLabel(focus) : label,
            value,
            color: SEGMENT_COLOR_SCALE[0],
          },
        ],
      };
    });
  }, [
    activeSegment,
    filteredSegments,
    formatSegmentLabel,
    formatStatusLabel,
    hasOthersSegment,
    insightsT,
    metrics.statusTotals,
    segmentFocus,
    segmentMode,
    stackedSegments,
    statusOrder,
  ]);

  const substatusChartData = React.useMemo<StackedBarChartDatum[]>(() => {
    return SUBSTATUS_ORDER.map((substatus) => {
      const label = substatusesT(SUBSTATUS_LABEL_KEYS[substatus]);
      const total = metrics.substatusTotals[substatus] ?? 0;

      if (segmentMode === "none") {
        return {
          key: substatus,
          label,
          total,
          segments: [
            {
              key: substatus,
              label,
              value: total,
              color: "#22c55e",
            },
          ],
        };
      }

      if (segmentFocus === "all") {
        const segments = stackedSegments.map((segment, index) => ({
          key: segment.key,
          label: formatSegmentLabel(segment),
          value: segment.substatusTotals[substatus] ?? 0,
          color: SEGMENT_COLOR_SCALE[index % SEGMENT_COLOR_SCALE.length],
        }));
        let combined = segments;
        if (hasOthersSegment) {
          const selected = new Set(stackedSegments.map((segment) => segment.key));
          const othersValue = filteredSegments.reduce((sum, segment) => {
            if (selected.has(segment.key)) return sum;
            return sum + (segment.substatusTotals[substatus] ?? 0);
          }, 0);
          if (othersValue > 0) {
            combined = [
              ...segments,
              {
                key: "__others__",
                label: insightsT("segments.others"),
                value: othersValue,
                color: "rgba(148,163,184,0.6)",
              },
            ];
          }
        }
        const combinedTotal = combined.reduce(
          (sum, entry) => sum + entry.value,
          0,
        );
        return {
          key: substatus,
          label,
          total: combinedTotal,
          segments: combined,
        };
      }

      const focus = activeSegment;
      const value = focus
        ? focus.substatusTotals[substatus] ?? 0
        : metrics.substatusTotals[substatus] ?? 0;
      return {
        key: substatus,
        label,
        total: value,
        segments: [
          {
            key: focus?.key ?? substatus,
            label: focus ? formatSegmentLabel(focus) : label,
            value,
            color: SEGMENT_COLOR_SCALE[1],
          },
        ],
      };
    });
  }, [
    activeSegment,
    filteredSegments,
    formatSegmentLabel,
    hasOthersSegment,
    insightsT,
    metrics.substatusTotals,
    segmentFocus,
    segmentMode,
    stackedSegments,
    substatusesT,
  ]);

  const needTotalsSource = React.useMemo(() => {
    if (segmentMode !== "none" && activeSegment) {
      return activeSegment.needTotals;
    }
    return metrics.needTotals;
  }, [activeSegment, metrics.needTotals, segmentMode]);

  const needChartData = React.useMemo(
    () =>
      NEED_KEYS.map((key, index) => ({
        key,
        label: key === "NONE" ? insightsT("needs.none") : needT(key),
        value: needTotalsSource[key] ?? 0,
        color: NEED_COLOR_SCALE[index % NEED_COLOR_SCALE.length],
      })),
    [insightsT, needT, needTotalsSource],
  );

  const workloadSource = React.useMemo(() => {
    if (segmentMode === "team") {
      if (segmentFocus === "all") return metrics.workload;
      return metrics.workload.filter((entry) => entry.teamKey === segmentFocus);
    }
    if (segmentMode === "assignee") {
      if (segmentFocus === "all") return metrics.workload;
      return metrics.workload.filter((entry) => entry.key === segmentFocus);
    }
    return metrics.workload;
  }, [metrics.workload, segmentFocus, segmentMode]);

  const workloadChartData = React.useMemo<AreaDatum[]>(
    () =>
      workloadSource.slice(0, 6).map((entry) => ({
        key: entry.key,
        label: entry.isUnassigned
          ? statusBadgeT("unassigned")
          : entry.label ?? entry.key,
        value: entry.value,
      })),
    [statusBadgeT, workloadSource],
  );

  const workloadMetaFormatter = React.useCallback(
    (datum: AreaDatum) => {
      const match = workloadSource.find((entry) => entry.key === datum.key);
      if (!match) return null;
      if (match.isUnassigned) {
        return statusBadgeT("unassigned");
      }
      if (segmentMode === "team") {
        return formatTeamLabel(match.teamKey);
      }
      return match.label ?? match.key;
    },
    [formatTeamLabel, segmentMode, statusBadgeT, workloadSource],
  );

  const fullDateFormatter = React.useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }),
    [],
  );

  const upcomingChartData = React.useMemo<AreaDatum[]>(
    () =>
      metrics.upcomingDue.map((entry) => ({
        key: entry.key,
        label: dateFormatter.format(new Date(entry.date)),
        value: entry.value,
      })),
    [dateFormatter, metrics.upcomingDue],
  );

  const upcomingMetaFormatter = React.useCallback(
    (datum: AreaDatum) => {
      const match = metrics.upcomingDue.find((entry) => entry.key === datum.key);
      if (!match) return null;
      return fullDateFormatter.format(new Date(match.date));
    },
    [fullDateFormatter, metrics.upcomingDue],
  );

  const timelineDateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }),
    [],
  );

  const timelineData = React.useMemo<AreaDatum[]>(
    () =>
      historicalSnapshots.map((snapshot) => ({
        key: snapshot.bucket,
        label: timelineDateFormatter.format(new Date(snapshot.capturedAt)),
        value: snapshot.total,
      })),
    [historicalSnapshots, timelineDateFormatter],
  );

  const filteredTimelineData = React.useMemo<AreaDatum[]>(() => {
    if (timeRange === "all") return timelineData;
    const weeks = TIME_RANGE_WEEKS[timeRange];
    if (!weeks) return timelineData;
    const cutoff = Date.now() - weeks * WEEK_IN_MS;
    return timelineData.filter((datum) => {
      const snapshot = snapshotMap.get(datum.key);
      if (!snapshot) return true;
      return new Date(snapshot.capturedAt).getTime() >= cutoff;
    });
  }, [snapshotMap, timeRange, timelineData]);

  const timelineMetaFormatter = React.useCallback(
    (datum: AreaDatum) => {
      const snapshot = snapshotMap.get(datum.key);
      if (!snapshot) return null;
      return insightsT("timeline.meta", {
        dueSoon: formatNumber(snapshot.dueSoonCount),
        overdue: formatNumber(snapshot.overdueCount),
      });
    },
    [formatNumber, insightsT, snapshotMap],
  );

  const hasStatusData = statusChartData.some((item) => item.total > 0);
  const hasSubstatusData = substatusChartData.some((item) => item.total > 0);
  const hasNeedData = needChartData.some((item) => item.value > 0);
  const hasWorkloadData = workloadChartData.some((item) => item.value > 0);
  const hasUpcomingData = upcomingChartData.some((item) => item.value > 0);
  const isTimelineEmpty = filteredTimelineData.length === 0;

  const activeScopeLabel =
    scope === "filtered"
      ? insightsT("scopes.filtered")
      : insightsT("scopes.all");

  return (
    <section className="rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.15),_rgba(15,23,42,0.6))] p-5 shadow-[0_16px_40px_rgba(8,15,26,0.45)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-white">
            {insightsT("title")}
          </h2>
          <p className="text-sm text-white/70">{insightsT("subtitle")}</p>
          <p className="text-xs uppercase tracking-wide text-white/50">
            {insightsT("activeScope", { scope: activeScopeLabel })}
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1 text-xs font-medium text-white/70">
          <button
            type="button"
            onClick={() => onScopeChange("filtered")}
            className={`rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
              scope === "filtered"
                ? "bg-[rgb(var(--primary))] text-white shadow-soft"
                : "hover:bg-white/10"
            }`}
          >
            {insightsT("scopes.filtered")}
          </button>
          <button
            type="button"
            onClick={() => onScopeChange("all")}
            className={`rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
              scope === "all"
                ? "bg-[rgb(var(--primary))] text-white shadow-soft"
                : "hover:bg-white/10"
            }`}
          >
            {insightsT("scopes.all")}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title={insightsT("cards.total")}
          value={metrics.total}
          trend={totalTrend}
          formatNumber={formatNumber}
        />
        <SummaryCard
          title={insightsT("cards.dueSoon")}
          value={metrics.dueSoonCount}
          trend={dueSoonTrend}
          formatNumber={formatNumber}
        />
        <SummaryCard
          title={insightsT("cards.overdue")}
          value={metrics.overdueCount}
          trend={overdueTrend}
          formatNumber={formatNumber}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
          <span>{insightsT("segments.label")}</span>
          <select
            className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            value={segmentMode}
            onChange={(event) =>
              setSegmentMode(event.target.value as "none" | "team" | "assignee")
            }
          >
            {segmentationModeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {segmentMode !== "none" ? (
            <select
              className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              value={segmentFocus}
              onChange={(event) => setSegmentFocus(event.target.value)}
            >
              {segmentFocusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={insightsT("sections.status")}
          description={segmentMode === "none" ? insightsT("charts.status.description") : undefined}
          isEmpty={!hasStatusData}
          emptyMessage={insightsT("empty")}
        >
          <StackedBarChart
            data={statusChartData}
            valueFormatter={formatNumber}
            axisLabel={insightsT("charts.axis.tasks")}
          />
        </ChartCard>
        <ChartCard
          title={insightsT("sections.substatus")}
          isEmpty={!hasSubstatusData}
          emptyMessage={insightsT("empty")}
        >
          <StackedBarChart
            data={substatusChartData}
            valueFormatter={formatNumber}
            axisLabel={insightsT("charts.axis.tasks")}
          />
        </ChartCard>
        <ChartCard
          title={insightsT("sections.need")}
          isEmpty={!hasNeedData}
          emptyMessage={insightsT("empty")}
        >
          <DonutChart
            data={needChartData}
            valueFormatter={formatNumber}
            emptyLabel={insightsT("empty")}
          />
        </ChartCard>
        <ChartCard
          title={insightsT("sections.workload")}
          isEmpty={!hasWorkloadData}
          emptyMessage={insightsT("empty")}
        >
          <AreaTrendChart
            data={workloadChartData}
            valueFormatter={formatNumber}
            metaFormatter={workloadMetaFormatter}
            color="#6366f1"
          />
        </ChartCard>
        <ChartCard
          title={insightsT("sections.upcoming")}
          isEmpty={!hasUpcomingData}
          emptyMessage={insightsT("upcomingEmpty")}
        >
          <AreaTrendChart
            data={upcomingChartData}
            valueFormatter={formatNumber}
            metaFormatter={upcomingMetaFormatter}
            color="#f97316"
          />
        </ChartCard>
        <ChartCard
          title={insightsT("sections.timeline")}
          description={insightsT("timeline.description")}
          actions={
            <select
              className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              value={timeRange}
              onChange={(event) =>
                setTimeRange(event.target.value as TimeRangeValue)
              }
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          }
          isLoading={snapshotsLoading}
          isEmpty={!snapshotsLoading && isTimelineEmpty}
          emptyMessage={insightsT("timeline.empty")}
        >
          <AreaTrendChart
            data={filteredTimelineData}
            valueFormatter={formatNumber}
            metaFormatter={timelineMetaFormatter}
            color="#38bdf8"
          />
        </ChartCard>
      </div>
    </section>
  );
}
