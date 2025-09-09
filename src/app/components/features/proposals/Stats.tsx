// src/app/components/features/proposals/Stats.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import type { ProposalRecord } from "@/lib/types";
import { countryIdFromName } from "./lib/catalogs";
import type { AppRole } from "@/constants/teams";
import { Download, CalendarClock } from "lucide-react";
import { formatUSD } from "./lib/format";

type AdminUserRow = { email: string | null; role: AppRole; team: string | null };

type ProposalForStats = ProposalRecord & {
  items?: Array<{ sku: string; name: string; quantity: number }>;
};

type OrderKey = "createdAt" | "totalAmount";
type QuickRange = "today" | "last7" | "last30" | "thisMonth" | "prevMonth" | "ytd";

const TitleBar = ({ children }: { children: React.ReactNode }) => (
  <div className="heading-bar-sm">{children}</div>
);

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 bg-white px-4 py-3 rounded-[var(--radius)]">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-extrabold text-primary">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="heading-bar-sm">{title}</div>
      <div className="overflow-x-auto border-2 rounded-md">{children}</div>
    </div>
  );
}

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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [teamFilter, setTeamFilter] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");

  const [orderKey, setOrderKey] = useState<OrderKey>("createdAt");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("desc");

  const [all, setAll] = useState<ProposalForStats[]>([]);
  const load = async () => {
    const r = await fetch("/api/proposals", { cache: "no-store" });
    if (!r.ok) return setAll([]);
    setAll((await r.json()) as ProposalForStats[]);
  };
  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // emails -> team (para filtros por equipo)
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

  // equipos dinámicos para el filtro
  const [teams, setTeams] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/teams")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ name: string }>) => setTeams(rows.map((t) => t.name)))
      .catch(() => setTeams([]));
  }, []);

  // Opciones para País y Usuario (desde todos los registros)
  const countryOptions = useMemo(
    () =>
      Array.from(new Set(all.map((r) => r.country).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [all]
  );
  const userOptions = useMemo(
    () =>
      Array.from(
        new Set(
          all
            .map((r) => r.userEmail)
            .filter((v): v is string => typeof v === "string" && v.length > 0)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [all]
  );

  // Subset según rol + filtros + orden
  const subset = useMemo(() => {
    const f = all.filter((p) => {
      // alcance por rol/equipo
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

      // rango de fechas (inclusive)
      const ts = new Date(p.createdAt as unknown as string).getTime();
      const fts = from ? new Date(from).getTime() : -Infinity;
      const tts = to ? new Date(to).getTime() + 24 * 3600 * 1000 - 1 : Infinity;
      if (!(ts >= fts && ts <= tts)) return false;

      // filtros nuevos
      if (countryFilter && p.country !== countryFilter) return false;
      if (userFilter && (p.userEmail ?? "") !== userFilter) return false;

      return true;
    });

    const sorted = [...f].sort((a, b) => {
      if (orderKey === "createdAt") {
        const av = new Date(a.createdAt as unknown as string).getTime();
        const bv = new Date(b.createdAt as unknown as string).getTime();
        return orderDir === "asc" ? av - bv : bv - av;
      } else {
        const av = Number(a.totalAmount) || 0;
        const bv = Number(b.totalAmount) || 0;
        return orderDir === "asc" ? av - bv : bv - av;
      }
    });

    return sorted;
  }, [
    all,
    isSuperAdmin,
    role,
    leaderTeam,
    currentEmail,
    emailToTeam,
    teamFilter,
    from,
    to,
    orderKey,
    orderDir,
    countryFilter,
    userFilter,
  ]);

  // KPIs
  const proposalsCount = subset.length;
  const uniqueUsers = useMemo(() => new Set(subset.map((p) => p.userEmail)).size, [subset]);
  const uniqueCompanies = useMemo(() => new Set(subset.map((p) => p.companyName)).size, [subset]);
  const totalMonthly = useMemo(
    () => subset.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0),
    [subset]
  );
  const avgMonthly = proposalsCount ? totalMonthly / proposalsCount : 0;

  // Agregados
  const bySku = useMemo(
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
        }, {})
      ).sort((a, b) => b[1].qty - a[1].qty),
    [subset]
  );

  const byCountry = useMemo(
    () =>
      Object.entries(
        subset.reduce<Record<string, number>>((acc, p) => {
          acc[p.country] = (acc[p.country] ?? 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]),
    [subset]
  );

  const byUser = useMemo(
    () =>
      Object.entries(
        subset.reduce<Record<string, number>>((acc, p) => {
          const k = p.userEmail || "—";
          acc[k] = (acc[k] ?? 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]),
    [subset]
  );

  // Helpers UI
  const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const applyQuickRange = (q: QuickRange) => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);

    switch (q) {
      case "today":
        break;
      case "last7":
        start.setDate(start.getDate() - 6);
        break;
      case "last30":
        start.setDate(start.getDate() - 29);
        break;
      case "thisMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "prevMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end.setFullYear(start.getFullYear(), start.getMonth() + 1, 0);
        break;
      case "ytd":
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }

    setFrom(toISODate(start));
    setTo(toISODate(end));
  };

  const clearAll = () => {
    setFrom("");
    setTo("");
    setTeamFilter("");
    setCountryFilter("");
    setUserFilter("");
    setOrderKey("createdAt");
    setOrderDir("desc");
  };

  const exportCSV = () => {
    const header = [
      "id",
      "companyName",
      "country",
      "userEmail",
      "totalAmount",
      "totalHours",
      "createdAt",
      "docUrl",
    ];
    const rows = subset.map((p) => [
      p.id,
      p.companyName,
      p.country,
      p.userEmail ?? "",
      String(Number(p.totalAmount) || 0),
      String(Number(p.totalHours) || 0),
      new Date(p.createdAt as unknown as string).toISOString(),
      p.docUrl ?? "",
    ]);

    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((v) => {
            const s = String(v ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stats_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Totales para footers
  const totalCountries = byCountry.reduce((acc, [, n]) => acc + n, 0);
  const totalUsersRows = byUser.reduce((acc, [, n]) => acc + n, 0);
  const totalSkuQty = bySku.reduce((acc, [, info]) => acc + info.qty, 0);

  return (
    <div className="p-4">
      <div className="card border-2 overflow-hidden">
        <TitleBar>Estadísticas</TitleBar>

        <div className="p-3 space-y-6">
          {/* ===== Filtros ===== */}
          <div className="border-2 bg-white p-3 rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-8 xl:grid-cols-9 gap-3">
              {/* Fechas */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Desde</label>
                <div className="relative">
                  <input
                    type="date"
                    className="input pr-10"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                  <CalendarClock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                <div className="relative">
                  <input
                    type="date"
                    className="input pr-10"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                  <CalendarClock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Equipo (según rol) */}
              {(isSuperAdmin || role === "lider") && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Equipo</label>
                  <select
                    className="select"
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {teams.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* País */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">País</label>
                <select
                  className="select"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  {countryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Usuario */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Usuario</label>
                <select
                  className="select"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  {userOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Orden */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Ordenar por</label>
                <select
                  className="select"
                  value={orderKey}
                  onChange={(e) => setOrderKey(e.target.value as OrderKey)}
                >
                  <option value="createdAt">Fecha de creación</option>
                  <option value="totalAmount">Monto mensual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Dirección</label>
                <select
                  className="select"
                  value={orderDir}
                  onChange={(e) => setOrderDir(e.target.value as "asc" | "desc")}
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>

              {/* Acciones */}
              <div className="flex items-end gap-2">
                <button className="btn-ghost flex-1" onClick={clearAll}>
                  Limpiar
                </button>
                <button
                  className="btn-ghost flex-1"
                  onClick={exportCSV}
                  title="Exportar CSV (vista filtrada)"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </button>
              </div>
            </div>

            {/* Rangos rápidos */}
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                ["Hoy", "today"],
                ["Últ. 7 días", "last7"],
                ["Últ. 30 días", "last30"],
                ["Este mes", "thisMonth"],
                ["Mes pasado", "prevMonth"],
                ["YTD", "ytd"],
              ] as Array<[string, QuickRange]>).map(([label, key]) => (
                <button
                  key={key}
                  className="chip hover:opacity-80"
                  onClick={() => applyQuickRange(key as QuickRange)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ===== KPIs ===== */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard label="Propuestas generadas" value={String(proposalsCount)} />
            <StatCard label="Usuarios únicos" value={String(uniqueUsers)} />
            <StatCard label="Empresas distintas" value={String(uniqueCompanies)} />
            <StatCard label="Monto mensual total" value={formatUSD(totalMonthly)} />
            <StatCard label="Promedio por propuesta" value={formatUSD(avgMonthly)} />
          </div>

          {/* ===== Tablas en dos columnas ===== */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Section title="Ítems más cotizados (por SKU)">
              <table className="min-w-full bg-white text-sm">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="table-th py-1.5">SKU</th>
                    <th className="table-th py-1.5">Ítem</th>
                    <th className="table-th w-40 text-right py-1.5">Cantidad total</th>
                  </tr>
                </thead>
                <tbody>
                  {bySku.map(([sku, info], i) => (
                    <tr
                      key={sku}
                      className={i % 2 === 0 ? "bg-white" : "bg-[rgb(var(--primary-soft))]/40 hover:bg-white"}
                    >
                      <td className="table-td py-1.5">
                        <span className="text-gray-600 font-mono">{sku}</span>
                      </td>
                      <td className="table-td py-1.5">{info.name}</td>
                      <td className="table-td text-right font-semibold py-1.5">{info.qty}</td>
                    </tr>
                  ))}
                  {bySku.length === 0 && (
                    <tr>
                      <td className="table-td text-center text-gray-500 py-2" colSpan={3}>
                        Sin datos para el período seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
                {bySku.length > 0 && (
                  <tfoot>
                    <tr>
                      <td className="table-td py-1.5 text-muted" colSpan={2}>
                        Total SKUs: {bySku.length}
                      </td>
                      <td className="table-td py-1.5 text-right font-semibold">{totalSkuQty}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </Section>

            <Section title="Propuestas por país">
              <table className="min-w-full bg-white text-sm">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="table-th py-1.5">País</th>
                    <th className="table-th w-40 text-right py-1.5">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {byCountry.map(([c, n], i) => (
                    <tr
                      key={c}
                      className={i % 2 === 0 ? "bg-white" : "bg-[rgb(var(--primary-soft))]/40 hover:bg-white"}
                    >
                      <td className="table-td py-1.5">
                        {c} <span className="text-xs text-gray-500">({countryIdFromName(c)})</span>
                      </td>
                      <td className="table-td text-right font-semibold py-1.5">{n}</td>
                    </tr>
                  ))}
                  {byCountry.length === 0 && (
                    <tr>
                      <td className="table-td text-center text-gray-500 py-2" colSpan={2}>
                        Sin datos para el período seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
                {byCountry.length > 0 && (
                  <tfoot>
                    <tr>
                      <td className="table-td py-1.5 text-muted">Total países: {byCountry.length}</td>
                      <td className="table-td py-1.5 text-right font-semibold">{totalCountries}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </Section>
          </div>

          <Section title="Top usuarios por cantidad de propuestas">
            <table className="min-w-full bg-white text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="table-th py-1.5">Usuario (email)</th>
                  <th className="table-th w-40 text-right py-1.5">Propuestas</th>
                </tr>
              </thead>
              <tbody>
                {byUser.map(([email, count], i) => (
                  <tr
                    key={email}
                    className={i % 2 === 0 ? "bg-white" : "bg-[rgb(var(--primary-soft))]/40 hover:bg-white"}
                  >
                    <td className="table-td py-1.5">{email}</td>
                    <td className="table-td text-right font-semibold py-1.5">{count}</td>
                  </tr>
                ))}
                {byUser.length === 0 && (
                  <tr>
                    <td className="table-td text-center text-gray-500 py-2" colSpan={2}>
                      Sin datos para el período seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
              {byUser.length > 0 && (
                <tfoot>
                  <tr>
                    <td className="table-td py-1.5 text-muted">Total usuarios: {byUser.length}</td>
                    <td className="table-td py-1.5 text-right font-semibold">{totalUsersRows}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </Section>
        </div>
      </div>
    </div>
  );
}
