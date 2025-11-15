// src/app/components/features/proposals/Stats.tsx
"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { X, BarChart3, Users, Building2, DollarSign, TrendingUp, Target, Award, Percent } from "lucide-react";
import type { ProposalRecord } from "@/lib/types";
import type { AppRole } from "@/constants/teams";
import { countryIdFromName } from "./lib/catalogs";
import { buildCsv, downloadCsv } from "./lib/csv";
import { formatUSD, formatDateTime } from "./lib/format";
import { toast } from "@/app/components/ui/toast";
import {
  q1Range,
  q2Range,
  q3Range,
  q4Range,
  currentMonthRange,
  prevMonthRange,
  currentQuarterRange,
} from "./lib/dateRanges";
import { useTranslations } from "@/app/LanguageProvider";
import { fetchAllProposals, invalidateProposalsCache, type ProposalsListMeta } from "./lib/proposals-response";
import { useAdminUsers } from "./hooks/useAdminUsers";
import { usePathname } from "next/navigation";
import { EnhancedGlassKpi } from "./components/EnhancedGlassKpi";
import type { SparklineData } from "./components/Sparkline";
import { DrillDownModal } from "./components/DrillDownModal";
import { SavedFiltersManager } from "./components/SavedFiltersManager";
import { RefreshIndicator } from "./components/RefreshIndicator";

const THOUSAND_SCALING_SKUS = ["minutos de telefonia - entrantes", "minutos de telefonia - salientes"] as const;

const normalizeKey = (value: string | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const shouldScaleSkuQuantity = (sku: string, name?: string) => {
  const normalizedSku = normalizeKey(sku);
  const normalizedName = normalizeKey(name);
  return THOUSAND_SCALING_SKUS.some(
    (needle) => normalizedSku.includes(needle) || normalizedName.includes(needle),
  );
};

const getDisplayedSkuQuantity = (sku: string, name: string | undefined, quantity: number) => {
  if (shouldScaleSkuQuantity(sku, name)) {
    const scaledValue = Math.round(quantity / 1000);
    return {
      value: scaledValue,
      display: `${scaledValue.toLocaleString()} (* 1000)`,
    };
  }
  return {
    value: quantity,
    display: quantity.toLocaleString(),
  };
};

function GradientShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-brand-primary/10 bg-white p-6 text-slate-900 shadow-[0_28px_72px_rgba(60,3,140,0.12)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(132,90,191,0.25),_transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(60,3,140,0.18),_transparent_70%)] blur-3xl"
      />
      <div className="relative z-10 space-y-6">{children}</div>
    </section>
  );
}

function GlassKpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-primary/10 bg-white px-5 py-4 shadow-[0_16px_32px_rgba(60,3,140,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary/70">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-brand-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function TableCard({
  title,
  actions,
  children,
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(60,3,140,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 bg-slate-50/70 px-5 py-3">
        <h3 className="text-sm font-semibold text-brand-primary">{title}</h3>
        {actions ? <div className="flex items-center gap-3 text-xs text-brand-primary/80">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <tbody className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: cols }).map((__, colIndex) => (
            <td key={colIndex} className="px-5 py-3">
              <div className="h-3.5 w-full rounded bg-slate-200" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

const chartPalette = ["#6366F1", "#22D3EE", "#8B5CF6", "#F472B6", "#14B8A6", "#F59E0B", "#0EA5E9"] as const;

function ChartCard({
  title,
  description,
  meta,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-brand-primary/10 bg-white/95 p-6 text-slate-900 shadow-[0_22px_60px_rgba(60,3,140,0.12)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(124,58,237,0.18),_transparent_70%)] blur-3xl"
      />
      <div className="relative z-10 flex flex-col gap-3">
        <header className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-brand-primary">{title}</h3>
          {description ? <p className="text-sm text-slate-500">{description}</p> : null}
        </header>
        {meta ? <div className="text-xs text-slate-500">{meta}</div> : null}
        <div className="flex-1">{children}</div>
      </div>
    </section>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-[240px] w-full items-center justify-center">
      <div className="h-32 w-full max-w-md animate-pulse rounded-3xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

type HorizontalBarDatum = { name: string; value: number; helper?: string; display?: string };

function HorizontalBarList({
  data,
  emptyMessage,
  formatValue = (value: number) => value.toLocaleString(),
  onBarClick,
}: {
  data: HorizontalBarDatum[];
  emptyMessage: string;
  formatValue?: (value: number) => string;
  onBarClick?: (name: string) => void;
}) {
  if (!data.length) {
    return <ChartEmpty message={emptyMessage} />;
  }

  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percent = max === 0 ? 0 : (item.value / max) * 100;
        const color = chartPalette[index % chartPalette.length];
        return (
          <div
            key={item.name}
            className={`rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_12px_36px_rgba(60,3,140,0.08)] ${
              onBarClick ? "cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-200/50" : ""
            }`}
            onClick={onBarClick ? () => onBarClick(item.name) : undefined}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-600">{item.name}</p>
                  {item.helper ? (
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">{item.helper}</p>
                  ) : null}
                </div>
              </div>
              <span className="text-sm font-semibold text-brand-primary">
                {item.display ?? formatValue(item.value)}
              </span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${percent}%`,
                  background: `linear-gradient(90deg, ${color} 0%, rgba(99,102,241,0.7) 100%)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Pastillas de rango rápido */
function QuickRanges({
  from,
  to,
  setFrom,
  setTo,
}: {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
}) {
  const t = useTranslations("proposals.stats.quickRanges");
  const year = new Date().getFullYear();
  const apply = (r: { from: string; to: string }) => {
    setFrom(r.from);
    setTo(r.to);
  };
  const quarters = [
    { label: "Q1", get: () => q1Range(year) },
    { label: "Q2", get: () => q2Range(year) },
    { label: "Q3", get: () => q3Range(year) },
    { label: "Q4", get: () => q4Range(year) },
  ];

  const baseClass =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40";

  const isRangeActive = useCallback(
    (range: { from: string; to: string }) => from === range.from && to === range.to,
    [from, to],
  );

  return (
    <div className="flex flex-wrap gap-2">
      {quarters.map((q) => (
        <button
          key={q.label}
          className={`${baseClass} ${
            isRangeActive(q.get())
              ? "border-brand-primary bg-brand-primary text-white shadow-sm"
              : "border-brand-primary/20 bg-brand-primary/5 text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/10"
          }`}
          onClick={() => apply(q.get())}
          title={t("quarterTooltip")}
          type="button"
        >
          {q.label}
        </button>
      ))}
      <button
        className={`${baseClass} ${
          isRangeActive(currentMonthRange())
            ? "border-brand-primary bg-brand-primary text-white shadow-sm"
            : "border-brand-primary/20 bg-brand-primary/5 text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/10"
        }`}
        onClick={() => apply(currentMonthRange())}
        type="button"
      >
        {t("currentMonth")}
      </button>
      <button
        className={`${baseClass} ${
          isRangeActive(prevMonthRange())
            ? "border-brand-primary bg-brand-primary text-white shadow-sm"
            : "border-brand-primary/20 bg-brand-primary/5 text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/10"
        }`}
        onClick={() => apply(prevMonthRange())}
        type="button"
      >
        {t("previousMonth")}
      </button>
    </div>
  );
}

type ProposalForStats = ProposalRecord & {
  items?: Array<{ sku: string; name: string; quantity: number }>;
};
type OrderKey = "createdAt" | "totalAmount";
type OrderDir = "asc" | "desc";
type ActiveFilterChip = { id: string; label: string; onClear: () => void };

export default function Stats({
  role,
  currentEmail,
  leaderTeam,
  isSuperAdmin,
}: {
  role: AppRole;
  currentEmail: string;
  leaderTeam: string | null;
  isSuperAdmin: boolean;
}) {
  const t = useTranslations("proposals.stats");
  const filtersT = useTranslations("proposals.stats.filters");
  const actionsT = useTranslations("proposals.stats.actions");
  const toastT = useTranslations("proposals.stats.toast");
  const csvT = useTranslations("proposals.stats.csv");
  const kpisT = useTranslations("proposals.stats.kpis");
  const sectionsT = useTranslations("proposals.stats.sections");
  const tableT = useTranslations("proposals.stats.table");
  const chartsT = useTranslations("proposals.stats.charts");

  // filtros - Default to Q4 2025 (current quarter)
  const [from, setFrom] = useState("2025-10-01");
  const [to, setTo] = useState("2025-12-31");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");

  const [orderKey, setOrderKey] = useState<OrderKey>("createdAt");
  const [orderDir, setOrderDir] = useState<OrderDir>("desc");

  const [topN, setTopN] = useState<number>(20);
  const [showAll, setShowAll] = useState<boolean>(false);

  // datos
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState<ProposalForStats[]>([]);
  const [, setListMeta] = useState<ProposalsListMeta | undefined>();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [hasNewData, setHasNewData] = useState(false);

  // drill-down modal state
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<{
    title: string;
    data: Array<Record<string, unknown>>;
    columns: Array<{ key: string; label: string; format?: (value: unknown) => string }>;
  } | null>(null);

  type LoadOptions = { skipCache?: boolean };
  const load = useCallback(async (options?: LoadOptions) => {
    setLoading(true);
    try {
      const { proposals, meta } = await fetchAllProposals({
        skipCache: options?.skipCache ?? false,
      });
      const hadData = all.length > 0;
      const hasNewProposals = proposals.length > all.length;
      
      setAll(proposals);
      setListMeta(meta);
      setLastUpdated(new Date());
      
      if (hadData && hasNewProposals && !options?.skipCache) {
        setHasNewData(true);
        setTimeout(() => setHasNewData(false), 5000);
      }
    } catch (error) {
      setAll([]);
      setListMeta(undefined);
      const status =
        error instanceof Error && typeof (error as { status?: unknown }).status === "number"
          ? (error as { status?: number }).status
          : undefined;
      toast.error(toastT(status ? "loadError" : "networkError"));
    } finally {
      setLoading(false);
    }
  }, [toastT, all.length]);

  const handleManualRefresh = useCallback(async () => {
    invalidateProposalsCache();
    await load({ skipCache: true });
    toast.success(toastT("refreshSuccess") || "Datos actualizados");
  }, [load, toastT]);

  const openDrillDown = useCallback((
    title: string,
    data: Array<Record<string, unknown>>,
    columns: Array<{ key: string; label: string; format?: (value: unknown) => string }>
  ) => {
    setDrillDownData({ title, data, columns });
    setDrillDownOpen(true);
  }, []);

  const handleApplyFilters = useCallback((filters: {
    from?: string;
    to?: string;
    teamFilter?: string;
    countryFilter?: string;
    userFilter?: string;
    orderKey?: string;
    orderDir?: string;
  }) => {
    setFrom(filters.from || "");
    setTo(filters.to || "");
    setTeamFilter(filters.teamFilter || "");
    setCountryFilter(filters.countryFilter || "");
    setUserFilter(filters.userFilter || "");
    if (filters.orderKey) setOrderKey(filters.orderKey as OrderKey);
    if (filters.orderDir) setOrderDir(filters.orderDir as OrderDir);
  }, []);

  const generateSparklineData = useCallback((
    proposals: ProposalForStats[],
    days: number = 30,
    valueExtractor: (p: ProposalForStats) => number = () => 1
  ): SparklineData => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const msPerDay = 24 * 60 * 60 * 1000;
    const startTime = now.getTime() - (days * msPerDay);
    
    const buckets: Array<{ date: Date; value: number }> = [];
    const interval = Math.max(1, Math.floor(days / 10));
    
    for (let i = 0; i <= days; i += interval) {
      const bucketStart = new Date(startTime + i * msPerDay);
      bucketStart.setHours(0, 0, 0, 0);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setHours(23, 59, 59, 999);
      bucketEnd.setDate(bucketEnd.getDate() + interval - 1);
      
      const value = proposals
        .filter(p => {
          const created = new Date(p.createdAt);
          return created >= bucketStart && created <= bucketEnd;
        })
        .reduce((sum, p) => sum + valueExtractor(p), 0);
      
      buckets.push({ date: new Date(bucketStart), value });
    }
    
    return buckets.map(b => ({
      value: b.value,
      label: b.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
  }, []);

  const getTrend = (currentData: SparklineData): "up" | "down" | "neutral" => {
    if (currentData.length < 6) return "neutral";
    
    const nonZeroValues = currentData.filter(d => d.value > 0);
    if (nonZeroValues.length < 3) return "neutral";
    
    const halfPoint = Math.floor(currentData.length / 2);
    const recentValues = currentData.slice(halfPoint);
    const olderValues = currentData.slice(0, halfPoint);
    
    const recentAvg = recentValues.reduce((sum, d) => sum + d.value, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((sum, d) => sum + d.value, 0) / olderValues.length;
    
    if (olderAvg === 0) return recentAvg > 0 ? "up" : "neutral";
    
    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (percentChange > 10) return "up";
    if (percentChange < -10) return "down";
    return "neutral";
  };

  const pathname = usePathname();
  useEffect(() => {
    load();
  }, [load, pathname]);

  useEffect(() => {
    const onRefresh = () => {
      invalidateProposalsCache();
      load({ skipCache: true });
    };
    window.addEventListener("proposals:refresh", onRefresh as EventListener);
    return () => window.removeEventListener("proposals:refresh", onRefresh as EventListener);
  }, [load]);

  // emails -> team
  const { users: adminUsers } = useAdminUsers({
    isSuperAdmin,
    isLeader: role === "lider",
  });
  const emailToTeam = useMemo(() => {
    const map = new Map<string, string | null>();
    adminUsers.forEach((u) => {
      if (u.email) map.set(u.email, u.team);
    });
    return map;
  }, [adminUsers]);

  /** Equipos visibles (con al menos 1 integrante) para el select de admin */
  const visibleTeams: string[] = useMemo(() => {
    const counts = new Map<string, number>();
    adminUsers.forEach((u) => {
      const t = (u.team || "").trim();
      if (!t) return;
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    return Array.from(counts.entries())
      .filter(([, c]) => c > 0)
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b));
  }, [adminUsers]);

  const countryOptions = useMemo(
    () => Array.from(new Set(all.map((p) => p.country))).sort((a, b) => a.localeCompare(b)),
    [all]
  );
  const userOptions = useMemo(
    () => Array.from(new Set(all.map((p) => p.userEmail).filter(Boolean) as string[])).sort(),
    [all]
  );

  const subsetRaw = useMemo(() => {
    return all.filter((p) => {
      if (isSuperAdmin) {
        if (teamFilter) {
          const t = emailToTeam.get(p.userEmail) ?? null;
          if (t !== teamFilter) return false;
        }
      } else if (role === "lider") {
        const t = emailToTeam.get(p.userEmail) ?? null;
        if (!leaderTeam || t !== leaderTeam) return false;
      } else {
        if (p.userEmail !== currentEmail) return false;
      }

      const tms = new Date(p.createdAt as unknown as string).getTime();
      const f = from ? new Date(from).getTime() : -Infinity;
      const tt = to ? new Date(to).getTime() + 24 * 3600 * 1000 - 1 : Infinity;
      if (!(tms >= f && tms <= tt)) return false;

      if (countryFilter && p.country !== countryFilter) return false;
      if (userFilter && p.userEmail !== userFilter) return false;

      return true;
    });
  }, [
    all,
    isSuperAdmin,
    role,
    leaderTeam,
    currentEmail,
    from,
    to,
    teamFilter,
    countryFilter,
    userFilter,
    emailToTeam,
  ]);

  const subset = useMemo(() => {
    const arr = [...subsetRaw];
    return arr.sort((a, b) => {
      if (orderKey === "createdAt") {
        const av = new Date(a.createdAt as unknown as string).getTime();
        const bv = new Date(b.createdAt as unknown as string).getTime();
        return orderDir === "asc" ? av - bv : bv - av;
      }
      const av = Number(a.totalAmount) || 0;
      const bv = Number(b.totalAmount) || 0;
      return orderDir === "asc" ? av - bv : bv - av;
    });
  }, [subsetRaw, orderKey, orderDir]);

  // KPIs base
  const uniqueUsers = useMemo(() => new Set(subset.map((p) => p.userEmail)).size, [subset]);
  const uniqueCompanies = useMemo(() => new Set(subset.map((p) => p.companyName)).size, [subset]);
  const totalMonthly = useMemo(
    () => subset.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0),
    [subset]
  );
  const avgPerProposal = useMemo(
    () => (subset.length ? totalMonthly / subset.length : 0),
    [subset.length, totalMonthly]
  );

  // KPIs WON
  const wonRows = useMemo(
    () => subset.filter((p) => String(p.status || "").toUpperCase() === "WON"),
    [subset]
  );
  const wonCount = wonRows.length;
  const wonAmount = wonRows.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);
  const winRate = subset.length ? (wonCount / subset.length) * 100 : 0;
  const wonAvgTicket = wonCount ? wonAmount / wonCount : 0;

  // agregados
  const bySkuFull: Array<[string, { name: string; qty: number }]> = useMemo(
    () =>
      Object.entries(
        subset.reduce<Record<string, { name: string; qty: number }>>((acc, p) => {
          (p.items ?? []).forEach((it) => {
            const cur = acc[it.sku] ?? { name: it.name, qty: 0 };
            cur.qty += it.quantity;
            cur.name = cur.name || it.name;
            acc[it.sku] = cur;
          });
          return acc;
        }, {} as Record<string, { name: string; qty: number }>)
      ).sort((a, b) => b[1].qty - a[1].qty),
    [subset]
  );

  const byCountryFull: Array<[string, number]> = useMemo(
    () =>
      Object.entries(
        subset.reduce<Record<string, number>>((acc, p) => {
          acc[p.country] = (acc[p.country] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1]),
    [subset]
  );

  const byUserFull: Array<[string, number]> = useMemo(() => {
    const fallbackRaw = tableT("user.fallback");
    const fallbackKey = "proposals.stats.table.user.fallback";
    const fallback = fallbackRaw === fallbackKey ? "(sin email)" : fallbackRaw;
    return Object.entries(
      subset.reduce<Record<string, number>>((acc, p) => {
        const key = p.userEmail || fallback;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]);
  }, [subset, tableT]);

  const bySku = useMemo(
    () => (showAll ? bySkuFull : bySkuFull.slice(0, topN)),
    [bySkuFull, topN, showAll]
  );
  const byCountry = useMemo(
    () => (showAll ? byCountryFull : byCountryFull.slice(0, topN)),
    [byCountryFull, topN, showAll]
  );
  const byUser = useMemo(
    () => (showAll ? byUserFull : byUserFull.slice(0, topN)),
    [byUserFull, topN, showAll]
  );

  const chartsEmptyLabel = chartsT("empty");
  const chartsOthersLabel = chartsT("others");
  const countryChartData = useMemo(() => {
    const items = byCountry.slice(0, 6).map(([country, total]) => ({
      name: country,
      value: total,
      helper: countryIdFromName(country),
    }));
    if (!showAll && byCountryFull.length > 6) {
      const remaining = byCountryFull.slice(6).reduce((acc, [, total]) => acc + total, 0);
      if (remaining > 0) {
        items.push({ name: chartsOthersLabel, value: remaining, helper: "" });
      }
    }
    return items;
  }, [byCountry, byCountryFull, chartsOthersLabel, showAll]);

  const skuChartData = useMemo(() => {
    const items = bySku.slice(0, 6).map(([sku, info]) => {
      const { value, display } = getDisplayedSkuQuantity(sku, info.name, info.qty);
      return {
        name: info.name || sku,
        helper: sku,
        value,
        display,
      };
    });
    if (!showAll && bySkuFull.length > 6) {
      const remaining = bySkuFull.slice(6).reduce((acc, [, info]) => acc + info.qty, 0);
      if (remaining > 0) {
        items.push({
          name: chartsOthersLabel,
          value: remaining,
          helper: "",
          display: remaining.toLocaleString(),
        });
      }
    }
    return items;
  }, [bySku, bySkuFull, chartsOthersLabel, showAll]);

  // CSVs
  const exportSkuCsv = () => {
    const headers = [
      csvT("sku.headers.sku"),
      csvT("sku.headers.item"),
      csvT("sku.headers.quantity"),
    ];
    const rows = bySkuFull.map(([sku, info]) => [sku, info.name, info.qty]);
    downloadCsv(csvT("sku.fileName"), buildCsv(headers, rows));
    toast.success(toastT("csv.sku"));
  };
  const exportCountryCsv = () => {
    const headers = [csvT("country.headers.country"), csvT("country.headers.quantity")];
    const rows = byCountryFull.map(([c, n]) => [c, n]);
    downloadCsv(csvT("country.fileName"), buildCsv(headers, rows));
    toast.success(toastT("csv.country"));
  };
  const exportUserCsv = () => {
    const headers = [csvT("user.headers.user"), csvT("user.headers.proposals")];
    const rows = byUserFull.map(([u, n]) => [u, n]);
    downloadCsv(csvT("user.fileName"), buildCsv(headers, rows));
    toast.success(toastT("csv.user"));
  };
  const exportFilteredProposalsCsv = () => {
    const headers = [
      csvT("filtered.headers.id"),
      csvT("filtered.headers.company"),
      csvT("filtered.headers.country"),
      csvT("filtered.headers.user"),
      csvT("filtered.headers.monthly"),
      csvT("filtered.headers.hours"),
      csvT("filtered.headers.oneShot"),
      csvT("filtered.headers.created"),
      csvT("filtered.headers.url"),
    ];
    const rows = subset.map((p) => [
      p.id,
      p.companyName,
      p.country,
      p.userEmail || "",
      Number(p.totalAmount || 0).toFixed(2),
      Number(p.totalHours || 0).toFixed(2),
      Number(p.oneShot || 0).toFixed(2),
      formatDateTime(p.createdAt as unknown as string),
      p.docUrl || "",
    ]);
    downloadCsv(csvT("filtered.fileName"), buildCsv(headers, rows));
    toast.success(toastT("csv.filtered"));
  };

  const controlClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 disabled:cursor-not-allowed disabled:opacity-60";
  const secondaryButtonClass =
    "inline-flex items-center justify-center rounded-xl border border-brand-primary/20 bg-white px-3 py-2 text-sm font-medium text-brand-primary transition hover:border-brand-primary/40 hover:bg-brand-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40";
  const primaryButtonClass =
    "inline-flex items-center justify-center rounded-xl border border-brand-primary bg-brand-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40";
  const pillSelectClass =
    "rounded-full border border-brand-primary/20 bg-white px-3 py-1 text-xs font-medium text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 disabled:cursor-not-allowed disabled:opacity-60";

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }),
    [],
  );
  const summaryPercentFormatter = useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }),
    [],
  );

  const activeFilters = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    const safeFormat = (value: string) => {
      if (!value) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return dateFormatter.format(date);
    };
    if (from || to) {
      const formattedFrom = safeFormat(from);
      const formattedTo = safeFormat(to);
      const parts: string[] = [];
      if (from && formattedFrom) {
        parts.push(`${filtersT("from")}: ${formattedFrom}`);
      }
      if (to && formattedTo) {
        parts.push(`${filtersT("to")}: ${formattedTo}`);
      }
      if (parts.length) {
        chips.push({
          id: "range",
          label: parts.join(" · "),
          onClear: () => {
            setFrom("");
            setTo("");
          },
        });
      }
    }
    if (teamFilter) {
      chips.push({
        id: "team",
        label: `${filtersT("team.label")}: ${teamFilter}`,
        onClear: () => setTeamFilter(""),
      });
    }
    if (countryFilter) {
      chips.push({
        id: "country",
        label: `${filtersT("country.label")}: ${countryFilter}`,
        onClear: () => setCountryFilter(""),
      });
    }
    if (userFilter) {
      chips.push({
        id: "user",
        label: `${filtersT("user.label")}: ${userFilter}`,
        onClear: () => setUserFilter(""),
      });
    }
    if (orderKey !== "createdAt" || orderDir !== "desc") {
      const orderLabel = `${filtersT("orderBy.label")}: ${
        orderKey === "createdAt"
          ? filtersT("orderBy.createdAt")
          : filtersT("orderBy.totalAmount")
      } · ${orderDir === "desc" ? filtersT("direction.desc") : filtersT("direction.asc")}`;
      chips.push({
        id: "order",
        label: orderLabel,
        onClear: () => {
          setOrderKey("createdAt");
          setOrderDir("desc");
        },
      });
    }
    return chips;
  }, [
    countryFilter,
    dateFormatter,
    filtersT,
    from,
    orderDir,
    orderKey,
    teamFilter,
    to,
    userFilter,
  ]);

  const filtersSummaryText = useMemo(() => {
    const filteredValue = subset.length.toLocaleString();
    const totalValue = all.length.toLocaleString();
    const percentValue = summaryPercentFormatter.format(
      all.length ? (subset.length / all.length) * 100 : 0,
    );
    return filtersT("summary", {
      filtered: filteredValue,
      total: totalValue,
      percent: percentValue,
    });
  }, [all.length, filtersT, subset.length, summaryPercentFormatter]);

  // Sparklines for all KPIs (30-day rolling window)
  const sparklineSubsetCount = useMemo(() => generateSparklineData(subset, 30), [subset, generateSparklineData]);
  const sparklineTotalMonthly = useMemo(() => 
    generateSparklineData(subset, 30, (p) => Number(p.totalAmount) || 0),
    [subset, generateSparklineData]
  );
  const sparklineWonCount = useMemo(() => generateSparklineData(wonRows, 30), [wonRows, generateSparklineData]);
  const sparklineWonAmount = useMemo(() => 
    generateSparklineData(wonRows, 30, (p) => Number(p.totalAmount) || 0),
    [wonRows, generateSparklineData]
  );
  
  const sparklineUniqueUsers = useMemo(() => {
    const usersByDay = new Map<string, Set<string>>();
    subset.forEach((p) => {
      const date = new Date(p.createdAt).toISOString().split('T')[0];
      if (!usersByDay.has(date)) usersByDay.set(date, new Set());
      usersByDay.get(date)!.add(p.userEmail);
    });
    const data: { value: number; label?: string }[] = [];
    const endDate = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      data.push({ value: usersByDay.get(dateStr)?.size || 0, label: dateStr });
    }
    return data;
  }, [subset]);
  
  const sparklineUniqueCompanies = useMemo(() => {
    const companiesByDay = new Map<string, Set<string>>();
    subset.forEach((p) => {
      const date = new Date(p.createdAt).toISOString().split('T')[0];
      if (!companiesByDay.has(date)) companiesByDay.set(date, new Set());
      companiesByDay.get(date)!.add(p.companyName);
    });
    const data: { value: number; label?: string }[] = [];
    const endDate = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      data.push({ value: companiesByDay.get(dateStr)?.size || 0, label: dateStr });
    }
    return data;
  }, [subset]);
  
  const sparklineAvgPerProposal = useMemo(() => {
    const proposalsByDay = new Map<string, number[]>();
    subset.forEach((p) => {
      const date = new Date(p.createdAt).toISOString().split('T')[0];
      if (!proposalsByDay.has(date)) proposalsByDay.set(date, []);
      proposalsByDay.get(date)!.push(Number(p.totalAmount) || 0);
    });
    const data: { value: number; label?: string }[] = [];
    const endDate = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const amounts = proposalsByDay.get(dateStr) || [];
      const avg = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
      data.push({ value: avg, label: dateStr });
    }
    return data;
  }, [subset]);
  
  const sparklineWinRate = useMemo(() => {
    const proposalsByDay = new Map<string, { total: number; won: number }>();
    subset.forEach((p) => {
      const date = new Date(p.createdAt).toISOString().split('T')[0];
      if (!proposalsByDay.has(date)) proposalsByDay.set(date, { total: 0, won: 0 });
      const stats = proposalsByDay.get(date)!;
      stats.total++;
      if (p.status === "won") stats.won++;
    });
    const data: { value: number; label?: string }[] = [];
    const endDate = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const stats = proposalsByDay.get(dateStr);
      const rate = stats && stats.total > 0 ? (stats.won / stats.total) * 100 : 0;
      data.push({ value: rate, label: dateStr });
    }
    return data;
  }, [subset]);
  
  const sparklineWonAvgTicket = useMemo(() => {
    const wonByDay = new Map<string, number[]>();
    wonRows.forEach((p) => {
      const date = new Date(p.createdAt).toISOString().split('T')[0];
      if (!wonByDay.has(date)) wonByDay.set(date, []);
      wonByDay.get(date)!.push(Number(p.totalAmount) || 0);
    });
    const data: { value: number; label?: string }[] = [];
    const endDate = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const amounts = wonByDay.get(dateStr) || [];
      const avg = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
      data.push({ value: avg, label: dateStr });
    }
    return data;
  }, [wonRows]);

  return (
    <>
      <DrillDownModal
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={drillDownData?.title || ""}
        data={drillDownData?.data || []}
        columns={drillDownData?.columns || []}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-slate-50 p-6">
        <div className="mx-auto max-w-[1600px] space-y-6">
          
          {/* ==================== TIER 1: FILTERS ==================== */}
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur-sm">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                  {t("title")}
                </h1>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SavedFiltersManager
                  currentFilters={{
                    from,
                    to,
                    teamFilter,
                    countryFilter,
                    userFilter,
                    orderKey,
                    orderDir,
                  }}
                  onApplyFilter={handleApplyFilters}
                  userEmail={currentEmail}
                />
                <RefreshIndicator
                  onRefresh={handleManualRefresh}
                  lastUpdated={lastUpdated}
                  hasNewData={hasNewData}
                />
              </div>
            </div>

            <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-white p-5">
              <div className="mb-4">
                <QuickRanges from={from} to={to} setFrom={setFrom} setTo={setTo} />
              </div>
              
              <div className="mb-4 rounded-xl border border-purple-200/40 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                    {filtersT("active.title")}
                  </span>
                  <span className="text-xs text-slate-500" aria-live="polite">
                    {filtersSummaryText}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                {activeFilters.length ? (
                  activeFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={filter.onClear}
                      className="group inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-white px-3 py-1 text-xs font-medium text-brand-primary transition hover:border-brand-primary/60 hover:bg-brand-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
                      aria-label={`${filtersT("active.clear")} ${filter.label}`}
                    >
                      <span>{filter.label}</span>
                      <X
                        className="h-3.5 w-3.5 text-brand-primary/60 transition group-hover:text-brand-primary"
                        aria-hidden="true"
                      />
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">{filtersT("active.none")}</span>
                )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-primary/80">
                  {filtersT("from")}
                </label>
                <input
                  type="date"
                  className={controlClass}
                  value={from}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-primary/80">
                  {filtersT("to")}
                </label>
                <input
                  type="date"
                  className={controlClass}
                  value={to}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-primary/80">
                  {filtersT("orderBy.label")}
                </label>
                <select
                  className={controlClass}
                  value={orderKey}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setOrderKey(e.target.value as OrderKey)
                  }
                >
                  <option value="createdAt">{filtersT("orderBy.createdAt")}</option>
                  <option value="totalAmount">{filtersT("orderBy.totalAmount")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-primary/80">
                  {filtersT("direction.label")}
                </label>
                <select
                  className={controlClass}
                  value={orderDir}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setOrderDir(e.target.value as OrderDir)
                  }
                >
                  <option value="desc">{filtersT("direction.desc")}</option>
                  <option value="asc">{filtersT("direction.asc")}</option>
                </select>
              </div>
              {isSuperAdmin ? (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-primary/80">
                    {filtersT("team.label")}
                  </label>
                  <select
                    className={controlClass}
                    value={teamFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTeamFilter(e.target.value)}
                  >
                    <option value="">{filtersT("team.all")}</option>
                    {visibleTeams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-primary/80">
                  {filtersT("country.label")}
                </label>
                <select
                  className={controlClass}
                  value={countryFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountryFilter(e.target.value)}
                >
                  <option value="">{filtersT("country.all")}</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-primary/80">
                  {filtersT("user.label")}
                </label>
                <select
                  className={controlClass}
                  value={userFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUserFilter(e.target.value)}
                  disabled={role === "usuario"}
                >
                  <option value="">
                    {role === "usuario" ? currentEmail : filtersT("user.all")}
                  </option>
                  {(role === "usuario" ? [currentEmail] : userOptions).map((email) =>
                    email ? (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ) : null,
                  )}
                </select>
              </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-end xl:col-span-2">
                  <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={() => {
                      setFrom("");
                      setTo("");
                      setTeamFilter("");
                      setCountryFilter("");
                      setUserFilter("");
                      setOrderKey("createdAt");
                      setOrderDir("desc");
                      setTopN(20);
                      setShowAll(false);
                      toast.info(toastT("reset"));
                    }}
                  >
                    {actionsT("reset")}
                  </button>
                  <button
                    type="button"
                    className={primaryButtonClass}
                    onClick={exportFilteredProposalsCsv}
                  >
                    {actionsT("exportFiltered")}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== TIER 2: KEY METRICS ==================== */}
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur-sm">
            <div className="mb-5">
              <h2 className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-lg font-bold uppercase tracking-wide text-transparent">
                {kpisT("title") || "Key Metrics"}
              </h2>
            </div>

            {/* Row 1: 3 Primary KPIs */}
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <EnhancedGlassKpi
                label={kpisT("generated")}
                value={String(subset.length)}
                sparklineData={sparklineSubsetCount}
                onClick={() =>
                  openDrillDown("All Proposals", subset, [
                    { key: "companyName", label: "Company" },
                    { key: "totalAmount", label: "Amount", format: (v) => formatUSD(Number(v)) },
                    { key: "status", label: "Status" },
                    { key: "createdAt", label: "Created", format: (v) => typeof v === 'string' || typeof v === 'number' || v instanceof Date ? new Date(v).toLocaleDateString() : String(v) },
                  ])
                }
              />
              <EnhancedGlassKpi
                label={kpisT("uniqueUsers")}
                value={String(uniqueUsers)}
                sparklineData={sparklineUniqueUsers}
              />
              <EnhancedGlassKpi
                label={kpisT("uniqueCompanies")}
                value={String(uniqueCompanies)}
                sparklineData={sparklineUniqueCompanies}
              />
            </div>

            {/* Row 2: 3 Revenue KPIs */}
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <EnhancedGlassKpi
                label={kpisT("totalMonthly")}
                value={formatUSD(totalMonthly)}
                sparklineData={sparklineTotalMonthly}
              />
              <EnhancedGlassKpi
                label={kpisT("averagePerProposal")}
                value={formatUSD(avgPerProposal)}
                sparklineData={sparklineAvgPerProposal}
              />
              <EnhancedGlassKpi
                label={kpisT("wonCount")}
                value={String(wonCount)}
                sparklineData={sparklineWonCount}
                onClick={() =>
                  openDrillDown("Won Proposals", wonRows, [
                    { key: "companyName", label: "Company" },
                    { key: "totalAmount", label: "Amount", format: (v) => formatUSD(Number(v)) },
                    { key: "createdAt", label: "Created", format: (v) => typeof v === 'string' || typeof v === 'number' || v instanceof Date ? new Date(v).toLocaleDateString() : String(v) },
                  ])
                }
              />
            </div>

            {/* Row 3: 3 Won Metrics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <EnhancedGlassKpi
                label={kpisT("wonAmount")}
                value={formatUSD(wonAmount)}
                sparklineData={sparklineWonAmount}
              />
              <EnhancedGlassKpi
                label={kpisT("winRate")}
                value={`${winRate.toFixed(1)}%`}
                sparklineData={sparklineWinRate}
              />
              <EnhancedGlassKpi
                label={kpisT("wonAverageTicket")}
                value={formatUSD(wonAvgTicket)}
                sparklineData={sparklineWonAvgTicket}
              />
            </div>
            </section>

          {/* ==================== TIER 3: DEEP DIVE ANALYSIS ==================== */}
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur-sm">
            <div className="mb-5">
              <h2 className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-lg font-bold uppercase tracking-wide text-transparent">
                {sectionsT("deepDive") || "Deep Dive Analysis"}
              </h2>
            </div>

            {/* FULL WIDTH: Tables stacked vertically */}
            <div className="space-y-6">
          <TableCard
            title={sectionsT("bySku.title")}
            actions={
              <>
                <button
                  type="button"
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 ${
                    showAll
                      ? "border-brand-primary bg-brand-primary text-white shadow-inner"
                      : "border-brand-primary/30 bg-white text-brand-primary hover:border-brand-primary/50 hover:bg-brand-primary/5"
                  }`}
                  onClick={() => setShowAll((prev) => !prev)}
                  title={actionsT("showAllTitle")}
                >
                  {actionsT("showAll")}
                </button>
                <div className="inline-flex items-center gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-brand-primary/70">
                    {actionsT("topN")}
                  </span>
                  <select
                    value={topN}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setTopN(Number(e.target.value))
                    }
                    className={pillSelectClass}
                    title={actionsT("topNTitle")}
                    disabled={showAll}
                  >
                    {[5, 10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={exportSkuCsv}
                  title={actionsT("csvTooltip")}
                >
                  {actionsT("csvButton")}
                </button>
              </>
            }
          >
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-primary/70">
                    {tableT("sku.headers.sku")}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-primary/70">
                    {tableT("sku.headers.item")}
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-brand-primary/70">
                    {tableT("sku.headers.quantity")}
                  </th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton rows={3} cols={3} />
              ) : (
                <tbody className="divide-y divide-slate-200">
                  {bySku.map(([sku, info]) => {
                    const { display } = getDisplayedSkuQuantity(sku, info.name, info.qty);
                    return (
                      <tr
                        key={sku}
                        className="cursor-pointer transition-colors hover:bg-purple-50"
                        onClick={() => {
                          const skuProposals = subset.filter((p) =>
                            p.items?.some((item: any) => item.itemCode === sku) ?? false
                          );
                          openDrillDown(`Proposals with SKU: ${sku} (${info.name})`, skuProposals, [
                            { key: "companyName", label: "Company" },
                            { key: "totalAmount", label: "Amount", format: (v) => formatUSD(Number(v)) },
                            { key: "country", label: "Country" },
                            { key: "status", label: "Status" },
                            { key: "userEmail", label: "User" },
                            { key: "createdAt", label: "Created", format: (v) => typeof v === 'string' || typeof v === 'number' || v instanceof Date ? new Date(v).toLocaleDateString() : String(v) },
                          ]);
                        }}
                      >
                        <td className="px-5 py-3 font-mono text-sm text-slate-500">{sku}</td>
                        <td className="px-5 py-3 text-slate-600">{info.name}</td>
                        <td className="px-5 py-3 text-right text-brand-primary font-semibold">{display}</td>
                      </tr>
                    );
                  })}
                  {!loading && bySku.length === 0 && (
                    <tr>
                      <td className="px-5 py-3 text-center text-sm text-slate-500" colSpan={3}>
                        {tableT("empty")}
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </TableCard>

          <TableCard
            title={sectionsT("byCountry.title")}
            actions={
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={exportCountryCsv}
                title={actionsT("csvTooltip")}
              >
                {actionsT("csvButton")}
              </button>
            }
          >
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-primary/70">
                    {tableT("country.headers.country")}
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-brand-primary/70">
                    {tableT("country.headers.quantity")}
                  </th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton rows={3} cols={2} />
              ) : (
                <tbody className="divide-y divide-slate-200">
                  {byCountry.map(([country, total]) => (
                    <tr
                      key={country}
                      className="cursor-pointer transition-colors hover:bg-purple-50"
                      onClick={() => {
                        const countryProposals = subset.filter((p) => p.country === country);
                        openDrillDown(`Proposals from ${country}`, countryProposals, [
                          { key: "companyName", label: "Company" },
                          { key: "totalAmount", label: "Amount", format: (v) => formatUSD(Number(v)) },
                          { key: "status", label: "Status" },
                          { key: "userEmail", label: "User" },
                          { key: "createdAt", label: "Created", format: (v) => typeof v === 'string' || typeof v === 'number' || v instanceof Date ? new Date(v).toLocaleDateString() : String(v) },
                        ]);
                      }}
                    >
                      <td className="px-5 py-3 text-slate-600">
                        {country}{" "}
                        <span className="text-xs text-slate-400">({countryIdFromName(country)})</span>
                      </td>
                      <td className="px-5 py-3 text-right text-brand-primary font-semibold">{total}</td>
                    </tr>
                  ))}
                  {!loading && byCountry.length === 0 && (
                    <tr>
                      <td className="px-5 py-3 text-center text-sm text-slate-500" colSpan={2}>
                        {tableT("empty")}
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
            {!loading && byCountryFull.length > 0 && (
              <div className="border-t border-slate-200 px-5 py-3 text-xs text-brand-primary/70">
                {showAll
                  ? tableT("country.footer.showAll", { count: byCountryFull.length })
                  : tableT("country.footer.total", { count: byCountryFull.length })}
              </div>
            )}
                </TableCard>

                <TableCard
                  title={sectionsT("byUser.title")}
                  actions={
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={exportUserCsv}
                      title={actionsT("csvTooltip")}
                    >
                      {actionsT("csvButton")}
                    </button>
                  }
                >
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead>
                      <tr>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-primary/70">
                          {tableT("user.headers.user")}
                        </th>
                        <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-brand-primary/70">
                          {tableT("user.headers.proposals")}
                        </th>
                      </tr>
                    </thead>
                    {loading ? (
                      <TableSkeleton rows={3} cols={2} />
                    ) : (
                      <tbody className="divide-y divide-slate-200">
                        {byUser.map(([email, total]) => (
                          <tr key={email}>
                            <td className="px-5 py-3 text-slate-600">{email}</td>
                            <td className="px-5 py-3 text-right text-brand-primary font-semibold">{total}</td>
                          </tr>
                        ))}
                        {!loading && byUser.length === 0 && (
                          <tr>
                            <td className="px-5 py-3 text-center text-sm text-slate-500" colSpan={2}>
                              {tableT("empty")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    )}
                  </table>
                </TableCard>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
