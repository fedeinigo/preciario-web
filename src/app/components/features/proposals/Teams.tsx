// src/app/components/features/proposals/Teams.tsx
"use client";

import React from "react";
import { Users, Crown, Pencil, Trash2, UserCheck } from "lucide-react";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { toast } from "@/app/components/ui/toast";

type TeamRow = { id?: string; name: string; emoji?: string | null };

type AdminUser = {
  email: string | null;
  name?: string | null;
  role?: string | null;
  team: string | null;
};

// ---------- UI helpers ----------
function TitleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[12px] text-white">
      {children}
    </span>
  );
}

function ActionOnDark(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }
) {
  const { className, icon, children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12px] text-white
        border-white/20 bg-white/10 hover:bg-white/20 transition ${className || ""}`}
    >
      {icon}
      {children}
    </button>
  );
}

// ---------- Skeleton card ----------
function TeamCardSkeleton() {
  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden animate-pulse">
      <div className="h-10 bg-[rgb(var(--primary))]/80" />
      <div className="p-3 space-y-3">
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

  const [teams, setTeams] = React.useState<TeamRow[]>([]);
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);

  // creación
  const [newTeam, setNewTeam] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // rename dialog
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameFrom, setRenameFrom] = React.useState<string>("");
  const [renaming, setRenaming] = React.useState(false);

  // delete dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteName, setDeleteName] = React.useState<string>("");
  const [deleting, setDeleting] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const [t, u] = await Promise.all([
        fetch("/api/teams", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
      ]);
      setTeams(t.ok ? (await t.json()) : []);
      setUsers(u.ok ? (await u.json()) : []);
    } catch {
      setTeams([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

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
        toast("No se pudo crear el equipo");
        return;
      }
      setNewTeam("");
      toast("Equipo creado");
      await load();
    } catch {
      toast("No se pudo crear el equipo");
    } finally {
      setCreating(false);
    }
  };

  const doRenameTeam = async (to: string) => {
    const from = renameFrom;
    if (!from || !to || to === from) {
      setRenameOpen(false);
      return;
    }
    setRenaming(true);
    try {
      const r = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      });
      if (!r.ok) {
        toast("No se pudo renombrar el equipo");
        return;
      }
      toast("Equipo renombrado");
      setRenameOpen(false);
      await load();
    } catch {
      toast("No se pudo renombrar el equipo");
    } finally {
      setRenaming(false);
    }
  };

  const doDeleteTeam = async () => {
    const name = deleteName;
    if (!name) {
      setDeleteOpen(false);
      return;
    }
    setDeleting(true);
    try {
      const r = await fetch("/api/teams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!r.ok) {
        toast("No se pudo eliminar el equipo");
        return;
      }
      toast("Equipo eliminado");
      setDeleteOpen(false);
      await load();
    } catch {
      toast("No se pudo eliminar el equipo");
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

  // --- UI ---
  return (
    <div className="p-4">
      <div className="border bg-white">
        {/* Título púrpura consistente con la app */}
        <div className="heading-bar">Equipos</div>

        <div className="p-3">
          {/* Gestión (solo superadmin) */}
          {canEdit && (
            <div className="mb-4 rounded-md border bg-white p-3 shadow-soft">
              <div className="text-sm font-semibold mb-2">Gestión de equipos</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="input flex-1"
                  placeholder="Nuevo equipo"
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                />
                <button className="btn-primary" onClick={createTeam} disabled={!newTeam.trim() || creating}>
                  {creating ? "Creando…" : "Crear equipo"}
                </button>
              </div>
            </div>
          )}

          {/* Grilla */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <TeamCardSkeleton key={i} />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-md border bg-white p-8 text-center text-sm text-gray-600">
              No hay equipos todavía.
              {canEdit ? " Crea el primero con el formulario de arriba." : ""}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {teams.map((t) => {
                const g = grouped[t.name] || { leaders: [], members: [] };
                const total = g.leaders.length + g.members.length;

                return (
                  <div
                    key={t.name}
                    className="rounded-md border bg-white shadow-sm overflow-hidden"
                  >
                    {/* Header morado */}
                    <div className="flex items-center justify-between bg-[rgb(var(--primary))] px-3 py-2">
                      <div className="flex items-center gap-2 text-white">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold text-[15px]">{t.name}</span>
                        {t.emoji ? <span className="text-sm">{t.emoji}</span> : null}
                        <TitleBadge>{total} integrantes</TitleBadge>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <ActionOnDark
                            onClick={() => {
                              setRenameFrom(t.name);
                              setRenameOpen(true);
                            }}
                            icon={<Pencil className="h-3.5 w-3.5" />}
                            title="Renombrar"
                            aria-label="Renombrar equipo"
                          >
                            Renombrar
                          </ActionOnDark>
                          <ActionOnDark
                            onClick={() => {
                              setDeleteName(t.name);
                              setDeleteOpen(true);
                            }}
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            title="Eliminar"
                            aria-label="Eliminar equipo"
                          >
                            Eliminar
                          </ActionOnDark>
                        </div>
                      )}
                    </div>

                    {/* Cuerpo */}
                    <div className="p-3">
                      {/* Líderes */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                          <Crown className="h-4 w-4 text-amber-600" />
                          LÍDERES
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
                          MIEMBROS
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
        title="Renombrar equipo"
        description={
          <span className="text-sm">
            Cambiar nombre de <strong>{renameFrom}</strong>.
          </span>
        }
        inputLabel="Nuevo nombre"
        inputPlaceholder="Ej: Lobos"
        inputDefaultValue={renameFrom}
        inputRequired
        validateInput={(v) => (v.trim().length < 2 ? "Mínimo 2 caracteres" : null)}
        confirmText="Renombrar"
        loading={renaming}
      />

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={doDeleteTeam}
        title="Eliminar equipo"
        description={
          <div className="text-sm">
            ¿Seguro que deseas eliminar el equipo{" "}
            <strong>{deleteName || "(sin nombre)"}</strong>?<br />
            Los usuarios quedarán sin equipo.
          </div>
        }
        confirmText="Eliminar"
        destructive
        loading={deleting}
      />
    </div>
  );
}
