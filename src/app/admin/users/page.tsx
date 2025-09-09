"use client";

import React, { useEffect, useMemo, useState } from "react";

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

const ROLES: Role[] = ["usuario", "lider", "superadmin"];

export default function AdminUsersPage() {
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
        const errorMsg =
          typeof data === "object" && data && "error" in data
            ? (data as { error?: string }).error
            : undefined;
        alert(errorMsg ?? "No autorizado");
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...changes } : u)));
    } finally {
      setSaving(null);
    }
  };

  // ===== Gestor de equipos (superadmin)
  const [newTeam, setNewTeam] = useState("");
  const [renameId, setRenameId] = useState<string>("");
  const [renameName, setRenameName] = useState("");
  const [deleteId, setDeleteId] = useState<string>("");
  const [deleteReplace, setDeleteReplace] = useState<string>("");

  const createTeam = async () => {
    const name = newTeam.trim();
    if (!name) return;
    const r = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (r.ok) {
      setNewTeam("");
      load();
    } else {
      alert("No se pudo crear el equipo");
    }
  };

  const renameTeam = async () => {
    if (!renameId || !renameName.trim()) return;
    const r = await fetch("/api/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: renameId, name: renameName.trim() }),
    });
    if (r.ok) {
      setRenameId("");
      setRenameName("");
      load();
    } else {
      alert("No se pudo renombrar el equipo");
    }
  };

  const deleteTeam = async () => {
    if (!deleteId) return;
    const r = await fetch("/api/teams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: deleteId,
        replaceWith: deleteReplace || null,
      }),
    });
    if (r.ok) {
      setDeleteId("");
      setDeleteReplace("");
      load();
    } else {
      alert("No se pudo eliminar el equipo");
    }
  };

  return (
    <div className="p-4">
      <div className="border bg-white">
        <div className="bg-primary text-white font-semibold px-3 py-2 text-sm">
          Usuarios (admin)
        </div>

        <div className="p-3 space-y-6">
          {/* Tabla de usuarios */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-sm text-gray-500">Cargando…</div>
            ) : (
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="table-th">Email</th>
                    <th className="table-th">Nombre</th>
                    <th className="table-th w-48">Rol</th>
                    <th className="table-th w-56">Equipo</th>
                    <th className="table-th w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="table-td">{u.email ?? "—"}</td>
                      <td className="table-td">{u.name ?? "—"}</td>
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
                      <td className="table-td">
                        <input
                          className="input"
                          list="admin-teams"
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
                      <td className="table-td">
                        <button className="btn-ghost" onClick={() => load()}>
                          Refrescar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Gestor de equipos */}
          <div className="rounded-md border bg-white p-3">
            <div className="text-sm font-semibold mb-3">Gestión de equipos</div>

            <datalist id="admin-teams">
              {teamNames.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Nuevo equipo"
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                />
                <button className="btn-ghost" onClick={createTeam}>
                  Crear
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  className="select flex-1"
                  value={renameId}
                  onChange={(e) => setRenameId(e.target.value)}
                >
                  <option value="">(elige equipo)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <input
                  className="input flex-1"
                  placeholder="Nuevo nombre"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                />
                <button className="btn-ghost" onClick={renameTeam} disabled={!renameId || !renameName}>
                  Renombrar
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  className="select flex-1"
                  value={deleteId}
                  onChange={(e) => setDeleteId(e.target.value)}
                >
                  <option value="">(elige equipo)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <input
                  className="input flex-1"
                  list="admin-teams"
                  placeholder="Mover usuarios a… (opcional)"
                  value={deleteReplace}
                  onChange={(e) => setDeleteReplace(e.target.value)}
                />
                <button className="btn-ghost" onClick={deleteTeam} disabled={!deleteId}>
                  Eliminar / Mover
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
