// src/app/components/features/proposals/Stats.tsx
"use client";

import React, { useMemo, useState, useEffect, useCallback, useId } from "react";
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
  currentWeekRange,
  prevWeekRange,
} from "./lib/dateRanges";
import { useTranslations } from "@/app/LanguageProvider";
import {
  fetchAllProposals,
  type ProposalsListMeta,
} from "./lib/proposals-response";
import { useAdminUsers } from "./hooks/useAdminUsers";

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

type MonthlyPerformancePoint = { label: string; proposals: number; amount: number };

function SparkAreaChart({
  data,
  countLabel,
  amountLabel,
}: {
  data: MonthlyPerformancePoint[];
  countLabel: string;
  amountLabel: string;
}) {
  const gradientId = useId();
  const lineGradientId = useId();
  const width = 640;
  const height = 240;
  const paddingX = 40;
  const paddingY = 28;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const amountMax = Math.max(...data.map((item) => item.amount), 1);
  const countMax = Math.max(...data.map((item) => item.proposals), 1);
  const step = data.length > 1 ? innerWidth / (data.length - 1) : 0;

  const amountPoints = data.map((item, index) => {
    const x = paddingX + index * step;
    const y =
      paddingY + innerHeight - (amountMax === 0 ? 0 : (item.amount / amountMax) * innerHeight);
    return { ...item, x, y };
  });

  const linePoints = data.map((item, index) => {
    const x = paddingX + index * step;
    const y =
      paddingY + innerHeight - (countMax === 0 ? 0 : (item.proposals / countMax) * innerHeight);
    return { ...item, x, y };
  });

  if (amountPoints.length === 0) {
    return null;
  }

  const areaPath = amountPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const closedAreaPath = `${areaPath} L ${amountPoints.at(-1)?.x ?? paddingX} ${height - paddingY} L ${
    amountPoints[0]?.x ?? paddingX
  } ${height - paddingY} Z`;

  const linePath = linePoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const axisY = height - paddingY;
  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[240px] w-full">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={lineGradientId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <g>
        <line
          x1={paddingX}
          y1={paddingY}
          x2={paddingX}
          y2={axisY}
          stroke="#E2E8F0"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
        <line
          x1={paddingX}
          y1={axisY}
          x2={width - paddingX}
          y2={axisY}
          stroke="#E2E8F0"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
        <path d={closedAreaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={`url(#${lineGradientId})`} strokeWidth={2.5} strokeLinecap="round" />
        {linePoints.map((point, index) => (
          <circle
            key={`line-${index}`}
            cx={point.x}
            cy={point.y}
            r={3.2}
            fill="#22D3EE"
            stroke="#ffffff"
            strokeWidth={1.4}
          />
        ))}
        {amountPoints.map((point, index) =>
          index % labelStep === 0 || index === amountPoints.length - 1 ? (
            <text
              key={`label-${index}`}
              x={point.x}
              y={axisY + 18}
              textAnchor="middle"
              className="fill-slate-400 text-[11px] capitalize"
            >
              {point.label}
            </text>
          ) : null,
        )}
      </g>
      <text x={paddingX} y={paddingY - 10} className="fill-slate-400 text-[11px] uppercase tracking-wide">
        {amountLabel}
      </text>
      <text
        x={width - paddingX}
        y={paddingY - 10}
        textAnchor="end"
        className="fill-slate-400 text-[11px] uppercase tracking-wide"
      >
        {countLabel}
      </text>
    </svg>
  );
}

type DonutDatum = { name: string; value: number; color: string };

