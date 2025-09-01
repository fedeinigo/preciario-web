"use client";

import React, { useEffect, useState } from "react";

type Role = "admin" | "comercial";
type Row = { id: string; email: string | null; role: Role; createdAt: string; updatedAt: string };

const TitleBar = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary text-white font-semibold px-3 py-2 text-sm">
    {children}
  </div>
);

export default function Users() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

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
    if (!res.ok) return;

    const updated = (await res.json()) as Row;
    setRows((prev) =>
      prev.map((r) =>
        r.email === updated.email ? { ...r, role: updated.role, updatedAt: updated.updatedAt } : r
      )
    );
  }

  if (loading) return <div className="p-4">Cargando usuarios…</div>;

  return (
    <div className="p-4">
      <div className="border bg-white">
        <TitleBar>Usuarios</TitleBar>

        <div className="p-3">
          <div className="overflow-x-auto border bg-white">
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

          <button className="btn-ghost mt-3" onClick={load}>Refrescar</button>

          <p className="text-xs text-gray-500 mt-3">
            Tip: Los usuarios se crean automáticamente la primera vez que inician sesión (Google o credenciales).
          </p>
        </div>
      </div>
    </div>
  );
}
