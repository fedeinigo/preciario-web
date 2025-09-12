// src/app/components/features/goals/components/TeamMembersTable.tsx
"use client";

import React from "react";
import { toast } from "@/app/components/ui/toast";
import { formatUSD } from "../../proposals/lib/format";

export type TeamGoalRow = {
  userId: string;
  email: string | null;
  name: string | null;
  goal: number;
  progress: number;
  pct: number; // puede superar 100
};

type SortKey = "user" | "goal" | "progress" | "pct";

export default function TeamMembersTable({
  loading,
  rows,
  canEdit,
  onEditGoal,
  onOpenProfile,
}: {
  loading: boolean;
  rows: TeamGoalRow[];
  canEdit: boolean;
  onEditGoal: (userId: string, amount: number) => Promise<boolean> | boolean;
  onOpenProfile: (u: { id: string; email: string | null; name: string | null }) => void;
}) {
  const [editing, setEditing] = React.useState<string | null>(null);
  const [tmp, setTmp] = React.useState<number>(0);

  const [sortKey, setSortKey] = React.useState<SortKey>("user");
  const [sortAsc, setSortAsc] = React.useState<boolean>(true);

  const startEdit = (r: TeamGoalRow) => {
    if (!canEdit) return;
    setEditing(r.userId);
    setTmp(r.goal);
  };
  const cancelEdit = () => setEditing(null);
  const saveEdit = async (userId: string) => {
    if (!canEdit) return;
    const ok = await onEditGoal(userId, tmp);
    if (ok) setEditing(null);
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc((s) => !s);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sorted = React.useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const nameA = (a.name || a.email || a.userId || "").toLowerCase();
      const nameB = (b.name || b.email || b.userId || "").toLowerCase();
      let cmp = 0;
      switch (sortKey) {
        case "user":
          cmp = nameA.localeCompare(nameB);
          break;
        case "goal":
          cmp = a.goal - b.goal;
          break;
        case "progress":
          cmp = a.progress - b.progress;
          break;
        case "pct":
          cmp = a.pct - b.pct;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortAsc]);

  const Arrow = ({ active }: { active: boolean }) => (
    <span className={`ml-1 inline-block transition-transform ${active ? "opacity-100" : "opacity-30"}`}>
      {sortAsc ? "▲" : "▼"}
    </span>
  );

  return (
    <div className="space-y-3 max-w-5xl mx-auto">
      <div className="overflow-x-auto rounded-2xl border shadow-sm max-h-[520px]">
        <table className="min-w-full bg-white border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#4c1d95] text-white">
              <th className="table-th rounded-tl-xl">
                <button className="w-full text-left" onClick={() => handleSort("user")}>
                  Usuario <Arrow active={sortKey === "user"} />
                </button>
              </th>
              <th className="table-th w-32 text-right">
                <button className="w-full text-right" onClick={() => handleSort("goal")}>
                  Objetivo <Arrow active={sortKey === "goal"} />
                </button>
              </th>
              <th className="table-th w-32 text-right">
                <button className="w-full text-right" onClick={() => handleSort("progress")}>
                  Avance <Arrow active={sortKey === "progress"} />
                </button>
              </th>
              <th className="table-th w-24 text-right">
                <button className="w-full text-right" onClick={() => handleSort("pct")}>
                  % Cumpl. <Arrow active={sortKey === "pct"} />
                </button>
              </th>
              <th className="table-th w-48 text-right rounded-tr-xl">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td className="table-td text-center text-gray-500" colSpan={5}>
                  Cargando…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td className="table-td text-center text-gray-500" colSpan={5}>
                  Sin miembros o sin datos.
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => {
                const displayName = r.name || r.email || r.userId;
                return (
                  <tr key={r.userId} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                    <td className="table-td border-r border-gray-100">{displayName}</td>
                    <td className="table-td text-right border-r border-gray-100">
                      {editing === r.userId ? (
                        <input
                          className="w-32 h-9 px-3 rounded-full border border-gray-300 text-right"
                          type="number"
                          min={0}
                          value={tmp}
                          onChange={(e) => setTmp(Number(e.target.value))}
                        />
                      ) : (
                        formatUSD(r.goal)
                      )}
                    </td>
                    <td className="table-td text-right border-r border-gray-100">{formatUSD(r.progress)}</td>
                    <td className="table-td text-right border-r border-gray-100">{r.pct.toFixed(1)}%</td>
                    <td className="table-td text-right">
                      {editing === r.userId ? (
                        <div className="inline-flex gap-2">
                          <button
                            className="h-9 px-4 rounded-full border border-gray-300 bg-white hover:bg-gray-50"
                            onClick={cancelEdit}
                          >
                            Cancelar
                          </button>
                          <button
                            className="h-9 px-4 rounded-full bg-cyan-400 text-[#2b0b57] font-semibold hover:brightness-95"
                            onClick={() => saveEdit(r.userId)}
                          >
                            Guardar
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex gap-2">
                          <button
                            className="btn-bar"
                            onClick={() => onOpenProfile({ id: r.userId, email: r.email, name: r.name })}
                          >
                            Perfil
                          </button>
                          <button
                            className="btn-bar"
                            onClick={() => {
                              if (!canEdit) {
                                toast.info("Solo líderes o superadmins pueden editar objetivos de otros.");
                                return;
                              }
                              startEdit(r);
                            }}
                          >
                            Editar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
