// src/app/components/features/proposals/Users.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "@/app/components/ui/toast";
import { Copy, MoreHorizontal, X } from "lucide-react";
import { copyToClipboard } from "./lib/clipboard";

type Role = "superadmin" | "lider" | "usuario";

type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: Role;
  team: string | null;
  createdAt: string;
  updatedAt: string;
};

type TeamRow = { id: string; name: string };

/* ---------- helpers de UI ---------- */
function getInitials(nameOrEmail: string): string {
  const s = (nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.includes("@")
    ? s.split("@")[0].replace(/[\W_]+/g, " ").trim().split(" ")
    : s.replace(/\s+/g, " ").trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts[1]?.[0] ?? "";
  return (first + last || first || "U").toUpperCase();
}

function stringHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) % 360;
  return h;
}

function Avatar({ label }: { label: string }) {
  const hue = stringHue(label || "user");
  const bg = `hsl(${hue} 70% 92%)`;
  const fg = `hsl(${hue} 38% 28%)`;
  return (
    <div
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold shadow-soft ring-1 ring-black/5"
      style={{ backgroundColor: bg, color: fg }}
      aria-hidden
    >
      {getInitials(label)}
    </div>
  );
}

/** Chip de filtro */
function FilterChip({
  show,
  label,
  onClear,
}: {
  show: boolean;
  label: string;
  onClear?: () => void;
}) {
  if (!show) return null;
  return (
    <span className="chip inline-flex items-center gap-1">
      {label}
      {onClear ? (
        <button
          className="ml-1 rounded hover:bg-black/10 p-0.5"
          onClick={onClear}
          aria-label="Quitar filtro"
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  );
}

const ROLES: Role[] = ["usuario", "lider", "superadmin"];

/* ======================== COMPONENTE ======================== */
export default function Users() {
  // ====== data ======
  const [users, setUsers] = useState<UserRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/teams", { cache: "no-store" }),
      ]);
      setUsers(u.ok ? await u.json() : []);
      setTeams(t.ok ? await t.json() : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const teamNames = useMemo(() => teams.map((t) => t.name), [teams]);

  // ====== filtros listado ======
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [onlyNoTeam, setOnlyNoTeam] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setQDebounced(q.trim().toLowerCase()), 250);
    return () => window.clearTimeout(id);
  }, [q]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const byText =
        !qDebounced ||
        (u.email ?? "").toLowerCase().includes(qDebounced) ||
        (u.name ?? "").toLowerCase().includes(qDebounced);
      const byRole = !roleFilter || u.role === roleFilter;
      const byTeam = !teamFilter || (u.team ?? "") === teamFilter;
      const byOnlyNoTeam = !onlyNoTeam || !u.team;
      return byText && byRole && byTeam && byOnlyNoTeam;
    });
  }, [users, qDebounced, roleFilter, teamFilter, onlyNoTeam]);

  // ====== actualizar usuario (rol/equipo) ======
  const saveUser = async (userId: string, changes: Partial<UserRow>) => {
    setSaving(userId);
    try {
      const r = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          team: "team" in changes ? changes.team ?? null : undefined,
          role: "role" in changes ? (changes.role as Role) : undefined,
        }),
      });

      if (!r.ok) {
        const data: unknown = await r.json().catch(() => ({}));
        const msg =
          typeof data === "object" && data && "error" in data
            ? (data as { error?: string }).error
            : undefined;
        toast.error(msg ?? "No autorizado");
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...changes } : u)));
      toast.success("Cambios guardados");
    } finally {
      setSaving(null);
    }
  };

  // ====== métricas para tarjetas ======
  const total = users.length;
  const countSuperadmin = users.filter((u) => u.role === "superadmin").length;
  const countLeaders = users.filter((u) => u.role === "lider").length;
  const countNoTeam = users.filter((u) => !u.team).length;

  // ====== UI ======
  return (
    <div className="p-4 space-y-4">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-md border-2 bg-white p-3 shadow-soft">
          <div className="text-xs text-gray-500">Usuarios</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-2xl font-semibold">{total}</div>
          </div>
        </div>
        <div className="rounded-md border-2 bg-white p-3 shadow-soft">
          <div className="text-xs text-gray-500">Superadmins</div>
          <div className="mt-1 text-2xl font-semibold">{countSuperadmin}</div>
        </div>
        <div className="rounded-md border-2 bg-white p-3 shadow-soft">
          <div className="text-xs text-gray-500">Líderes</div>
          <div className="mt-1 text-2xl font-semibold">{countLeaders}</div>
        </div>
        <div className="rounded-md border-2 bg-white p-3 shadow-soft">
          <div className="text-xs text-gray-500">Sin equipo</div>
          <div className="mt-1 text-2xl font-semibold">{countNoTeam}</div>
        </div>
      </div>

      {/* ======= Usuarios ======= */}
      <div className="card border-2 overflow-hidden">
        <div className="heading-bar-sm">Usuarios</div>

        <div className="p-3 space-y-3">
          {/* Filtros */}
          <div className="border-2 bg-white rounded-md p-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Buscar</label>
                <input
                  className="input"
                  placeholder="Email o nombre…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Rol</label>
                <select
                  className="select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as Role | "")}
                >
                  <option value="">Todos</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Equipo</label>
                <select
                  className="select"
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  {teamNames.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-3">
                <label className="inline-flex items-center gap-2 text-[13px] text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={onlyNoTeam}
                    onChange={(e) => setOnlyNoTeam(e.target.checked)}
                  />
                  Solo sin equipo
                </label>
              </div>
            </div>

            {/* Acciones filtros */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <FilterChip
                show={Boolean(qDebounced)}
                label={`Buscar: "${qDebounced}"`}
                onClear={() => setQ("")}
              />
              <FilterChip
                show={Boolean(roleFilter)}
                label={`Rol: ${roleFilter || ""}`}
                onClear={() => setRoleFilter("")}
              />
              <FilterChip
                show={Boolean(teamFilter)}
                label={`Equipo: ${teamFilter || ""}`}
                onClear={() => setTeamFilter("")}
              />
              <FilterChip
                show={onlyNoTeam}
                label="Solo sin equipo"
                onClear={() => setOnlyNoTeam(false)}
              />

              <div className="ml-auto flex items-center gap-2">
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setQ("");
                    setRoleFilter("");
                    setTeamFilter("");
                    setOnlyNoTeam(false);
                  }}
                >
                  Limpiar
                </button>
                <button className="btn-primary" onClick={load}>
                  Refrescar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-auto rounded-md border-2 max-h-[65vh]">
            {loading ? (
              <div className="text-sm text-gray-500 p-3">Cargando…</div>
            ) : (
              <table className="min-w-full bg-white text-sm">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="table-th !bg-primary !text-white">Email</th>
                    <th className="table-th !bg-primary !text-white">Nombre</th>
                    <th className="table-th w-48 !bg-primary !text-white">Rol</th>
                    <th className="table-th w-56 !bg-primary !text-white">Equipo</th>
                    <th className="table-th w-16 !bg-primary !text-white text-center">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr
                      key={u.id}
                      className={
                        i % 2 === 0
                          ? "bg-white hover:bg-[rgb(var(--primary-soft))]/30"
                          : "bg-[rgb(var(--primary-soft))]/40 hover:bg-white"
                      }
                    >
                      {/* Email + avatar */}
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <Avatar label={u.name || u.email || "U"} />
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{u.email ?? "—"}</span>
                            {u.email ? (
                              <button
                                className="rounded p-1 hover:bg-black/5"
                                title="Copiar email"
                                onClick={async () => {
                                  const ok = await copyToClipboard(u.email!);
                                  if (ok) {
                                    toast.success("Email copiado");
                                  } else {
                                    toast.error("No se pudo copiar");
                                  }
                                }}
                                type="button"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Nombre */}
                      <td className="table-td">{u.name ?? "—"}</td>

                      {/* Rol */}
                      <td className="table-td">
                        <select
                          className="select"
                          value={u.role}
                          onChange={(e) => saveUser(u.id, { role: e.target.value as Role })}
                          disabled={saving === u.id}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Equipo */}
                      <td className="table-td">
                        <input
                          className="input"
                          list="users-teams"
                          value={u.team ?? ""}
                          onChange={(e) =>
                            saveUser(u.id, {
                              team: e.target.value ? e.target.value : null,
                            })
                          }
                          placeholder="(sin equipo)"
                          disabled={saving === u.id}
                        />
                      </td>

                      {/* Acciones */}
                      <td className="table-td">
                        <div className="relative flex justify-center">
                          <details className="group">
                            <summary className="list-none cursor-pointer rounded p-1 hover:bg-black/5 inline-flex">
                              <MoreHorizontal className="h-4 w-4" />
                            </summary>
                            <div className="absolute right-0 mt-1 min-w-[160px] rounded-md border bg-white p-1 shadow-soft z-10">
                              <button
                                className="w-full text-left rounded px-2 py-1.5 hover:bg-[rgb(var(--primary-soft))]"
                                onClick={async () => {
                                  if (u.email) {
                                    const ok = await copyToClipboard(u.email);
                                    if (ok) {
                                      toast.success("Email copiado");
                                    } else {
                                      toast.error("No se pudo copiar");
                                    }
                                  } else {
                                    toast.info("El usuario no tiene email");
                                  }
                                }}
                                type="button"
                              >
                                Copiar email
                              </button>
                              <button
                                className="w-full text-left rounded px-2 py-1.5 hover:bg-[rgb(var(--primary-soft))]"
                                onClick={() => saveUser(u.id, { team: null })}
                                type="button"
                              >
                                Quitar de equipo
                              </button>
                            </div>
                          </details>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td className="table-td text-center text-gray-500" colSpan={5}>
                        Sin resultados para los filtros.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </div>

          {/* datalist para equipos */}
          <datalist id="users-teams">
            {teamNames.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
}