function DonutChart({
  data,
  total,
  emptyMessage,
}: {
  data: DonutDatum[];
  total: number;
  emptyMessage: string;
}) {
  if (!data.length || total === 0) {
    return <ChartEmpty message={emptyMessage} />;
  }

  const radius = 70;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 sm:flex-row sm:items-stretch">
      <svg
        width={(radius + strokeWidth) * 2}
        height={(radius + strokeWidth) * 2}
        viewBox={`0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`}
        className="w-40 shrink-0"
      >
        <g transform={`translate(${radius + strokeWidth}, ${radius + strokeWidth})`}>
          <circle
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
          />
          {data.map((item) => {
            const dash = (item.value / total) * circumference;
            const dashOffset = accumulated;
            accumulated += dash;
            return (
              <circle
                key={item.name}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={-dashOffset}
                strokeLinecap="round"
              />
            );
          })}
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-brand-primary text-lg font-semibold"
          >
            {total.toLocaleString()}
          </text>
        </g>
      </svg>
      <div className="flex flex-1 flex-col justify-center gap-3 text-sm">
        {data.map((item) => {
          const percent = total ? (item.value / total) * 100 : 0;
          return (
            <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: item.color }}
                  aria-hidden="true"
                />
                <span className="text-slate-600">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-brand-primary">{item.value.toLocaleString()}</p>
                <p className="text-xs text-slate-400">{percent.toFixed(1)}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type HorizontalBarDatum = { name: string; value: number; helper?: string };

function HorizontalBarList({
  data,
  emptyMessage,
  formatValue = (value: number) => value.toLocaleString(),
}: {
  data: HorizontalBarDatum[];
  emptyMessage: string;
  formatValue?: (value: number) => string;
}) {
  if (!data.length) {
    return <ChartEmpty message={emptyMessage} />;
  }

  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percent = max === 0 ? 0 : (item.value / max) * 100;
        const color = chartPalette[index % chartPalette.length];
        return (
          <div key={item.name} className="space-y-2">
            <div className="flex items-baseline justify-between text-sm">
              <div>
                <p className="font-semibold text-slate-600">{item.name}</p>
                {item.helper ? <p className="text-[11px] uppercase tracking-wide text-slate-400">{item.helper}</p> : null}
              </div>
              <span className="text-sm font-semibold text-brand-primary">{formatValue(item.value)}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
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
  setFrom,
  setTo,
}: {
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
    "inline-flex items-center rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3 py-1 text-xs font-medium text-brand-primary transition hover:border-brand-primary/40 hover:bg-brand-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40";

  return (
    <div className="flex flex-wrap gap-2">
      {quarters.map((q) => (
        <button
          key={q.label}
          className={baseClass}
          onClick={() => apply(q.get())}
          title={t("quarterTooltip")}
          type="button"
        >
          {q.label}
        </button>
      ))}
      <button
        className={baseClass}
        onClick={() => apply(currentMonthRange())}
        type="button"
      >
        {t("currentMonth")}
      </button>
      <button
        className={baseClass}
        onClick={() => apply(prevMonthRange())}
        type="button"
      >
        {t("previousMonth")}
      </button>
      <button
        className={baseClass}
        onClick={() => apply(currentWeekRange())}
        type="button"
      >
        {t("currentWeek")}
      </button>
      <button
        className={baseClass}
        onClick={() => apply(prevWeekRange())}
        type="button"
      >
        {t("previousWeek")}
      </button>
    </div>
  );
}

type ProposalForStats = ProposalRecord & {
  items?: Array<{ sku: string; name: string; quantity: number }>;
};
type OrderKey = "createdAt" | "totalAmount";
type OrderDir = "asc" | "desc";

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

  // filtros
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { proposals, meta } = await fetchAllProposals();
      setAll(proposals);
      setListMeta(meta);
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
  }, [toastT]);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  useEffect(() => {
    const onRefresh = () => {
      load();
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

  /** Equipos visibles (con al menos 1 integrante) para el select de superadmin */
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

  const monthlyPerformance = useMemo(() => {
    const bucket = new Map<string, MonthlyPerformancePoint>();
    subset.forEach((proposal) => {
      const createdAt = new Date(proposal.createdAt as unknown as string);
      if (Number.isNaN(createdAt.getTime())) {
        return;
      }
      const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
      const label = createdAt.toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      });
      const current = bucket.get(key) ?? { label, proposals: 0, amount: 0 };
      current.proposals += 1;
      current.amount += Number(proposal.totalAmount) || 0;
      bucket.set(key, current);
    });
    return Array.from(bucket.entries())
      .sort(([keyA], [keyB]) => (keyA < keyB ? -1 : 1))
      .map(([, value]) => value);
  }, [subset]);

  const monthlyTrends = useMemo(() => {
    if (monthlyPerformance.length < 2) {
      return { count: null, amount: null, latestLabel: null };
    }
    const last = monthlyPerformance[monthlyPerformance.length - 1];
    const prev = monthlyPerformance[monthlyPerformance.length - 2];
    const computeTrend = (current: number, previous: number) => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return ((current - previous) / previous) * 100;
    };
    return {
      count: computeTrend(last.proposals, prev.proposals),
      amount: computeTrend(last.amount, prev.amount),
      latestLabel: last.label,
    };
  }, [monthlyPerformance]);

  const latestMonthly = monthlyPerformance.length
    ? monthlyPerformance[monthlyPerformance.length - 1]
    : null;

  const chartsEmptyLabel = chartsT("empty");
  const chartsOthersLabel = chartsT("others");
  const chartsUnknownStatus = chartsT("statusDistribution.unknown");

  const statusDistribution = useMemo(() => {
    const map = new Map<string, number>();
    subset.forEach((proposal) => {
      const raw = String(proposal.status || "").trim();
      const label = raw ? raw : chartsUnknownStatus;
      map.set(label, (map.get(label) ?? 0) + 1);
    });
    const sorted = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const head = sorted.slice(0, 4);
    const tailTotal = sorted.slice(4).reduce((acc, item) => acc + item.value, 0);
    if (tailTotal > 0) {
      head.push({ name: chartsOthersLabel, value: tailTotal });
    }
    return head;
  }, [subset, chartsOthersLabel, chartsUnknownStatus]);

  const statusDonutData = useMemo(() => {
    return statusDistribution.map((item, index) => ({
      ...item,
      color: chartPalette[index % chartPalette.length],
    }));
  }, [statusDistribution]);

  const formatTrend = useCallback(
    (value: number | null) => {
      if (value === null || Number.isNaN(value) || !Number.isFinite(value)) {
        return chartsT("trend.unavailable");
      }
      if (value > 0) {
        return chartsT("trend.positive", { value: value.toFixed(1) });
      }
      if (value < 0) {
        return chartsT("trend.negative", { value: Math.abs(value).toFixed(1) });
      }
      return chartsT("trend.equal");
    },
    [chartsT],
  );

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
    const items = bySku.slice(0, 6).map(([sku, info]) => ({
      name: info.name || sku,
      helper: sku,
      value: info.qty,
    }));
    if (!showAll && bySkuFull.length > 6) {
      const remaining = bySkuFull.slice(6).reduce((acc, [, info]) => acc + info.qty, 0);
      if (remaining > 0) {
        items.push({ name: chartsOthersLabel, value: remaining, helper: "" });
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

  return (
    <div className="p-4">
      <GradientShell>
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(60,3,140,0.12)]">
          <div className="flex flex-col gap-4">
            <div>
              <QuickRanges setFrom={setFrom} setTo={setTo} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-end">
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

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <GlassKpi label={kpisT("generated")} value={String(subset.length)} />
          <GlassKpi label={kpisT("uniqueUsers")} value={String(uniqueUsers)} />
          <GlassKpi label={kpisT("uniqueCompanies")} value={String(uniqueCompanies)} />
          <GlassKpi label={kpisT("totalMonthly")} value={formatUSD(totalMonthly)} />
          <GlassKpi label={kpisT("averagePerProposal")} value={formatUSD(avgPerProposal)} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <GlassKpi label={kpisT("wonCount")} value={String(wonCount)} />
          <GlassKpi label={kpisT("wonAmount")} value={formatUSD(wonAmount)} />
          <GlassKpi label={kpisT("winRate")} value={`${winRate.toFixed(1)}%`} />
          <GlassKpi label={kpisT("wonAverageTicket")} value={formatUSD(wonAvgTicket)} />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <ChartCard
              title={chartsT("monthlyPerformance.title")}
              description={chartsT("monthlyPerformance.description")}
              meta={
                monthlyPerformance.length ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {monthlyTrends.latestLabel ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-3 py-1 font-medium text-brand-primary">
                        {chartsT("monthlyPerformance.latestLabel", {
                          label: monthlyTrends.latestLabel,
                        })}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" aria-hidden="true" />
                      {chartsT("monthlyPerformance.countLabel")}
                      <span className="font-semibold text-brand-primary">{formatTrend(monthlyTrends.count)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
                      {chartsT("monthlyPerformance.amountLabel")}
                      <span className="font-semibold text-brand-primary">{formatTrend(monthlyTrends.amount)}</span>
                    </span>
                  </div>
                ) : null
              }
            >
              {loading ? (
                <ChartSkeleton />
              ) : monthlyPerformance.length ? (
                <>
                  <SparkAreaChart
                    data={monthlyPerformance}
                    countLabel={chartsT("monthlyPerformance.countLabel")}
                    amountLabel={chartsT("monthlyPerformance.amountLabel")}
                  />
                  {latestMonthly ? (
                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {chartsT("monthlyPerformance.countLabel")}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-brand-primary">
                          {latestMonthly.proposals.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {chartsT("monthlyPerformance.amountLabel")}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-brand-primary">
                          {formatUSD(latestMonthly.amount)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <ChartEmpty message={chartsEmptyLabel} />
              )}
            </ChartCard>
          </div>
          <div className="xl:col-span-5">
            <ChartCard
              title={chartsT("statusDistribution.title")}
              description={chartsT("statusDistribution.description")}
              meta={
                subset.length ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
                    {chartsT("statusDistribution.totalLabel", { total: subset.length.toLocaleString() })}
                  </span>
                ) : null
              }
            >
              {loading ? (
                <ChartSkeleton />
              ) : statusDonutData.length ? (
                <DonutChart data={statusDonutData} total={subset.length} emptyMessage={chartsEmptyLabel} />
              ) : (
                <ChartEmpty message={chartsEmptyLabel} />
              )}
            </ChartCard>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-6">
            <ChartCard
              title={chartsT("countryLeaderboard.title")}
              description={chartsT("countryLeaderboard.description")}
            >
              {loading ? (
                <ChartSkeleton />
              ) : (
                <HorizontalBarList data={countryChartData} emptyMessage={chartsEmptyLabel} />
              )}
            </ChartCard>
          </div>
          <div className="xl:col-span-6">
            <ChartCard
              title={chartsT("skuMomentum.title")}
              description={chartsT("skuMomentum.description")}
            >
              {loading ? (
                <ChartSkeleton />
              ) : (
                <HorizontalBarList data={skuChartData} emptyMessage={chartsEmptyLabel} />
              )}
            </ChartCard>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
                  {bySku.map(([sku, info]) => (
                    <tr key={sku}>
                      <td className="px-5 py-3 font-mono text-sm text-slate-500">{sku}</td>
                      <td className="px-5 py-3 text-slate-600">{info.name}</td>
                      <td className="px-5 py-3 text-right text-brand-primary font-semibold">{info.qty}</td>
                    </tr>
                  ))}
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
                    <tr key={country}>
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
        </section>

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
      </GradientShell>
    </div>
  );
}
