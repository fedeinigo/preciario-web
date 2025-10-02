// src/app/components/features/proposals/Teams.tsx
"use client";

import React from "react";
import { Users, Crown, Pencil, Trash2, UserCheck } from "lucide-react";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { toast } from "@/app/components/ui/toast";
import { useTranslations } from "@/app/LanguageProvider";
import { useAdminUsers } from "./hooks/useAdminUsers";
import type { AdminUser } from "./hooks/useAdminUsers";

type TeamRow = { id: string; name: string; emoji?: string | null };

// Helper de tipado seguro para leer errores de APIs
function extractApiError(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null && "error" in data) {
    const val = (data as { error?: unknown }).error;
    return typeof val === "string" ? val : undefined;
  }
  return undefined;
}

// ---------- UI helpers ----------
function TitleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[12px] text-white">
      {children}
    </span>
  );
}

function TeamCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden animate-pulse">
      <div
        className="h-12"
        style={{
          background:
            "linear-gradient(90deg, var(--brand-start-hex), var(--brand-end-hex))",
        }}
      />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  );
}

// ---------- Componente ----------
export default function Teams({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const canEdit = isSuperAdmin;

  const teamsT = useTranslations("admin.teams");
  const toastT = useTranslations("admin.teams.toast");
  const dialogT = useTranslations("admin.teams.dialogs");

  const [teams, setTeams] = React.useState<TeamRow[]>([]);
  const {
    users,
    loading: adminUsersLoading,
    reload: reloadAdminUsers,
  } = useAdminUsers({ isSuperAdmin });
  const [loadingTeams, setLoadingTeams] = React.useState(true);

  // creación
  const [newTeam, setNewTeam] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // rename dialog
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameId, setRenameId] = React.useState<string | null>(null);
  const [renameFrom, setRenameFrom] = React.useState<string>("");
  const [renaming, setRenaming] = React.useState(false);

  // delete dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleteName, setDeleteName] = React.useState<string>("");
  const [deleting, setDeleting] = React.useState(false);

  // toggle admin: mostrar también equipos vacíos
  const [showAllTeams, setShowAllTeams] = React.useState(false);

  const loading = loadingTeams || adminUsersLoading;

  const load = React.useCallback(
    async ({ refreshUsers = false }: { refreshUsers?: boolean } = {}) => {
      setLoadingTeams(true);
      const reloadPromise =
        refreshUsers && isSuperAdmin
          ? reloadAdminUsers().catch(() => undefined)
          : Promise.resolve();
      try {
        const t = await fetch("/api/teams", { cache: "no-store" });
        setTeams(t.ok ? (await t.json()) : []);
      } catch {
        setTeams([]);
      } finally {
        setLoadingTeams(false);
      }
      await reloadPromise;
    },
    [isSuperAdmin, reloadAdminUsers]
  );

  React.useEffect(() => {
    load();
    const onFocus = () => load({ refreshUsers: true });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  // --- Mutaciones ---
  const createTeam = async () => {
    const name = newTeam.trim();
    if (!name) return;
    setCreating(true);
    try {
      const r = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!r.ok) {
        const data: unknown = await r.json().catch(() => ({}));
        toast.error(extractApiError(data) ?? toastT("createError"));
        return;
      }
      setNewTeam("");
      toast.success(toastT("createSuccess"));
      await load({ refreshUsers: true });
    } catch {
      toast.error(toastT("createError"));
    } finally {
      setCreating(false);
    }
  };

  const doRenameTeam = async (to: string) => {
    const id = renameId;
    const name = to?.trim();
    if (!id || !name || name === renameFrom) {
      setRenameOpen(false);
      return;
    }
    setRenaming(true);
    try {
      const r = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      if (!r.ok) {
        const data: unknown = await r.json().catch(() => ({}));
        toast.error(extractApiError(data) ?? toastT("renameError"));
        return;
      }
      toast.success(toastT("renameSuccess"));
      setRenameOpen(false);
      await load({ refreshUsers: true });
    } catch {
      toast.error(toastT("renameError"));
    } finally {
      setRenaming(false);
    }
  };

  const doDeleteTeam = async () => {
    const id = deleteId;
    if (!id) {
      setDeleteOpen(false);
      return;
    }
    setDeleting(true);
    try {
      const r = await fetch("/api/teams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, replaceWith: null }), // mueve usuarios a null
      });
      if (!r.ok) {
        const data: unknown = await r.json().catch(() => ({}));
        toast.error(extractApiError(data) ?? toastT("deleteError"));
        return;
      }
      toast.success(toastT("deleteSuccess"));
      setDeleteOpen(false);
      await load({ refreshUsers: true });
    } catch {
      toast.error(toastT("deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  // --- Agrupación ---
  type Grouped = { leaders: AdminUser[]; members: AdminUser[] };
  const grouped: Record<string, Grouped> = React.useMemo(() => {
    const out: Record<string, Grouped> = {};
    for (const t of teams) out[t.name] = { leaders: [], members: [] };

    users.forEach((u) => {
      const teamName = u.team || "";
      if (!out[teamName]) return;
      const roleKey = String(u.role || "").toLowerCase();
      if (roleKey === "lider") out[teamName].leaders.push(u);
      else out[teamName].members.push(u);
    });

    return out;
  }, [teams, users]);

  // --- Visibilidad ---
  const visibleTeams = React.useMemo(() => {
    return teams.filter((t) => {
      const g = grouped[t.name] || { leaders: [], members: [] };
      return g.leaders.length + g.members.length > 0;
    });
  }, [teams, grouped]);

  const teamsToRender = canEdit && showAllTeams ? teams : visibleTeams;

  // --- UI ---
  return (
    <div className="p-4 bg-grain-soft rounded-2xl">
      {/* Contenedor principal */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        {/* Header morado consistente */}
        <div className="section-header">{teamsT("header")}</div>

        <div className="p-4 space-y-4">
          {/* Barra de controles (toggle admin) */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-sm text-gray-700">
              {teamsT("summary.label")} <strong>{teamsT(canEdit && showAllTeams ? "summary.all" : "summary.visible")}</strong>
            </div>
            {canEdit && (
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={showAllTeams}
                  onChange={(e) => setShowAllTeams(e.target.checked)}
                />
                {teamsT("toggleEmpty")}
              </label>
            )}
          </div>

          {/* Gestión (solo superadmin) */}
          {canEdit && (
            <div className="rounded-xl border bg-white p-3 shadow-soft">
              <div className="text-sm font-semibold mb-2">{teamsT("management.title")}</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="input-pill flex-1"
                  placeholder={teamsT("management.placeholder")}
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                />
                <button
                  className="btn-bar"
                  onClick={createTeam}
                  disabled={!newTeam.trim() || creating}
                >
                  {creating ? teamsT("management.creating") : teamsT("management.create")}
                </button>
              </div>
            </div>
          )}

          {/* Grilla de equipos */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <TeamCardSkeleton key={i} />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-md border bg-white p-8 text-center text-sm text-gray-600">
              {teamsT("empty.noTeams")}
              {canEdit ? ` ${teamsT("empty.createPrompt")}` : ""}
            </div>
          ) : teamsToRender.length === 0 ? (
            <div className="rounded-md border bg-white p-8 text-center text-sm text-gray-600">
              {teamsT("empty.noVisible")}
              <br />
              <span className="text-gray-500">{teamsT("empty.hint")}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {teamsToRender.map((t) => {
                const g = grouped[t.name] || { leaders: [], members: [] };
                const total = g.leaders.length + g.members.length;

                return (
                  <div key={t.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    {/* Header morado degradado */}
                    <div className="section-header !px-3 !h-auto py-2 justify-between">
                      <div className="flex items-center gap-2 text-white">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold text-[15px]">{t.name}</span>
                        {t.emoji ? <span className="text-sm">{t.emoji}</span> : null}
                        <TitleBadge>{teamsT("card.membersCount", { count: total })}</TitleBadge>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <button
                            className="btn-bar"
                            onClick={() => {
                              setRenameId(t.id);
                              setRenameFrom(t.name);
                              setRenameOpen(true);
                            }}
                            title={teamsT("card.rename")}
                            aria-label={teamsT("card.rename")}
                          >
                            <Pencil className="h-4 w-4" />
                            {teamsT("card.rename")}
                          </button>
                          <button
                            className="btn-bar"
                            onClick={() => {
                              setDeleteId(t.id);
                              setDeleteName(t.name);
                              setDeleteOpen(true);
                            }}
                            title={teamsT("card.delete")}
                            aria-label={teamsT("card.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                            {teamsT("card.delete")}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Cuerpo */}
                    <div className="p-4">
                      {/* Líderes */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                          <Crown className="h-4 w-4 text-amber-600" />
                          {teamsT("card.leaders")}
                        </div>
                        <div className="mt-2 border-t border-[rgb(var(--border))]" />
                        <div className="mt-2 space-y-1 text-[13px]">
                          {g.leaders.length === 0 ? (
                            <div className="text-gray-500">—</div>
                          ) : (
                            g.leaders.map((u) => (
                              <div key={u.email || Math.random()}>
                                <span className="font-medium">{u.name || u.email}</span>{" "}
                                <span className="text-gray-500">— {u.email}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Miembros */}
                      <div>
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                          <UserCheck className="h-4 w-4 text-emerald-600" />
                          {teamsT("card.members")}
                        </div>
                        <div className="mt-2 border-t border-[rgb(var(--border))]" />
                        <div className="mt-2 space-y-1 text-[13px]">
                          {g.members.length === 0 ? (
                            <div className="text-gray-500">—</div>
                          ) : (
                            g.members.map((u) => (
                              <div key={(u.email || "") + "-m"}>
                                <span className="font-medium">{u.name || u.email}</span>{" "}
                                <span className="text-gray-500">— {u.email}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ----- Dialogs ----- */}
      <ConfirmDialog
        open={renameOpen}
        onCancel={() => setRenameOpen(false)}
        onConfirm={(val) => (val ? doRenameTeam(val) : setRenameOpen(false))}
        title={dialogT("rename.title")}
        description={
          <span className="text-sm">
            {dialogT("rename.descriptionPrefix")}{" "}
            <strong>{renameFrom}</strong>
            {dialogT("rename.descriptionSuffix")}
          </span>
        }
        inputLabel={dialogT("rename.inputLabel")}
        inputPlaceholder={dialogT("rename.inputPlaceholder")}
        inputDefaultValue={renameFrom}
        inputRequired
        validateInput={(v) => (v.trim().length < 2 ? dialogT("rename.validation") : null)}
        confirmText={dialogT("rename.confirm")}
        loading={renaming}
      />

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={doDeleteTeam}
        title={dialogT("delete.title")}
        description={
          <div className="text-sm">
            {dialogT("delete.description", {
              team: deleteName || teamsT("card.unnamed"),
            })}
          </div>
        }
        confirmText={dialogT("delete.confirm")}
        destructive
        loading={deleting}
      />
    </div>
  );
}
