"use client";

import React, { useEffect, useMemo, useState } from "react";

import { useTranslations } from "@/app/LanguageProvider";
import { toast } from "@/app/components/ui/toast";

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
  const t = useTranslations("admin.usersLegacy");
  const rolesT = useTranslations("common.roles");
  const feedbackT = useTranslations("admin.usersLegacy.feedback");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; code: string } | null>(null);

  const resolveErrorCode = (status: number, code?: string, allowed: string[] = []) => {
    const normalized = code?.toLowerCase();
    if (normalized && allowed.some((value) => value.toLowerCase() === normalized)) {
      return normalized;
    }
    if (normalized === "unauthorized" || normalized === "forbidden") {
      return "unauthorized";
    }
    if (status === 401 || status === 403) return "unauthorized";
    if (status === 404) return "notFound";
    if (status === 400) return "invalid";
    return "generic";
  };

  const load = async () => {
    setLoading(true);
    setFeedback(null);
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
        const errorCode =
          typeof data === "object" && data && "code" in data && typeof (data as { code?: string }).code === "string"
            ? (data as { code?: string }).code
            : undefined;
        const code = resolveErrorCode(r.status, errorCode);
        toast.error(feedbackT(`save.error.${code}`));
        setFeedback({ type: "error", code: `save.error.${code}` });
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...changes } : u)));
      toast.success(feedbackT("save.success"));
      setFeedback({ type: "success", code: "save.success" });
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
      toast.success(feedbackT("teams.create.success"));
    } else {
      const data: unknown = await r.json().catch(() => ({}));
      const errorCode =
        typeof data === "object" && data && "code" in data && typeof (data as { code?: string }).code === "string"
          ? (data as { code?: string }).code
          : undefined;
      const code = resolveErrorCode(r.status, errorCode ?? undefined);
      toast.error(feedbackT(`teams.create.error.${code}`));
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
      toast.success(feedbackT("teams.rename.success"));
    } else {
      const data: unknown = await r.json().catch(() => ({}));
      const errorCode =
        typeof data === "object" && data && "code" in data && typeof (data as { code?: string }).code === "string"
          ? (data as { code?: string }).code
          : undefined;
      const code = resolveErrorCode(r.status, errorCode ?? undefined);
      toast.error(feedbackT(`teams.rename.error.${code}`));
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
      toast.success(feedbackT("teams.delete.success"));
    } else {
      const data: unknown = await r.json().catch(() => ({}));
      const errorCode =
        typeof data === "object" && data && "code" in data && typeof (data as { code?: string }).code === "string"
          ? (data as { code?: string }).code
          : undefined;
      const code = resolveErrorCode(r.status, errorCode ?? undefined);
      toast.error(feedbackT(`teams.delete.error.${code}`));
    }
  };

  return (
    <div className="p-4">
      <div className="border bg-white">
        <div className="bg-primary text-white font-semibold px-3 py-2 text-sm">
          {t("title")}
        </div>

        <div className="p-3 space-y-6">
          {/* Tabla de usuarios */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-sm text-gray-500">{t("table.loading")}</div>
            ) : (
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="table-th">{t("table.headers.email")}</th>
                    <th className="table-th">{t("table.headers.name")}</th>
                    <th className="table-th w-48">{t("table.headers.role")}</th>
                    <th className="table-th w-56">{t("table.headers.team")}</th>
                    <th className="table-th w-28">{t("table.headers.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="table-td">{u.email ?? t("table.fallback")}</td>
                      <td className="table-td">{u.name ?? t("table.fallback")}</td>
                      <td className="table-td">
                        <select
                          className="select"
                          value={u.role}
                          onChange={(e) => saveUser(u.id, { role: e.target.value as Role })}
                          disabled={saving === u.id}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {rolesT(r)}
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
                          placeholder={t("table.teamPlaceholder")}
                          disabled={saving === u.id}
                        />
                      </td>
                      <td className="table-td">
                        <button className="btn-ghost" onClick={() => load()}>
                          {t("table.refresh")}
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
            <div className="text-sm font-semibold mb-3">{t("forms.title")}</div>

            <datalist id="admin-teams">
              {teamNames.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder={t("forms.create.placeholder")}
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                />
                <button className="btn-ghost" onClick={createTeam}>
                  {t("forms.create.submit")}
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  className="select flex-1"
                  value={renameId}
                  onChange={(e) => setRenameId(e.target.value)}
                >
                  <option value="">{t("forms.rename.selectPlaceholder")}</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <input
                  className="input flex-1"
                  placeholder={t("forms.rename.placeholder")}
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                />
                <button className="btn-bar" onClick={renameTeam} disabled={!renameId || !renameName}>
                  {t("forms.rename.submit")}
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  className="select flex-1"
                  value={deleteId}
                  onChange={(e) => setDeleteId(e.target.value)}
                >
                  <option value="">{t("forms.delete.selectPlaceholder")}</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <input
                  className="input flex-1"
                  list="admin-teams"
                  placeholder={t("forms.delete.placeholder")}
                  value={deleteReplace}
                  onChange={(e) => setDeleteReplace(e.target.value)}
                />
                <button className="btn-ghost" onClick={deleteTeam} disabled={!deleteId}>
                  {t("forms.delete.submit")}
                </button>
              </div>
            </div>
            {feedback ? (
              <div
                className={
                  feedback.type === "success"
                    ? "mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                    : "mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                }
                role={feedback.type === "success" ? "status" : "alert"}
              >
                {feedbackT(feedback.code)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
