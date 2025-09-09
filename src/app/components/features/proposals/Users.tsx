// src/app/components/features/proposals/Users.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/app/components/ui/Modal";

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
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [teamFilter, setTeamFilter] = useState<string>("");

  const filteredUsers = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return users.filter((u) => {
      const byText =
        !qq ||
        (u.email ?? "").toLowerCase().includes(qq) ||
        (u.name ?? "").toLowerCase().includes(qq);
      const byRole = !roleFilter || u.role === roleFilter;
      const byTeam = !teamFilter || (u.team ?? "") === teamFilter;
      return byText && byRole && byTeam;
    });
  }, [users, q, roleFilter, teamFilter]);

  // ====== actualizar usuario ======
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
        alert(msg ?? "No autorizado");
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...changes } : u)));
    } finally {
      setSaving(null);
    }
  };

  // ====== gestión de equipos (formularios) ======
  const [newTeam, setNewTeam] = useState("");
  const [renameId, setRenameId] = useState<string>("");
  const [renameName, setRenameName] = useState("");
  const [deleteId, setDeleteId] = useState<string>("");

  // Modal eliminar / mover
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReplace, setDeleteReplace] = useState<string>("");

  const usersInTeam = useMemo(() => {
    const name = teams.find((t) => t.id === deleteId)?.name || "";
    if (!name) return 0;
    return users.filter((u) => (u.team ?? "") === name).length;
  }, [deleteId, teams, users]);

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

  const confirmDeleteTeam = async () => {
    if (!deleteId) return;
    const r = await fetch("/api/teams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: deleteId,
        replaceWith: deleteReplace || null, // nombre de equipo destino (opcional)
      }),
    });
    if (r.ok) {
      setDeleteId("");
      setDeleteReplace("");
      setDeleteOpen(false);
      load();
    } else {
      alert("No se pudo eliminar el equipo");
    }
  };

  return (
    <div className="p-4">
      {/* ======= Usuarios ======= */}
      <div className="card border-2 mb-6 overflow-hidden">
        <div className="heading-bar-sm">Usuarios</div>

        <div className="p-3 space-y-4">
          {/* Filtros */}
          <div className="border-2 bg-white rounded-md p-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
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
              <div className="flex items-end gap-2">
                <button
                  className="btn-ghost flex-1"
                  onClick={() => {
                    setQ("");
                    setRoleFilter("");
                    setTeamFilter("");
                  }}
                >
                  Limpiar
                </button>
                <button className="btn-ghost flex-1" onClick={load}>
                  Refrescar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto border-2 rounded-md">
            {loading ? (
              <div className="text-sm text-gray-500 p-3">Cargando…</div>
            ) : (
              <table className="min-w-full bg-white text-sm">
                <thead>
                  <tr>
                    <th className="table-th !bg-primary !text-white">Email</th>
                    <th className="table-th !bg-primary !text-white">Nombre</th>
                    <th className="table-th w-48 !bg-primary !text-white">Rol</th>
                    <th className="table-th w-56 !bg-primary !text-white">Equipo</th>
                    <th className="table-th w-28 !bg-primary !text-white"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr
                      key={u.id}
                      className={i % 2 === 0 ? "bg-white" : "bg-[rgb(var(--primary-soft))]/40 hover:bg-white"}
                    >
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
                      <td className="table-td">
                        <button className="btn-ghost w-full" onClick={load}>
                          Refrescar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td className="table-td text-center text-gray-500" colSpan={5}>
                        Sin resultados para los filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <datalist id="users-teams">
            {teamNames.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </div>

      {/* ======= Gestión de equipos ======= */}
      <div className="card border-2 overflow-hidden">
        <div className="heading-bar-sm">Gestión de equipos</div>

        <div className="p-4 space-y-6">
          {/* Crear */}
          <div className="rounded-md border bg-white p-3">
            <div className="text-sm font-semibold mb-3">Crear equipo</div>
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
          </div>

          {/* Renombrar */}
          <div className="rounded-md border bg-white p-3">
            <div className="text-sm font-semibold mb-3">Renombrar equipo</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                className="select"
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
                className="input"
                placeholder="Nuevo nombre"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
              />
              <button className="btn-ghost" onClick={renameTeam} disabled={!renameId || !renameName.trim()}>
                Renombrar
              </button>
            </div>
          </div>

          {/* Eliminar / Mover */}
          <div className="rounded-md border bg-white p-3">
            <div className="text-sm font-semibold mb-3">Eliminar / mover equipo</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                className="select"
                value={deleteId}
                onChange={(e) => setDeleteId(e.target.value)}
              >
                <option value="">(elige equipo a eliminar)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <select
                className="select"
                value={deleteReplace}
                onChange={(e) => setDeleteReplace(e.target.value)}
                disabled={!deleteId}
              >
                <option value="">Mover usuarios a… (opcional)</option>
                {teams
                  .filter((t) => t.id !== deleteId)
                  .map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
              </select>
              <button
                className="btn-ghost"
                onClick={() => setDeleteOpen(true)}
                disabled={!deleteId}
              >
                Eliminar / Mover
              </button>
            </div>
            <p className="text-[12px] text-gray-500 mt-2">
              * Si no eliges un equipo de destino, los usuarios quedarán sin equipo.
            </p>
          </div>
        </div>
      </div>

      {/* Modal confirmación eliminar equipo */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Eliminar equipo"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={confirmDeleteTeam} disabled={!deleteId}>
              Confirmar
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Vas a eliminar el equipo{" "}
            <strong>
              {teams.find((t) => t.id === deleteId)?.name || "(sin selección)"}
            </strong>
            .
          </p>
          <p className="text-sm text-gray-700">
            Usuarios en este equipo: <strong>{usersInTeam}</strong>
          </p>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Mover usuarios a (opcional)
            </label>
            <select
              className="select w-full"
              value={deleteReplace}
              onChange={(e) => setDeleteReplace(e.target.value)}
            >
              <option value="">(sin movimiento)</option>
              {teams
                .filter((t) => t.id !== deleteId)
                .map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
