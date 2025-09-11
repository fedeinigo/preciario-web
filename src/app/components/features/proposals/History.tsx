// src/app/components/features/proposals/History.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ProposalRecord } from "@/lib/types";
import { formatUSD, formatDateTime } from "./lib/format";
import { buildCsv, downloadCsv } from "./lib/csv";
import { copyToClipboard } from "./lib/clipboard";
import { TableSkeletonRows } from "@/app/components/ui/Skeleton";
import { ExternalLink, Copy } from "lucide-react";
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

type AppRole = "superadmin" | "lider" | "usuario";
type AdminUserRow = { email: string | null; team: string | null; role?: AppRole };

type SortKey = "id" | "company" | "country" | "email" | "monthly" | "created";
type SortDir = "asc" | "desc";

/** Botonera de rangos rápidos */
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
        <button key={q.label} className="btn-ghost !py-1" onClick={() => apply(q.get())}>
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

export default function History({
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
  const [rows, setRows] = useState<ProposalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/proposals", { cache: "no-store" });
      setRows(r.ok ? ((await r.json()) as ProposalRecord[]) : []);
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

  // ==== datos auxiliares ====
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  useEffect(() => {
    if (isSuperAdmin || role === "lider") {
      fetch("/api/admin/users", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .then((u: AdminUserRow[]) => setAdminUsers(u))
        .catch(() => setAdminUsers([]));
    }
    fetch("/api/teams", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((t: Array<{ name: string }>) => setTeams(t.map((x) => x.name)))
      .catch(() => setTeams([]));
  }, [isSuperAdmin, role]);

  const emailToTeam = useMemo(() => {
    const m = new Map<string, string | null>();
    adminUsers.forEach((u) => {
      if (u.email) m.set(u.email, u.team);
    });
    return m;
  }, [adminUsers]);

  // opciones de país para filtro
  const countryOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.country).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  );

  // ==== filtros ====
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [idQuery, setIdQuery] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [emailQuery, setEmailQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // ==== orden por click + paginación ====
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const clearAll = () => {
    setTeamFilter("");
    setIdQuery("");
    setCompanyQuery("");
    setCountryFilter("");
    setEmailQuery("");
    setFrom("");
    setTo("");
    setSortKey("created");
    setSortDir("desc");
    setPage(1);
  };

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "created" ? "desc" : "asc");
    }
    setPage(1);
  };

  // ==== filtrado + orden ====
  const subset = useMemo(() => {
    const filtered = rows.filter((p) => {
      // alcance según rol
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

      // filtros de texto
      const idOk = !idQuery || p.id.toLowerCase().includes(idQuery.toLowerCase());
      const compOk =
        !companyQuery || p.companyName.toLowerCase().includes(companyQuery.toLowerCase());
      const emailOk =
        !emailQuery || (p.userEmail ?? "").toLowerCase().includes(emailQuery.toLowerCase());
      const countryOk = !countryFilter || p.country === countryFilter;

      // rango de fechas (inclusive)
      const ts = new Date(p.createdAt as unknown as string).getTime();
      const fromTs = from ? new Date(from).getTime() : -Infinity;
      const toTs = to ? new Date(to).getTime() + 24 * 3600 * 1000 - 1 : Infinity;
      const dateOk = ts >= fromTs && ts <= toTs;

      return idOk && compOk && emailOk && countryOk && dateOk;
    });

    const sorted = [...filtered].sort((a, b) => {
      const am = Number(a.totalAmount);
      const bm = Number(b.totalAmount);
      const ta = new Date(a.createdAt as unknown as string).getTime();
      const tb = new Date(b.createdAt as unknown as string).getTime();
      const dir = sortDir === "asc" ? 1 : -1;

      switch (sortKey) {
        case "id":
          return a.id.localeCompare(b.id) * dir;
        case "company":
          return a.companyName.localeCompare(b.companyName) * dir;
        case "country":
          return a.country.localeCompare(b.country) * dir;
        case "email":
          return (a.userEmail || "").localeCompare(b.userEmail || "") * dir;
        case "monthly":
          return (am - bm) * dir;
        case "created":
        default:
          return (ta - tb) * dir;
      }
    });

    return sorted;
  }, [
    rows,
    emailToTeam,
    currentEmail,
    leaderTeam,
    role,
    isSuperAdmin,
    // filtros
    teamFilter,
    idQuery,
    companyQuery,
    emailQuery,
    countryFilter,
    from,
    to,
    // orden
    sortKey,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(subset.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const paged = subset.slice(pageStart, pageStart + pageSize);

  // ==== CSV de la vista filtrada ====
  const downloadCurrentCsv = () => {
    const headers = ["ID", "Empresa", "País", "Email", "Mensual", "Creado", "URL"];
    const data = subset.map((p) => [
      p.id,
      p.companyName,
      p.country,
      p.userEmail || "",
      Number(p.totalAmount).toFixed(2),
      formatDateTime(p.createdAt as unknown as string),
      p.docUrl || "",
    ]);
    const csv = buildCsv(headers, data);
    downloadCsv("historico.csv", csv);
  };

  return (
    <div className="p-4">
      <div className="card border-2 overflow-hidden">
        <div className="heading-bar-sm flex items-center justify-between">
          <span>Histórico</span>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost !py-1"
              onClick={downloadCurrentCsv}
              title="Descargar CSV de la vista filtrada"
            >
              CSV
            </button>
            <button className="btn-ghost !py-1" onClick={load} title="Refrescar">
              Refrescar
            </button>
          </div>
        </div>

        <div className="p-3">
          {/* Rangos rápidos */}
          <QuickRanges setFrom={setFrom} setTo={setTo} />

          {/* Filtros avanzados */}
          {(isSuperAdmin || role === "lider") && (
            <div className="mb-3 grid grid-cols-1 md:grid-cols-6 gap-3">
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

              <div>
                <label className="block text-xs text-gray-600 mb-1">ID</label>
                <input
                  className="input"
                  placeholder="Buscar por ID"
                  value={idQuery}
                  onChange={(e) => setIdQuery(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Empresa</label>
                <input
                  className="input"
                  placeholder="Buscar empresa"
                  value={companyQuery}
                  onChange={(e) => setCompanyQuery(e.target.value)}
                />
              </div>

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

              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input
                  className="input"
                  placeholder="Buscar email"
                  value={emailQuery}
                  onChange={(e) => setEmailQuery(e.target.value)}
                />
              </div>

              <div className="flex items-end">
  <button
    className="btn-primary w-full transition hover:bg-[rgb(var(--primary))]/90"
    onClick={clearAll}
  >
    Limpiar
  </button>
</div>


            </div>
            
          )}

          {/* Rango de fechas */}
          <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Desde</label>
              <input
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            {/* espacio para ajustar layout */}
            <div className="hidden md:block" />
            <div className="hidden md:block" />
          </div>

          <div className="overflow-x-auto rounded-md border-2">
            <table className="min-w-full bg-white text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  {([
                    ["id", "ID"],
                    ["company", "Empresa"],
                    ["country", "País"],
                    ["email", "Email"],
                    ["monthly", "Mensual"],
                    ["created", "Creado"],
                    ["", "Acciones"],
                  ] as Array<[SortKey | "", string]>).map(([k, label], idx) => {
                    const clickable = k !== "";
                    const active = k === sortKey;
                    const dir = sortDir === "asc" ? "▲" : "▼";
                    return (
                      <th
                        key={idx}
                        className={`table-th ${
                          clickable ? "cursor-pointer select-none" : ""
                        } ${active ? "!text-white !bg-primary" : "!bg-primary !text-white"}`}
                        onClick={() => clickable && sortBy(k as SortKey)}
                        title={clickable ? "Ordenar" : ""}
                      >
                        {label} {active && dir}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {loading ? (
                <TableSkeletonRows rows={6} cols={7} />
              ) : (
                <tbody>
                  {paged.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-[rgb(var(--primary-soft))]/40"
                      } hover:bg-white`}
                    >
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <span className="font-mono truncate max-w-[260px]">{p.id}</span>
                          <button
                            className="btn-ghost px-2 py-1"
                            onClick={() => copyToClipboard(p.id)}
                            title="Copiar ID"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="table-td">{p.companyName}</td>
                      <td className="table-td">{p.country}</td>
                      <td className="table-td">{p.userEmail || "—"}</td>
                      <td className="table-td text-right font-semibold">
                        {formatUSD(Number(p.totalAmount) || 0)}
                      </td>
                      <td className="table-td whitespace-nowrap">
                        {formatDateTime(p.createdAt as unknown as string)}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2 justify-end">
                          {p.docUrl ? (
                            <>
                              <a
                                href={p.docUrl}
                                className="btn-ghost inline-flex items-center justify-center !py-1"
                                target="_blank"
                                rel="noreferrer"
                                title="Abrir propuesta"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Ver
                              </a>
                              <button
                                className="btn-ghost !py-1"
                                title="Copiar link"
                                onClick={() => p.docUrl && copyToClipboard(p.docUrl)}
                              >
                                Copiar
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td className="table-td text-center text-gray-500" colSpan={7}>
                        Sin resultados para el filtro seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>

          {/* Paginación */}
          {!loading && subset.length > 0 && (
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-sm text-gray-600">
                Mostrando {pageStart + 1}–{Math.min(pageStart + pageSize, subset.length)} de{" "}
                {subset.length}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} / página
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <button
                    className="btn-ghost"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </button>
                  <span className="text-sm">
                    {page} / {totalPages}
                  </span>
                  <button
                    className="btn-ghost"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
