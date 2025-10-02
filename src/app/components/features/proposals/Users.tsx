/* eslint-disable @typescript-eslint/no-unused-expressions */
// src/app/components/features/proposals/Users.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "@/app/components/ui/toast";
import { Copy, MoreHorizontal, UserRound, X } from "lucide-react";
import { copyToClipboard } from "./lib/clipboard";
import UserProfileModal from "@/app/components/ui/UserProfileModal";
import { useTranslations } from "@/app/LanguageProvider";
import { normalizeSearchText } from "@/lib/normalize-search-text";
import { fetchAllProposals } from "./lib/proposals-response";

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
  /** Si el backend lo devuelve, lo mostramos sutilmente. Si no existe, simplemente se oculta. */
  lastLoginAt?: string | null;
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
      title={label}
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
  clearLabel,
}: {
  show: boolean;
  label: string;
  onClear?: () => void;
  clearLabel: string;
}) {
  if (!show) return null;
  return (
    <span className="chip inline-flex items-center gap-1">
      {label}
      {onClear ? (
        <button
          className="ml-1 rounded hover:bg-black/10 p-0.5"
          onClick={onClear}
          aria-label={clearLabel}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  );
}

const ROLES: Role[] = ["usuario", "lider", "superadmin"];

type SortKey = "email" | "name" | "role" | "team";
type SortDir = "asc" | "desc";

/* ======================== COMPONENTE ======================== */
export default function Users() {
  const t = useTranslations("admin.users");
  const kpisT = useTranslations("admin.users.kpis");
  const actionsT = useTranslations("admin.users.actions");
  const filtersT = useTranslations("admin.users.filters");
  const chipsT = useTranslations("admin.users.filters.chips");
  const tableT = useTranslations("admin.users.table");
  const dropdownT = useTranslations("admin.users.table.dropdown");
  const toastT = useTranslations("admin.users.toast");
  const exportT = useTranslations("admin.users.export");
  const relativeT = useTranslations("admin.users.relative");
  const rolesT = useTranslations("common.roles");

  // ====== data ======
  const [users, setUsers] = useState<UserRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // para KPIs: usuarios activos por propuestas en los últimos 30 días
  const [activeLast30, setActiveLast30] = useState<number>(0);

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, tRes] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/teams", { cache: "no-store" }),
      ]);
      setUsers(uRes.ok ? await uRes.json() : []);
      setTeams(tRes.ok ? await tRes.json() : []);

      // activos 30d (sin bloquear la UI si falla)
      try {
        const { proposals } = await fetchAllProposals();
        const since = Date.now() - 30 * 24 * 3600 * 1000;
        const activeUsers = new Set(
          proposals
            .filter((r) => r.userEmail && new Date(r.createdAt as string).getTime() >= since)
            .map((r) => r.userEmail as string)
        );
        setActiveLast30(activeUsers.size);
      } catch {
        setActiveLast30(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Listado completo de equipos
  const allTeamNames = useMemo(() => teams.map((t) => t.name), [teams]);

  // Equipos NO vacíos (al menos 1 usuario) — para selects
  const nonEmptyTeamNames = useMemo(() => {
    const count: Record<string, number> = {};
    users.forEach((u) => {
      const name = u.team?.trim();
      if (name) count[name] = (count[name] || 0) + 1;
    });
    return teams
      .filter((t) => (count[t.name] ?? 0) > 0)
      .map((t) => t.name);
  }, [teams, users]);

  // ====== filtros listado ======
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [onlyNoTeam, setOnlyNoTeam] = useState(false);
  const [includeEmptyTeams, setIncludeEmptyTeams] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setQDebounced(normalizeSearchText(q.trim())), 250);
    return () => window.clearTimeout(id);
  }, [q]);

  // ====== orden ======
  const [sortKey, setSortKey] = useState<SortKey>("email");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const sortBy = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "email" ? "asc" : "asc");
    }
  };

  const filteredSortedUsers = useMemo(() => {
    const filtered = users.filter((u) => {
      const byText =
        !qDebounced ||
        normalizeSearchText(u.email).includes(qDebounced) ||
        normalizeSearchText(u.name).includes(qDebounced);
      const byRole = !roleFilter || u.role === roleFilter;
      const byTeam = !teamFilter || (u.team ?? "") === teamFilter;
      const byOnlyNoTeam = !onlyNoTeam || !u.team;
      return byText && byRole && byTeam && byOnlyNoTeam;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    const roleIndex = (r: Role) => ROLES.indexOf(r);

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return ((a.name || "").localeCompare(b.name || "")) * dir;
        case "role":
          return (roleIndex(a.role) - roleIndex(b.role)) * dir;
        case "team":
          return ((a.team || "").localeCompare(b.team || "")) * dir;
        case "email":
        default:
          return ((a.email || "").localeCompare(b.email || "")) * dir;
      }
    });
  }, [users, qDebounced, roleFilter, teamFilter, onlyNoTeam, sortKey, sortDir]);

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
        toast.error(msg ?? toastT("unauthorized"));
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...changes } : u)));
      toast.success(toastT("saved"));
    } finally {
      setSaving(null);
    }
  };

  // ====== métricas para tarjetas ======
  const total = users.length;
  const countSuperadmin = users.filter((u) => u.role === "superadmin").length;
  const countLeaders = users.filter((u) => u.role === "lider").length;
  const countNoTeam = users.filter((u) => !u.team).length;
  const pctWithTeam = total ? ((total - countNoTeam) / total) * 100 : 0;

  // ====== helpers ======
  const effectiveTeamsForSelect = includeEmptyTeams ? allTeamNames : nonEmptyTeamNames;

  const clearFilters = () => {
    setQ("");
    setRoleFilter("");
    setTeamFilter("");
    setOnlyNoTeam(false);
  };

  const openHistoryForEmail = (email: string | null) => {
    if (!email) return;
    // Deep-link simple a la pestaña de histórico con query email
    window.location.href = `/#history?email=${encodeURIComponent(email)}`;
  };

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<{ id: string; email: string | null; name: string | null } | null>(null);

  const openProfile = (u: UserRow) => {
    setProfileUser({ id: u.id, email: u.email, name: u.name });
    setProfileOpen(true);
  };

  const exportCsv = () => {
    const headers = [
      exportT("headers.email"),
      exportT("headers.name"),
      exportT("headers.role"),
      exportT("headers.team"),
      exportT("headers.lastLogin"),
      exportT("headers.created"),
    ];
    const lines = filteredSortedUsers.map((u) => [
      u.email || "",
      u.name || "",
      u.role,
      u.team || "",
      u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "",
      new Date(u.createdAt).toLocaleString(),
    ]);
    const blob = new Blob([headers.join(","), "\n", lines.map((r) => r.join(",")).join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportT("filename");
    a.click();
    URL.revokeObjectURL(url);
    toast.success(toastT("csvExported"));
  };

  const formatLastLogin = (u: UserRow): string | null => {
    const iso = u.lastLoginAt || null;
    if (!iso) return null;
    const d = new Date(iso).getTime();
    const diff = Date.now() - d;
    const days = Math.floor(diff / (24 * 3600 * 1000));
    if (days >= 7) return new Date(iso).toLocaleDateString();
    if (days >= 1) return relativeT("days", { count: days });
    const hrs = Math.floor(diff / (3600 * 1000));
    if (hrs >= 1) return relativeT("hours", { count: hrs });
    const min = Math.max(1, Math.floor(diff / (60 * 1000)));
    return relativeT("minutes", { count: min });
  };

  // ====== UI ======
  return (
    <div className="p-4 space-y-4">
      {/* KPIs (estilo violeta) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="kpi-tile">
          <div className="kpi-label">{kpisT("total")}</div>
          <div className="kpi-value">{total}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">{kpisT("superadmins")}</div>
          <div className="kpi-value">{countSuperadmin}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">{kpisT("leaders")}</div>
          <div className="kpi-value">{countLeaders}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">{kpisT("withoutTeam")}</div>
          <div className="kpi-value">{countNoTeam}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">{kpisT("active30")}</div>
          <div className="kpi-value">{activeLast30}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">{kpisT("pctWithTeam")}</div>
          <div className="kpi-value">{pctWithTeam.toFixed(0)}%</div>
        </div>
      </div>

      {/* ======= Usuarios ======= */}
      <div className="card border-2 overflow-hidden">
        <div className="heading-bar-sm flex items-center justify-between">
          <span>{t("title")}</span>
          <div className="flex items-center gap-2">
            <button className="btn-bar" onClick={exportCsv} title={actionsT("exportCsv")}>
              {actionsT("exportCsv")}
            </button>
            <button className="btn-bar" onClick={load} title={actionsT("refresh")}>
              {actionsT("refresh")}
            </button>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {/* Filtros compactos */}
          <div className="border-2 bg-white rounded-md p-3">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">{filtersT("searchLabel")}</label>
                <input
                  className="input-pill w-full"
                  placeholder={filtersT("searchPlaceholder")}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">{filtersT("roleLabel")}</label>
                <select
                  className="select-pill w-full"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as Role | "")}
                >
                  <option value="">{filtersT("allOption")}</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {rolesT(r)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">{filtersT("teamLabel")}</label>
                <select
                  className="select-pill w-full"
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                >
                  <option value="">{filtersT("allOption")}</option>
                  {effectiveTeamsForSelect.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <label className="inline-flex items-center gap-2 text-[13px] text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={onlyNoTeam}
                  onChange={(e) => setOnlyNoTeam(e.target.checked)}
                />
                {filtersT("onlyNoTeam")}
              </label>
              <label className="inline-flex items-center gap-2 text-[13px] text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={includeEmptyTeams}
                  onChange={(e) => setIncludeEmptyTeams(e.target.checked)}
                />
                {filtersT("includeEmptyTeams")}
              </label>

              <div className="md:col-span-6 flex flex-wrap items-center gap-2">
                <FilterChip
                  show={Boolean(qDebounced)}
                  label={chipsT("query", { query: qDebounced })}
                  onClear={() => setQ("")}
                  clearLabel={filtersT("clearAria")}
                />
                <FilterChip
                  show={Boolean(roleFilter)}
                  label={chipsT("role", { role: roleFilter ? rolesT(roleFilter as Role) : "" })}
                  onClear={() => setRoleFilter("")}
                  clearLabel={filtersT("clearAria")}
                />
                <FilterChip
                  show={Boolean(teamFilter)}
                  label={chipsT("team", { team: teamFilter || "" })}
                  onClear={() => setTeamFilter("")}
                  clearLabel={filtersT("clearAria")}
                />
                <FilterChip
                  show={onlyNoTeam}
                  label={chipsT("onlyNoTeam")}
                  onClear={() => setOnlyNoTeam(false)}
                  clearLabel={filtersT("clearAria")}
                />

                <div className="ml-auto flex items-center gap-2">
                  <button className="btn-ghost" onClick={clearFilters}>
                    {filtersT("clear")}
                  </button>
                  <button className="btn-primary" onClick={load}>
                    {actionsT("refresh")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-auto rounded-md border-2 max-h-[65vh]">
            {loading ? (
              <div className="text-sm text-gray-500 p-3">{tableT("loading")}</div>
            ) : (
              <table className="min-w-full bg-white text-sm">
                <thead className="sticky top-0 z-10">
                  <tr>
                    {(
                      [
                        ["email", tableT("headers.email")],
                        ["name", tableT("headers.name")],
                        ["role", tableT("headers.role")],
                        ["team", tableT("headers.team")],
                        ["", tableT("headers.actions")],
                      ] as Array<[SortKey | "", string]>
                    ).map(([k, label], idx) => {
                      const clickable = k !== "";
                      const active = k === sortKey;
                      const dir = sortDir === "asc" ? "▲" : "▼";
                      return (
                        <th
                          key={idx}
                          className={`table-th ${clickable ? "cursor-pointer select-none" : ""} ${
                            active ? "!text-white !bg-primary" : "!bg-primary !text-white"
                          }`}
                          onClick={() => clickable && sortBy(k as SortKey)}
                          title={clickable ? tableT("sortTooltip") : ""}
                        >
                          {label} {active && dir}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredSortedUsers.map((u, i) => (
                    <tr
                      key={u.id}
                      className={
                        i % 2 === 0
                          ? "bg-white hover:bg-[rgb(var(--primary-soft))]/30"
                          : "bg-[rgb(var(--primary-soft))]/40 hover:bg-white"
                      }
                    >
                      {/* Email + avatar + acciones rápidas */}
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openProfile(u)}
                            className="rounded-full focus:outline-none"
                            title={tableT("openProfile")}
                          >
                            <Avatar label={u.name || u.email || "U"} />
                          </button>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{u.email ?? "—"}</span>
                              {u.email ? (
                                <>
                                  <button
                                    className="rounded p-1 hover:bg-black/5"
                                    title={dropdownT("copyEmail")}
                                    onClick={async () => {
                                      const ok = await copyToClipboard(u.email!);
                                      ok
                                        ? toast.success(toastT("copySuccess"))
                                        : toast.error(toastT("copyError"));
                                    }}
                                    type="button"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="rounded p-1 hover:bg-black/5"
                                    title={dropdownT("viewProfile")}
                                    onClick={() => openProfile(u)}
                                    type="button"
                                  >
                                    <UserRound className="h-4 w-4" />
                                  </button>
                                </>
                              ) : null}
                            </div>
                            {/* Último login sutil si existe */}
                            {u.lastLoginAt ? (
                              <span className="text-[11px] text-gray-500 -mt-0.5">
                                {tableT("lastLogin", { value: formatLastLogin(u) ?? "" })}
                              </span>
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
                          title={tableT("changeRole")}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {rolesT(r)}
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
                          placeholder={tableT("placeholderTeam")}
                          disabled={saving === u.id}
                          title={tableT("assignTeam")}
                        />
                      </td>

                      {/* Acciones */}
                      <td className="table-td">
                        <div className="relative flex justify-center">
                          <details className="group">
                            <summary className="list-none cursor-pointer rounded p-1 hover:bg-black/5 inline-flex">
                              <MoreHorizontal className="h-4 w-4" />
                            </summary>
                            <div className="absolute right-0 mt-1 min-w-[180px] rounded-md border bg-white p-1 shadow-soft z-10">
                              <button
                                className="w-full text-left rounded px-2 py-1.5 hover:bg-[rgb(var(--primary-soft))]"
                                onClick={async () => {
                                  if (u.email) {
                                    const ok = await copyToClipboard(u.email);
                                    ok
                                      ? toast.success(toastT("copySuccess"))
                                      : toast.error(toastT("copyError"));
                                  } else {
                                    toast.info(toastT("missingEmail"));
                                  }
                                }}
                                type="button"
                              >
                                {dropdownT("copyEmail")}
                              </button>
                              <button
                                className="w-full text-left rounded px-2 py-1.5 hover:bg-[rgb(var(--primary-soft))]"
                                onClick={() => openHistoryForEmail(u.email)}
                                type="button"
                              >
                                {dropdownT("viewHistory")}
                              </button>
                              <button
                                className="w-full text-left rounded px-2 py-1.5 hover:bg-[rgb(var(--primary-soft))]"
                                onClick={() => saveUser(u.id, { team: null })}
                                type="button"
                              >
                                {dropdownT("removeTeam")}
                              </button>
                              <button
                                className="w-full text-left rounded px-2 py-1.5 hover:bg-[rgb(var(--primary-soft))]"
                                onClick={() => openProfile(u)}
                                type="button"
                              >
                                {dropdownT("viewProfile")}
                              </button>
                            </div>
                          </details>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSortedUsers.length === 0 ? (
                    <tr>
                      <td className="table-td text-center text-gray-500" colSpan={5}>
                        {tableT("noResults")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </div>

          {/* datalist con SOLO equipos no vacíos (por defecto) o todos si “Incluir vacíos” */}
          <datalist id="users-teams">
            {(includeEmptyTeams ? allTeamNames : nonEmptyTeamNames).map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Modal de perfil / objetivo (viewer: esta vista suele ser de admins; pasamos superadmin para edición) */}
      {profileUser && (
        <UserProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          viewer={{ role: "superadmin", team: null }}
          targetUser={profileUser}
        />
      )}
    </div>
  );
}
