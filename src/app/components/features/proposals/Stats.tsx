// src/app/components/features/proposals/Stats.tsx
"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import type { ProposalRecord } from "@/lib/types";
import type { AppRole } from "@/constants/teams";
import { countryIdFromName } from "./lib/catalogs";
import { buildCsv, downloadCsv } from "./lib/csv";
import { TableSkeletonRows } from "@/app/components/ui/Skeleton";
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

/** Header full-bleed como en Objetivos */
function PageHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 h-12 flex items-center text-white font-semibold bg-[#4c1d95] rounded-t-2xl">
      {children}
    </div>
  );
}

/** Encabezado de sección (tablas) igual a Objetivos */
function SectionHeader({
  title,
  actions,
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="px-4 h-12 flex items-center justify-between text-white font-semibold bg-[#4c1d95] rounded-t-2xl">
      <span className="truncate">{title}</span>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** KPI tipo “glass” como GoalKpi (Objetivos) */
function VioletKpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] text-white px-4 py-3 shadow-[0_6px_18px_rgba(76,29,149,0.25)]">
      <div className="text-[12px] opacity-90">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
      {hint ? <div className="text-[11px] opacity-80 mt-1">{hint}</div> : null}
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

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {quarters.map((q) => (
        <button
          key={q.label}
          className="btn-ghost !py-1"
          onClick={() => apply(q.get())}
          title={t("quarterTooltip")}
        >
          {q.label}
        </button>
      ))}
      <button className="btn-ghost !py-1" onClick={() => apply(currentMonthRange())}>
        {t("currentMonth")}
      </button>
      <button className="btn-ghost !py-1" onClick={() => apply(prevMonthRange())}>
        {t("previousMonth")}
      </button>
      <button className="btn-ghost !py-1" onClick={() => apply(currentWeekRange())}>
        {t("currentWeek")}
      </button>
      <button className="btn-ghost !py-1" onClick={() => apply(prevWeekRange())}>
        {t("previousWeek")}
      </button>
    </div>
  );
}

