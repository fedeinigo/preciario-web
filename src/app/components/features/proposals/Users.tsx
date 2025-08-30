"use client";

import React, { useEffect, useState } from "react";

type Role = "admin" | "comercial";
type Row = { id: string; email: string | null; role: Role; createdAt: string; updatedAt: string };

export default function Users() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // email en edición

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (!res.ok) {
      setRows([]);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as Row[];
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(email: string, role: Role) {
    setSaving(email);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setSaving(null);
    if (!res.ok) return; // podrías mostrar un toast

    const updated = (await res.json()) as Row;
    setRows((prev) =>
      prev.map((r) => (r.email === updated.email ? { ...r, role: updated.role, updatedAt: updated.updatedAt } : r))
    );
  }

  if (loading) return <div className="p-6">Cargando usuarios…</div>;

  return (
    <div className="p-6">
      <div className="card border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Usuarios</h2>
          <button className="btn-ghost" onClick={load}>Refrescar</button>
        </div>

        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-th">Email</th>
                <th className="table-th">Rol</th>
                <th className="table-th">Creado</th>
                <th className="table-th">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="table-td">{u.email}</td>
                  <td className="table-td">
                    <select
                      className="select"
                      value={u.role}
                      disabled={saving === (u.email ?? "")}
                      onChange={(e) => changeRole(u.email ?? "", e.target.value as Role)}
                    >
                      <option value="comercial">comercial</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="table-td">{new Date(u.createdAt).toLocaleString()}</td>
                  <td className="table-td">{new Date(u.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Tip: Los usuarios se crean automáticamente la primera vez que inician sesión (Google o credenciales).
        </p>
      </div>
    </div>
  );
}
