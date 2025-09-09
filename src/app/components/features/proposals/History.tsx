"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ProposalRecord } from "@/lib/types";
import { formatUSD } from "./lib/format";

type AppRole = "superadmin" | "lider" | "usuario";
type AdminUserRow = { email: string | null; team: string | null; role: AppRole };

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

  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [teamFilter, setTeamFilter] = useState<string>("");

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

  const subset = useMemo(() => {
    return rows.filter((p) => {
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
      return true;
    });
  }, [rows, emailToTeam, currentEmail, leaderTeam, role, isSuperAdmin, teamFilter]);

  return (
    <div className="p-4">
      <div className="border bg-white">
        <div className="bg-primary text-white font-semibold px-3 py-2 text-sm">Histórico</div>

        <div className="p-3">
          {(isSuperAdmin || role === "lider") && (
            <div className="mb-3 flex gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Equipo</label>
                <select className="select" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                  <option value="">Todos</option>
                  {teams.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button className="btn-ghost" onClick={() => setTeamFilter("")}>Limpiar</button>
            </div>
          )}

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-sm text-gray-500">Cargando…</div>
            ) : (
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="table-th">ID</th>
                    <th className="table-th">Empresa</th>
                    <th className="table-th">País</th>
                    <th className="table-th">Email</th>
                    <th className="table-th w-32 text-right">Mensual</th>
                    <th className="table-th w-40">Creado</th>
                    <th className="table-th w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {subset.map((p) => (
                    <tr key={p.id}>
                      <td className="table-td font-mono">{p.id}</td>
                      <td className="table-td">{p.companyName}</td>
                      <td className="table-td">{p.country}</td>
                      <td className="table-td">{p.userEmail || "—"}</td>
                      <td className="table-td text-right">{formatUSD(Number(p.totalAmount))}</td>
                      <td className="table-td">{new Date(p.createdAt as unknown as string).toLocaleString()}</td>
                      <td className="table-td">
                        {p.docUrl && (
                          <a href={p.docUrl} className="text-primary underline" target="_blank" rel="noreferrer">
                            Ver
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                  {subset.length === 0 && (
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
