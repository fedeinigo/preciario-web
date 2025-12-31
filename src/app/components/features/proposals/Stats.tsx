// src/app/components/features/proposals/Stats.tsx
"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import type { AppRole } from "@/constants/teams";
import { countryIdFromName } from "./lib/catalogs";
import { buildCsv, downloadCsv } from "./lib/csv";
import { formatUSD, formatDateTime } from "./lib/format";
import { toast } from "@/app/components/ui/toast";
import { q1Range, q2Range, q3Range, q4Range, currentMonthRange, prevMonthRange } from "./lib/dateRanges";
import { useTranslations } from "@/app/LanguageProvider";
import {
  fetchAllProposals,
  fetchProposalStats,
  invalidateProposalsCache,
  type ProposalFilters,
  type ProposalStatsResponse,
} from "./lib/proposals-response";
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
  const [stats, setStats] = useState<ProposalStatsResponse | null>(null);
  const [baseStats, setBaseStats] = useState<ProposalStatsResponse | null>(null);
  const [hasNewData, setHasNewData] = useState(false);

  // drill-down modal state
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<{
    title: string;
    data: Array<Record<string, unknown>>;
    columns: Array<{ key: string; label: string; format?: (value: unknown) => string }>;
  } | null>(null);

  const scopeFilters = useMemo<ProposalFilters>(() => {
    if (role === "usuario") {
      return { userEmail: currentEmail || "__none__" };
    }
    if (role === "lider") {
      return { team: leaderTeam || "__none__" };
    }
    return {};
  }, [currentEmail, leaderTeam, role]);

  const baseFilters = useMemo<ProposalFilters>(() => ({}), []);

  const activeFilters = useMemo<ProposalFilters>(() => {
    const filters: ProposalFilters = { ...scopeFilters };
    if (from) filters.from = from;
    if (to) filters.to = to;
    if (countryFilter) filters.country = countryFilter;
    if (isSuperAdmin && teamFilter) filters.team = teamFilter;
    if (role !== "usuario" && userFilter) filters.userEmail = userFilter;
    return filters;
  }, [scopeFilters, from, to, countryFilter, isSuperAdmin, teamFilter, role, userFilter]);

  const statsKey = useMemo(() => JSON.stringify(activeFilters), [activeFilters]);
  const lastStatsKeyRef = useRef<string | null>(null);
  const lastTotalRef = useRef<number | null>(null);
  const apiSortKey = orderKey === "totalAmount" ? "monthly" : "created";

  const lastUpdated = useMemo(() => {
    if (!stats?.lastUpdated) return undefined;
    const parsed = new Date(stats.lastUpdated);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [stats]);

  type LoadOptions = { skipCache?: boolean };
  const load = useCallback(
    async (options?: LoadOptions) => {
      setLoading(true);
      try {
        const response = await fetchProposalStats(activeFilters, {
          skipCache: options?.skipCache ?? false,
        });
        const prevKey = lastStatsKeyRef.current;
        const prevTotal = lastTotalRef.current;

        if (prevKey && prevKey !== statsKey) {
          setHasNewData(false);
        } else if (
          prevTotal !== null &&
          response.kpis.totalCount > prevTotal &&
          !options?.skipCache
        ) {
          setHasNewData(true);
          setTimeout(() => setHasNewData(false), 5000);
        }

        lastStatsKeyRef.current = statsKey;
        lastTotalRef.current = response.kpis.totalCount;
        setStats(response);
      } catch (error) {
        setStats(null);
        const status =
          error instanceof Error && typeof (error as { status?: unknown }).status === "number"
            ? (error as { status?: number }).status
            : undefined;
        toast.error(toastT(status ? "loadError" : "networkError"));
      } finally {
        setLoading(false);
      }
    },
    [activeFilters, statsKey, toastT],
  );

  const loadBaseStats = useCallback(
    async (options?: LoadOptions) => {
      try {
        const response = await fetchProposalStats(baseFilters, {
          skipCache: options?.skipCache ?? false,
        });
        setBaseStats(response);
      } catch {
        setBaseStats(null);
      }
    },
    [baseFilters],
  );

  const handleManualRefresh = useCallback(async () => {
    invalidateProposalsCache();
    await Promise.all([load({ skipCache: true }), loadBaseStats({ skipCache: true })]);
    toast.success(toastT("refreshSuccess") || "Datos actualizados");
  }, [load, loadBaseStats, toastT]);

  const openDrillDown = useCallback(
    async (
      title: string,
      filters: ProposalFilters,
      columns: Array<{ key: string; label: string; format?: (value: unknown) => string }>,
    ) => {
      try {
        const { proposals } = await fetchAllProposals({
          filters,
          includeItems: false,
          sortKey: apiSortKey,
          sortDir: orderDir,
          skipCache: true,
        });
        setDrillDownData({ title, data: proposals, columns });
        setDrillDownOpen(true);
      } catch {
        toast.error(toastT("loadError"));
      }
    },
    [apiSortKey, orderDir, toastT],
  );

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

  const mapSparkline = useCallback(
    (points?: Array<{ date: string; value: number }>): SparklineData =>
      (points ?? []).map((point) => ({ value: point.value, label: point.date })),
    [],
  );

  const pathname = usePathname();
  useEffect(() => {
    load();
  }, [load, pathname]);

  useEffect(() => {
    setHasNewData(false);
  }, [statsKey]);

  useEffect(() => {
    setBaseStats(null);
    loadBaseStats();
  }, [loadBaseStats]);

  useEffect(() => {
    const onRefresh = () => {
      invalidateProposalsCache();
      load({ skipCache: true });
      loadBaseStats({ skipCache: true });
    };
    window.addEventListener("proposals:refresh", onRefresh as EventListener);
    return () => window.removeEventListener("proposals:refresh", onRefresh as EventListener);
  }, [load, loadBaseStats]);

  const { users: adminUsers } = useAdminUsers({
    isSuperAdmin,
    isLeader: role === "lider",
  });

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
    () =>
      (baseStats?.byCountry ?? stats?.byCountry ?? [])
        .map((row) => row.country)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [baseStats, stats],
  );
  const userOptions = useMemo(() => {
    const source = baseStats?.byUser ?? stats?.byUser ?? [];
    return source
      .map((row) => row.email)
      .filter((email): email is string => Boolean(email))
      .sort((a, b) => a.localeCompare(b));
  }, [baseStats, stats]);

  const kpis = stats?.kpis ?? {
    totalCount: 0,
    uniqueUsers: 0,
    uniqueCompanies: 0,
    totalMonthly: 0,
    avgPerProposal: 0,
    wonCount: 0,
    wonAmount: 0,
    winRate: 0,
    wonAvgTicket: 0,
  };

  const totalCount = kpis.totalCount;
  const uniqueUsers = kpis.uniqueUsers;
  const uniqueCompanies = kpis.uniqueCompanies;
  const totalMonthly = kpis.totalMonthly;
  const avgPerProposal = kpis.avgPerProposal;
  const wonCount = kpis.wonCount;
  const wonAmount = kpis.wonAmount;
  const winRate = kpis.winRate;
  const wonAvgTicket = kpis.wonAvgTicket;

  const bySkuFull: Array<[string, { name: string; qty: number }]> = useMemo(
    () =>
      (stats?.bySku ?? []).map((row) => [row.sku, { name: row.name, qty: row.qty }]),
    [stats],
  );

  const byCountryFull: Array<[string, number]> = useMemo(
    () => (stats?.byCountry ?? []).map((row) => [row.country, row.total]),
    [stats],
  );

  const byUserFull: Array<[string, number]> = useMemo(() => {
    const fallbackRaw = tableT("user.fallback");
    const fallbackKey = "proposals.stats.table.user.fallback";
    const fallback = fallbackRaw === fallbackKey ? "(sin email)" : fallbackRaw;
    return (stats?.byUser ?? []).map((row) => [row.email ?? fallback, row.total]);
  }, [stats, tableT]);

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
  const exportFilteredProposalsCsv = async () => {
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
    try {
      const { proposals } = await fetchAllProposals({
        filters: activeFilters,
        includeItems: false,
        sortKey: apiSortKey,
        sortDir: orderDir,
        skipCache: true,
      });
      const rows = proposals.map((p) => [
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
    } catch {
      toast.error(toastT("loadError"));
    }
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

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
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
    const filteredValue = totalCount.toLocaleString();
    const baseTotal = baseStats?.kpis.totalCount ?? totalCount;
    const totalValue = baseTotal.toLocaleString();
    const percentValue = summaryPercentFormatter.format(
      baseTotal ? (totalCount / baseTotal) * 100 : 0,
    );
    return filtersT("summary", {
      filtered: filteredValue,
      total: totalValue,
      percent: percentValue,
    });
  }, [baseStats, filtersT, summaryPercentFormatter, totalCount]);

  // Sparklines for all KPIs (30-day rolling window)
  const sparklineSubsetCount = useMemo(
    () => mapSparkline(stats?.sparklines.proposals),
    [mapSparkline, stats],
  );
  const sparklineTotalMonthly = useMemo(
    () => mapSparkline(stats?.sparklines.totalMonthly),
    [mapSparkline, stats],
  );
  const sparklineWonCount = useMemo(
    () => mapSparkline(stats?.sparklines.wonCount),
    [mapSparkline, stats],
  );
  const sparklineWonAmount = useMemo(
    () => mapSparkline(stats?.sparklines.wonAmount),
    [mapSparkline, stats],
  );
  const sparklineUniqueUsers = useMemo(
    () => mapSparkline(stats?.sparklines.uniqueUsers),
    [mapSparkline, stats],
  );
  const sparklineUniqueCompanies = useMemo(
    () => mapSparkline(stats?.sparklines.uniqueCompanies),
    [mapSparkline, stats],
  );
  const sparklineAvgPerProposal = useMemo(
    () => mapSparkline(stats?.sparklines.avgPerProposal),
    [mapSparkline, stats],
  );
  const sparklineWinRate = useMemo(
    () => mapSparkline(stats?.sparklines.winRate),
    [mapSparkline, stats],
  );
  const sparklineWonAvgTicket = useMemo(
    () => mapSparkline(stats?.sparklines.wonAvgTicket),
    [mapSparkline, stats],
  );

  return (
    <>
      <DrillDownModal
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={drillDownData?.title || ""}
        data={drillDownData?.data || []}
        columns={drillDownData?.columns || []}
      />
      
      <div className="relative min-h-screen overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-white to-slate-50 p-6">
        <div className="pointer-events-none absolute -top-28 right-0 h-72 w-72 rounded-full bg-purple-200/45 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-[1600px] space-y-6">
          
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
                {activeFilterChips.length ? (
                  activeFilterChips.map((filter) => (
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
                value={String(totalCount)}
                sparklineData={sparklineSubsetCount}
                onClick={() =>
                  openDrillDown("All Proposals", activeFilters, [
                    { key: "companyName", label: "Company" },
                    { key: "totalAmount", label: "Amount", format: (v) => formatUSD(Number(v)) },
                    { key: "status", label: "Status" },
                    {
                      key: "createdAt",
                      label: "Created",
                      format: (v) =>
                        typeof v === "string" || typeof v === "number" || v instanceof Date
                          ? new Date(v).toLocaleDateString()
                          : String(v),
                    },
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
                  openDrillDown("Won Proposals", { ...activeFilters, status: "WON" }, [
                    { key: "companyName", label: "Company" },
                    { key: "totalAmount", label: "Amount", format: (v) => formatUSD(Number(v)) },
                    {
                      key: "createdAt",
                      label: "Created",
                      format: (v) =>
                        typeof v === "string" || typeof v === "number" || v instanceof Date
                          ? new Date(v).toLocaleDateString()
                          : String(v),
                    },
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
                          openDrillDown(`Proposals with SKU: ${sku} (${info.name})`, { ...activeFilters, sku }, [
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
                        openDrillDown(`Proposals from ${country}`, { ...activeFilters, country }, [
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
