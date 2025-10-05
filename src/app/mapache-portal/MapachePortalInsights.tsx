"use client";

import * as React from "react";

import { useTranslations } from "@/app/LanguageProvider";

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
};

export type MapachePortalInsightsUpcomingEntry = {
  key: string;
  date: string;
  value: number;
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

type MiniBarItem = {
  key: string;
  label: string;
  value: number;
};

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

type TrendMode = "full" | "compact";

type InsightsSnapshot = {
  total: number;
  dueSoonCount: number;
  overdueCount: number;
  statusTotals: Record<MapacheTaskStatus, number>;
  timestamp: string;
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

const BAR_TONE_CLASSNAMES: Record<
  "primary" | "emerald" | "amber" | "sky",
  string
> = {
  primary: "bg-[rgb(var(--primary))]",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  sky: "bg-sky-400",
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

type MiniBarListProps = {
  title: string;
  items: MiniBarItem[];
  emptyMessage: string;
  tone?: keyof typeof BAR_TONE_CLASSNAMES;
  formatNumber: (value: number) => string;
  trendByKey?: Record<string, TrendDescriptor> | null;
};

function MiniBarList({
  title,
  items,
  emptyMessage,
  tone = "primary",
  formatNumber,
  trendByKey,
}: MiniBarListProps) {
  const significant = items.filter((item) => item.value > 0);
  const data = significant.length > 0 ? significant : [];
  const max = data.reduce((acc, item) => Math.max(acc, item.value), 0);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 shadow-[0_6px_18px_rgba(15,23,42,0.3)]">
      <div className="mb-3 text-sm font-medium text-white/80">{title}</div>
      {data.length === 0 ? (
        <p className="text-xs text-white/60">{emptyMessage}</p>
      ) : (
        <ul className="grid gap-2">
          {data.map((item) => {
            const percentage =
              max === 0
                ? 0
                : Math.min(
                    100,
                    Math.max(6, Math.round((item.value / max) * 100)),
                  );
            const trend = trendByKey?.[item.key] ?? null;
            return (
              <li key={item.key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-white/80">
                    {item.label}
                  </span>
                  {trend ? <TrendBadge descriptor={trend} size="sm" /> : null}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-2 rounded-full transition-[width] duration-500 ${BAR_TONE_CLASSNAMES[tone]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-white/70">
                    {formatNumber(item.value)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
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

  const [previousSnapshot, setPreviousSnapshot] =
    React.useState<InsightsSnapshot | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let stored: Record<string, InsightsSnapshot> = {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, InsightsSnapshot>;
        if (parsed && typeof parsed === "object") {
          stored = parsed;
        }
      }
    } catch {
      stored = {};
    }

    const now = new Date();
    const currentKey = getWeekKey(now);
    const previousKey = getWeekKey(new Date(now.getTime() - WEEK_IN_MS));

    setPreviousSnapshot(stored[previousKey] ?? null);

    const snapshot: InsightsSnapshot = {
      total: metricsByScope.all.total,
      dueSoonCount: metricsByScope.all.dueSoonCount,
      overdueCount: metricsByScope.all.overdueCount,
      statusTotals: { ...metricsByScope.all.statusTotals },
      timestamp: now.toISOString(),
    };

    stored[currentKey] = snapshot;

    const normalizedEntries = Object.entries(stored)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);

    const normalized = Object.fromEntries(normalizedEntries);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore storage write errors (quota, private mode, etc.).
    }
  }, [metricsByScope.all]);

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
    createTrendDescriptor(metrics.overdueCount, previousSnapshot?.overdueCount, {
      canCompare,
      showWhenFiltered: true,
      mode: "full",
      translate: insightsT,
    }) ?? totalTrend;

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

    return ordered;
  }, [
    metricsByScope.all.statusTotals,
    metricsByScope.filtered.statusTotals,
    previousSnapshot,
    statuses,
  ]);

  const statusTrendMap = React.useMemo(() => {
    const map: Record<string, TrendDescriptor> = {};
    statusOrder.forEach((status) => {
      const descriptor = createTrendDescriptor(
        metrics.statusTotals[status] ?? 0,
        previousSnapshot?.statusTotals[status],
        {
          canCompare,
          showWhenFiltered: false,
          mode: "compact",
          translate: insightsT,
        },
      );
      if (descriptor) {
        map[status] = descriptor;
      }
    });
    return map;
  }, [canCompare, insightsT, metrics.statusTotals, previousSnapshot, statusOrder]);

  const statusItems = React.useMemo<MiniBarItem[]>(
    () =>
      statusOrder.map((status) => ({
        key: status,
        label: formatStatusLabel(status),
        value: metrics.statusTotals[status] ?? 0,
      })),
    [formatStatusLabel, metrics.statusTotals, statusOrder],
  );

  const substatusItems = React.useMemo<MiniBarItem[]>(
    () =>
      SUBSTATUS_ORDER.map((substatus) => ({
        key: substatus,
        label: substatusesT(SUBSTATUS_LABEL_KEYS[substatus]),
        value: metrics.substatusTotals[substatus] ?? 0,
      })),
    [metrics.substatusTotals, substatusesT],
  );

  const needItems = React.useMemo<MiniBarItem[]>(
    () =>
      NEED_KEYS.map((key) => ({
        key,
        label: key === "NONE" ? insightsT("needs.none") : needT(key),
        value: metrics.needTotals[key] ?? 0,
      })),
    [insightsT, metrics.needTotals, needT],
  );

  const workloadItems = React.useMemo<MiniBarItem[]>(
    () =>
      metrics.workload.slice(0, 6).map((entry) => ({
        key: entry.key,
        label: entry.isUnassigned
          ? statusBadgeT("unassigned")
          : entry.label ?? entry.key,
        value: entry.value,
      })),
    [metrics.workload, statusBadgeT],
  );

  const upcomingItems = React.useMemo<MiniBarItem[]>(
    () =>
      metrics.upcomingDue.slice(0, 6).map((entry) => ({
        key: entry.key,
        label: dateFormatter.format(new Date(entry.date)),
        value: entry.value,
      })),
    [dateFormatter, metrics.upcomingDue],
  );

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

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <MiniBarList
            title={insightsT("sections.status")}
            items={statusItems}
            emptyMessage={insightsT("empty")}
            tone="primary"
            formatNumber={formatNumber}
            trendByKey={statusTrendMap}
          />
          <MiniBarList
            title={insightsT("sections.substatus")}
            items={substatusItems}
            emptyMessage={insightsT("empty")}
            tone="emerald"
            formatNumber={formatNumber}
          />
        </div>
        <div className="flex flex-col gap-4">
          <MiniBarList
            title={insightsT("sections.need")}
            items={needItems}
            emptyMessage={insightsT("empty")}
            tone="sky"
            formatNumber={formatNumber}
          />
          <MiniBarList
            title={insightsT("sections.workload")}
            items={workloadItems}
            emptyMessage={insightsT("empty")}
            tone="primary"
            formatNumber={formatNumber}
          />
          <MiniBarList
            title={insightsT("sections.upcoming")}
            items={upcomingItems}
            emptyMessage={insightsT("upcomingEmpty")}
            tone="amber"
            formatNumber={formatNumber}
          />
        </div>
      </div>
    </section>
  );
}
