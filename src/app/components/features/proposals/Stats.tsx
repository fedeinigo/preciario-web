// src/app/components/features/proposals/Stats.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
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
          title="Aplicar rango del trimestre"
        >
          {q.label}
        </button>
      ))}
      <button className="btn-ghost !py-1" onClick={() => apply(currentMonthRange())}>
        Mes actual
      </button>
      <button className="btn-ghost !py-1" onClick={() => apply(prevMonthRange())}>
        Mes anterior
      </button>
      <button className="btn-ghost !py-1" onClick={() => apply(currentWeekRange())}>
        Semana actual
      </button>
      <button className="btn-ghost !py-1" onClick={() => apply(prevWeekRange())}>
        Semana anterior
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

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/proposals", { cache: "no-store" });
      if (!r.ok) {
        toast.error("No se pudieron cargar las propuestas");
        setAll([]);
      } else {
        setAll((await r.json()) as ProposalForStats[]);
      }
    } catch {
      toast.error("Error de red al cargar propuestas");
      setAll([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

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

  const byUserFull: Array<[string, number]> = useMemo(
    () =>
      Object.entries(
        subset.reduce<Record<string, number>>((acc, p) => {
          const key = p.userEmail || "(sin email)";
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1]),
    [subset]
  );

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
    const headers = ["SKU", "Ítem", "Cantidad total"];
    const rows = bySkuFull.map(([sku, info]) => [sku, info.name, info.qty]);
    downloadCsv("stats_por_sku.csv", buildCsv(headers, rows));
    toast.success("CSV de Ítems descargado");
  };
  const exportCountryCsv = () => {
    const headers = ["País", "Cantidad"];
    const rows = byCountryFull.map(([c, n]) => [c, n]);
    downloadCsv("stats_por_pais.csv", buildCsv(headers, rows));
    toast.success("CSV por País descargado");
  };
  const exportUserCsv = () => {
    const headers = ["Usuario (email)", "Propuestas"];
    const rows = byUserFull.map(([u, n]) => [u, n]);
    downloadCsv("stats_por_usuario.csv", buildCsv(headers, rows));
    toast.success("CSV por Usuario descargado");
  };
  const exportFilteredProposalsCsv = () => {
    const headers = ["ID", "Empresa", "País", "Usuario", "Mensual", "Horas", "OneShot", "Creado", "URL"];
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
    downloadCsv("propuestas_filtradas.csv", buildCsv(headers, rows));
    toast.success("CSV de propuestas filtradas descargado");
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
        <PageHeader>Estadísticas</PageHeader>

        <div className="p-3">
          {/* Rango rápido */}
          <QuickRanges setFrom={setFrom} setTo={setTo} />

          {/* Filtros */}
          <div className="rounded-md border-2 bg-white p-3 shadow-soft">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-end">
              {/* fechas */}
              <div className="xl:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Desde</label>
                <input
                  type="date"
                  className="input"
                  value={from}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
                />
              </div>
              <div className="xl:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Hasta</label>
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
                  <label className="block text-xs text-gray-600 mb-1">Equipo</label>
                  <select
                    className="select"
                    value={teamFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTeamFilter(e.target.value)}
                  >
                    <option value="">Todos</option>
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
                <label className="block text-xs text-gray-600 mb-1">País</label>
                <select
                  className="select"
                  value={countryFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountryFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  {countryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* usuario */}
              <div className="xl:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Usuario</label>
                <select
                  className="select"
                  value={userFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUserFilter(e.target.value)}
                  disabled={role === "usuario"}
                >
                  <option value="">{role === "usuario" ? currentEmail : "Todos"}</option>
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
                <label className="block text-xs text-gray-600 mb-1">Ordenar por</label>
                <select
                  className="select"
                  value={orderKey}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setOrderKey(e.target.value as OrderKey)
                  }
                >
                  <option value="createdAt">Fecha de creación</option>
                  <option value="totalAmount">Monto mensual</option>
                </select>
              </div>
              <div className="xl:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Dirección</label>
                <select
                  className="select"
                  value={orderDir}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setOrderDir(e.target.value as OrderDir)
                  }
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
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
                    toast.info("Filtros restablecidos");
                  }}
                >
                  Limpiar
                </button>
                <button className="btn-bar w-full" onClick={exportFilteredProposalsCsv}>
                  Exportar
                </button>
              </div>
            </div>
          </div>

          {/* KPIs (primera fila) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 my-4">
            <VioletKpi label="Propuestas generadas" value={String(subset.length)} />
            <VioletKpi label="Usuarios únicos" value={String(uniqueUsers)} />
            <VioletKpi label="Empresas distintas" value={String(uniqueCompanies)} />
            <VioletKpi label="Monto mensual total" value={formatUSD(totalMonthly)} />
            <VioletKpi label="Promedio por propuesta" value={formatUSD(avgPerProposal)} />
          </div>

          {/* KPIs WON (segunda fila) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <VioletKpi label="Propuestas WON" value={String(wonCount)} />
            <VioletKpi label="Monto WON" value={formatUSD(wonAmount)} />
            <VioletKpi label="Win rate" value={`${winRate.toFixed(1)}%`} />
            <VioletKpi label="Ticket promedio WON" value={formatUSD(wonAvgTicket)} />
          </div>

          {/* Grillas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Ítems por SKU */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <SectionHeader
                title="Ítems más cotizados (por SKU)"
                actions={
                  <div className="flex items-center gap-3">
                    <label
                      className="inline-flex items-center gap-2 text-[12px] text-white/90"
                      title="Ver todos los resultados"
                    >
                      <input
                        type="checkbox"
                        checked={showAll}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowAll(e.target.checked)}
                      />
                      Ver todo
                    </label>
                    <div className="inline-flex items-center gap-1">
                      <span className="text-[12px] text-white/90">Top N</span>
                      <select
                        value={topN}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setTopN(Number(e.target.value))
                        }
                        className="h-8 text-xs rounded border border-white/40 bg-white/10 text-white px-2 py-1
                                   focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/60 disabled:opacity-50"
                        title="Top N (agregados)"
                        disabled={showAll}
                      >
                        {[5, 10, 20, 50, 100].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button className="btn-ghost !py-1" onClick={exportSkuCsv} title="Descargar CSV completo">
                      CSV
                    </button>
                  </div>
                }
              />
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="table-th">SKU</th>
                    <th className="table-th">Ítem</th>
                    <th className="table-th w-40 text-right">Cantidad total</th>
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
                          Sin datos para los filtros seleccionados.
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
                title="Propuestas por país"
                actions={
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost !py-1" onClick={exportCountryCsv} title="Descargar CSV completo">
                      CSV
                    </button>
                  </div>
                }
              />
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="table-th">País</th>
                    <th className="table-th w-40 text-right">Cantidad</th>
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
                          Sin datos para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                )}
              </table>

              {!loading && byCountryFull.length > 0 && (
                <div className="px-3 py-2 text-sm text-gray-600">
                  {showAll ? `Mostrando todos (${byCountryFull.length})` : `Total países: ${byCountryFull.length}`}
                </div>
              )}
            </div>
          </div>

          {/* Top usuarios */}
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden mt-6">
            <SectionHeader
              title="Top usuarios por cantidad de propuestas"
              actions={
                <button className="btn-ghost !py-1" onClick={exportUserCsv} title="Descargar CSV completo">
                  CSV
                </button>
              }
            />
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="table-th">Usuario (email)</th>
                  <th className="table-th w-40 text-right">Propuestas</th>
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
                        Sin datos para los filtros seleccionados.
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
