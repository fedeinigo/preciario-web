"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ProposalRecord } from "@/lib/types";
import { formatUSD } from "./lib/format";
import { ExternalLink, Copy } from "lucide-react";
import { countryIdFromName } from "./lib/catalogs";

type AppRole = "superadmin" | "lider" | "usuario";
type AdminUserRow = { email: string | null; team: string | null; role: AppRole };
type OrderKey = "createdAt" | "totalAmount";

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

  const [orderKey, setOrderKey] = useState<OrderKey>("createdAt");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("desc");

  const clearAll = () => {
    setTeamFilter("");
    setIdQuery("");
    setCompanyQuery("");
    setCountryFilter("");
    setEmailQuery("");
    setFrom("");
    setTo("");
    setOrderKey("createdAt");
    setOrderDir("desc");
  };

  // ==== filtrado + orden ====
  const filtered = useMemo(() => {
    const f = rows.filter((p) => {
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

      // texto
      const idOk = !idQuery || p.id.toLowerCase().includes(idQuery.toLowerCase());
      const compOk =
        !companyQuery || p.companyName.toLowerCase().includes(companyQuery.toLowerCase());
      const emailOk =
        !emailQuery || (p.userEmail ?? "").toLowerCase().includes(emailQuery.toLowerCase());
      const countryOk = !countryFilter || p.country === countryFilter;

      // fechas (inclusive)
      const ts = new Date(p.createdAt as unknown as string).getTime();
      const fromTs = from ? new Date(from).getTime() : -Infinity;
      const toTs = to ? new Date(to).getTime() + 24 * 3600 * 1000 - 1 : Infinity;
      const dateOk = ts >= fromTs && ts <= toTs;

      return idOk && compOk && emailOk && countryOk && dateOk;
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
    rows,
    isSuperAdmin,
    role,
    leaderTeam,
    currentEmail,
    emailToTeam,
    teamFilter,
    idQuery,
    companyQuery,
    emailQuery,
    countryFilter,
    from,
    to,
    orderKey,
    orderDir,
  ]);

  // ==== UI helpers ====
  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      // no-op
    }
  };

  return (
    <div className="p-4">
      <div className="card border-2 overflow-hidden">
        <div className="heading-bar-sm">Histórico</div>

        <div className="p-3">
          {(isSuperAdmin || role === "lider") && (
            <div className="mb-3 grid grid-cols-1 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Equipo</label>
                <select className="select" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                  <option value="">Todos</option>
                  {teams.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">ID</label>
                <input className="input" placeholder="Buscar por ID" value={idQuery} onChange={(e) => setIdQuery(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Empresa</label>
                <input className="input" placeholder="Buscar empresa" value={companyQuery} onChange={(e) => setCompanyQuery(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">País</label>
                <select className="select" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
                  <option value="">Todos</option>
                  {countryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input className="input" placeholder="Buscar email" value={emailQuery} onChange={(e) => setEmailQuery(e.target.value)} />
              </div>

              <div className="flex items-end">
                <button className="btn-ghost w-full" onClick={clearAll}>Limpiar</button>
              </div>
            </div>
          )}

          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Desde</label>
              <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hasta</label>
              <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ordenar por</label>
              <select className="select" value={orderKey} onChange={(e) => setOrderKey(e.target.value as OrderKey)}>
                <option value="createdAt">Fecha de creación</option>
                <option value="totalAmount">Monto mensual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dirección</label>
              <select className="select" value={orderDir} onChange={(e) => setOrderDir(e.target.value as "asc" | "desc")}>
                <option value="desc">Descendente</option>
                <option value="asc">Ascendente</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border-2">
            {loading ? (
              <div className="text-sm text-gray-500 p-3">Cargando…</div>
            ) : (
              <table className="min-w-full bg-white text-sm">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="table-th !bg-primary !text-white">ID</th>
                    <th className="table-th !bg-primary !text-white">Empresa</th>
                    <th className="table-th !bg-primary !text-white">País</th>
                    <th className="table-th !bg-primary !text-white">Email</th>
                    <th className="table-th w-32 text-right !bg-primary !text-white">Mensual</th>
                    <th className="table-th w-40 !bg-primary !text-white">Creado</th>
                    <th className="table-th w-28 text-center !bg-primary !text-white">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
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
                            onClick={() => copyId(p.id)}
                            title="Copiar ID"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="table-td">{p.companyName}</td>
                      <td className="table-td">
                        {p.country}{" "}
                        <span className="text-xs text-gray-500">({countryIdFromName(p.country)})</span>
                      </td>
                      <td className="table-td">{p.userEmail || "—"}</td>
                      <td className="table-td text-right font-semibold">{formatUSD(Number(p.totalAmount) || 0)}</td>
                      <td className="table-td whitespace-nowrap">
                        {new Date(p.createdAt as unknown as string).toLocaleString()}
                      </td>
                      <td className="table-td text-center">
                        {p.docUrl ? (
                          <a
                            href={p.docUrl}
                            className="btn-ghost inline-flex items-center justify-center"
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir propuesta"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ver
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td className="table-td text-center text-gray-500" colSpan={7}>
                        Sin resultados para el filtro seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