type AdminUserRow = { email: string | null; role: AppRole; team: string | null };
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
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  useEffect(() => {
    if (isSuperAdmin || role === "lider") {
      fetch("/api/admin/users", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .then((rows: AdminUserRow[]) => setAdminUsers(rows))
        .catch(() => setAdminUsers([]));
    }
  }, [isSuperAdmin, role]);
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

  // textura suave como en Objetivos
  const textureStyle: React.CSSProperties = {
    backgroundColor: "#f8f5ff",
    backgroundImage:
      "radial-gradient( rgba(76,29,149,0.06) 1px, transparent 1px ), radial-gradient( rgba(76,29,149,0.04) 1px, transparent 1px )",
    backgroundSize: "16px 16px, 24px 24px",
    backgroundPosition: "0 0, 8px 8px",
    borderRadius: "12px",
  };

  return (
    <div className="p-4" style={textureStyle}>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <PageHeader>{t("title")}</PageHeader>

        <div className="p-3">
          {/* Rango rápido */}
          <QuickRanges setFrom={setFrom} setTo={setTo} />

          {/* Filtros */}
          <div className="rounded-md border-2 bg-white p-3 shadow-soft">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-end">
              {/* fechas */}
              <div className="xl:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">{filtersT("from")}</label>
                <input
                  type="date"
                  className="input"
                  value={from}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
                />
              </div>
              <div className="xl:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">{filtersT("to")}</label>
                <input
                  type="date"
                  className="input"
                  value={to}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
                />
              </div>

              {/* equipo (solo superadmin) con filtro de equipos vacíos */}
              {isSuperAdmin ? (
                <div className="xl:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">{filtersT("team.label")}</label>
                  <select
                    className="select"
                    value={teamFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTeamFilter(e.target.value)}
                  >
                    <option value="">{filtersT("team.all")}</option>
                    {visibleTeams.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="xl:col-span-2" />
              )}

              {/* país */}
              <div className="xl:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">{filtersT("country.label")}</label>
                <select
                  className="select"
                  value={countryFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountryFilter(e.target.value)}
                >
                  <option value="">{filtersT("country.all")}</option>
                  {countryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* usuario */}
              <div className="xl:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">{filtersT("user.label")}</label>
                <select
                  className="select"
                  value={userFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUserFilter(e.target.value)}
                  disabled={role === "usuario"}
                >
                  <option value="">
                    {role === "usuario" ? currentEmail : filtersT("user.all")}
                  </option>
                  {(role === "usuario" ? [currentEmail] : userOptions).map((u) =>
                    u ? (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ) : null
                  )}
                </select>
              </div>

              {/* ordenar / dirección */}
              <div className="xl:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">{filtersT("orderBy.label")}</label>
                <select
                  className="select"
                  value={orderKey}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setOrderKey(e.target.value as OrderKey)
                  }
                >
                  <option value="createdAt">{filtersT("orderBy.createdAt")}</option>
                  <option value="totalAmount">{filtersT("orderBy.totalAmount")}</option>
                </select>
              </div>
              <div className="xl:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">{filtersT("direction.label")}</label>
                <select
                  className="select"
                  value={orderDir}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setOrderDir(e.target.value as OrderDir)
                  }
                >
                  <option value="desc">{filtersT("direction.desc")}</option>
                  <option value="asc">{filtersT("direction.asc")}</option>
                </select>
              </div>

              {/* acciones */}
              <div className="xl:col-span-2 flex gap-2">
                <button
                  className="btn-bar w-full transition hover:bg-[rgb(var(--primary))]/90"
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
                <button className="btn-bar w-full" onClick={exportFilteredProposalsCsv}>
                  {actionsT("exportFiltered")}
                </button>
              </div>
            </div>
          </div>

          {/* KPIs (primera fila) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 my-4">
            <VioletKpi label={kpisT("generated")} value={String(subset.length)} />
            <VioletKpi label={kpisT("uniqueUsers")} value={String(uniqueUsers)} />
            <VioletKpi label={kpisT("uniqueCompanies")} value={String(uniqueCompanies)} />
            <VioletKpi label={kpisT("totalMonthly")} value={formatUSD(totalMonthly)} />
            <VioletKpi label={kpisT("averagePerProposal")} value={formatUSD(avgPerProposal)} />
          </div>

          {/* KPIs WON (segunda fila) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <VioletKpi label={kpisT("wonCount")} value={String(wonCount)} />
            <VioletKpi label={kpisT("wonAmount")} value={formatUSD(wonAmount)} />
            <VioletKpi label={kpisT("winRate")} value={`${winRate.toFixed(1)}%`} />
            <VioletKpi label={kpisT("wonAverageTicket")} value={formatUSD(wonAvgTicket)} />
          </div>

          {/* Grillas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Ítems por SKU */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <SectionHeader
                title={sectionsT("bySku.title")}
                actions={
                  <div className="flex items-center gap-3">
                    <label
                      className="inline-flex items-center gap-2 text-[12px] text-white/90"
                      title={actionsT("showAllTitle")}
                    >
                      <input
                        type="checkbox"
                        checked={showAll}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowAll(e.target.checked)}
                      />
                      {actionsT("showAll")}
                    </label>
                    <div className="inline-flex items-center gap-1">
                      <span className="text-[12px] text-white/90">{actionsT("topN")}</span>
                      <select
                        value={topN}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setTopN(Number(e.target.value))
                        }
                        className="h-8 text-xs rounded border border-white/40 bg-white/10 text-white px-2 py-1
                                   focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/60 disabled:opacity-50"
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
                      className="btn-ghost !py-1"
                      onClick={exportSkuCsv}
                      title={actionsT("csvTooltip")}
                    >
                      {actionsT("csvButton")}
                    </button>
                  </div>
                }
              />
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="table-th">{tableT("sku.headers.sku")}</th>
                    <th className="table-th">{tableT("sku.headers.item")}</th>
                    <th className="table-th w-40 text-right">{tableT("sku.headers.quantity")}</th>
                  </tr>
                </thead>
                {loading ? (
                  <TableSkeletonRows rows={3} cols={3} />
                ) : (
                  <tbody>
                    {bySku.map(([sku, info]) => (
                      <tr key={sku}>
                        <td className="table-td">
                          <span className="text-gray-500 font-mono">{sku}</span>
                        </td>
                        <td className="table-td">{info.name}</td>
                        <td className="table-td text-right font-semibold">{info.qty}</td>
                      </tr>
                    ))}
                    {!loading && bySku.length === 0 && (
                      <tr>
                        <td className="table-td text-center text-gray-500" colSpan={3}>
                          {tableT("empty")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                )}
              </table>
            </div>

            {/* Propuestas por país */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <SectionHeader
                title={sectionsT("byCountry.title")}
                actions={
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-ghost !py-1"
                      onClick={exportCountryCsv}
                      title={actionsT("csvTooltip")}
                    >
                      {actionsT("csvButton")}
                    </button>
                  </div>
                }
              />
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="table-th">{tableT("country.headers.country")}</th>
                    <th className="table-th w-40 text-right">{tableT("country.headers.quantity")}</th>
                  </tr>
                </thead>
                {loading ? (
                  <TableSkeletonRows rows={3} cols={2} />
                ) : (
                  <tbody>
                    {byCountry.map(([c, n]) => (
                      <tr key={c}>
                        <td className="table-td">
                          {c}{" "}
                          <span className="text-xs text-gray-500">({countryIdFromName(c)})</span>
                        </td>
                        <td className="table-td text-right font-semibold">{n}</td>
                      </tr>
                    ))}
                    {!loading && byCountry.length === 0 && (
                      <tr>
                        <td className="table-td text-center text-gray-500" colSpan={2}>
                          {tableT("empty")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                )}
              </table>

              {!loading && byCountryFull.length > 0 && (
                <div className="px-3 py-2 text-sm text-gray-600">
                  {showAll
                    ? tableT("country.footer.showAll", { count: byCountryFull.length })
                    : tableT("country.footer.total", { count: byCountryFull.length })}
                </div>
              )}
            </div>
          </div>

          {/* Top usuarios */}
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden mt-6">
            <SectionHeader
              title={sectionsT("byUser.title")}
              actions={
                <button
                  className="btn-ghost !py-1"
                  onClick={exportUserCsv}
                  title={actionsT("csvTooltip")}
                >
                  {actionsT("csvButton")}
                </button>
              }
            />
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="table-th">{tableT("user.headers.user")}</th>
                  <th className="table-th w-40 text-right">{tableT("user.headers.proposals")}</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeletonRows rows={3} cols={2} />
              ) : (
                <tbody>
                  {byUser.map(([email, n]) => (
                    <tr key={email}>
                      <td className="table-td">{email}</td>
                      <td className="table-td text-right font-semibold">{n}</td>
                    </tr>
                  ))}
                  {!loading && byUser.length === 0 && (
                    <tr>
                      <td className="table-td text-center text-gray-500" colSpan={2}>
                        {tableT("empty")}
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
