// src/app/components/features/goals/components/TeamMembersTable.tsx
"use client";

import React from "react";
import { ChevronDown, ChevronUp, Search, Filter } from "lucide-react";
import { toast } from "@/app/components/ui/toast";
import { formatUSD } from "../../proposals/lib/format";
import { useTranslations } from "@/app/LanguageProvider";

export type TeamGoalRow = {
  userId: string;
  email: string | null;
  name: string | null;
  goal: number;
  progress: number;
  pct: number; // puede superar 100
  dealsCount?: number;
};

type SortKey = "user" | "goal" | "progress" | "pct";

export default function TeamMembersTable({
  loading,
  rows,
  canEdit,
  canAddManual,
  onEditGoal,
  onOpenProfile,
  onAddManual,
}: {
  loading: boolean;
  rows: TeamGoalRow[];
  canEdit: boolean;
  canAddManual: boolean;
  onEditGoal: (userId: string, amount: number) => Promise<boolean> | boolean;
  onOpenProfile: (u: { id: string; email: string | null; name: string | null }) => void;
  onAddManual: (u: { id: string; email: string | null; name: string | null }) => void;
}) {
  const t = useTranslations("goals.table");
  const headersT = useTranslations("goals.table.headers");
  const actionsT = useTranslations("goals.table.actions");
  const billingT = useTranslations("goals.billing");
  const labelsT = useTranslations("goals.table.labels");
  const toastT = useTranslations("goals.toast");
  const [editing, setEditing] = React.useState<string | null>(null);
  const [tmp, setTmp] = React.useState<number>(0);

  const [sortKey, setSortKey] = React.useState<SortKey>("user");
  const [sortAsc, setSortAsc] = React.useState<boolean>(true);

  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "above" | "below">("all");

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

  const filteredAndSorted = React.useMemo(() => {
    let arr = [...rows];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      arr = arr.filter((row) => {
        const nameMatch = row.name?.toLowerCase().includes(query);
        const emailMatch = row.email?.toLowerCase().includes(query);
        return nameMatch || emailMatch;
      });
    }
    
    // Apply status filter
    if (statusFilter === "above") {
      arr = arr.filter((row) => row.pct >= 100);
    } else if (statusFilter === "below") {
      arr = arr.filter((row) => row.pct < 100);
    }
    
    // Apply sorting
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
  }, [rows, sortKey, sortAsc, searchQuery, statusFilter]);

  const Arrow = ({
    active,
    direction,
  }: {
    active: boolean;
    direction: "asc" | "desc";
  }) => (
    <span
      className={`ml-1 inline-flex h-3 w-3 items-center justify-center text-[10px] transition ${active ? "opacity-100" : "opacity-40"}`}
    >
      {direction === "asc" ? (
        <ChevronUp className="h-3 w-3" aria-hidden="true" />
      ) : (
        <ChevronDown className="h-3 w-3" aria-hidden="true" />
      )}
    </span>
  );

  const initialsFor = (name: string | null, email: string | null) => {
    const fallback = email || name || "";
    const source = (name || fallback || "").trim();
    if (!source) return "--";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const ProgressChip = ({ pct }: { pct: number }) => {
    const pctSafe = Number.isFinite(pct) ? pct : 0;
    const baseWidth = Math.min(100, Math.max(0, pctSafe));
    const overflow = Math.max(0, pctSafe - 100);

    return (
      <div className="flex w-full flex-col gap-1">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#f3e8ff]">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#c084fc] via-[#a855f7] to-[#6d28d9]"
            style={{ width: `${baseWidth}%` }}
          />
          {overflow > 0 && (
            <div
              className="absolute top-0 h-full rounded-r-full bg-[#ede9fe]"
              style={{ left: "calc(100% - 12px)", width: "12px" }}
            >
              <div className="h-full w-full rounded-r-full bg-[length:8px_8px] [background-image:repeating-linear-gradient(45deg,rgba(109,40,217,0.65)_0,rgba(109,40,217,0.65)_4px,rgba(109,40,217,0.2)_4px,rgba(109,40,217,0.2)_8px)]" />
            </div>
          )}
        </div>
        <div className="text-xs font-semibold text-[#6d28d9]">{pctSafe.toFixed(1)}%</div>
      </div>
    );
  };

  const actionButtonBase =
    "inline-flex w-full md:w-auto items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white";

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "above" | "below")}
            className="px-4 py-2.5 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition bg-white"
          >
            <option value="all">Todos</option>
            <option value="above">Arriba del objetivo</option>
            <option value="below">Abajo del objetivo</option>
          </select>
        </div>
      </div>

      <div className="hidden rounded-2xl bg-[#f5f0ff] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6d28d9] md:grid md:grid-cols-[minmax(0,2.3fr),minmax(0,1.1fr),minmax(0,1.1fr),minmax(0,0.9fr),minmax(0,1.4fr),minmax(0,1.1fr)] md:items-center">
        <button
          type="button"
          className="flex items-center gap-1 text-left"
          onClick={() => handleSort("user")}
        >
          {headersT("user")}{" "}
          <Arrow active={sortKey === "user"} direction={sortAsc ? "asc" : "desc"} />
        </button>
        <button
          type="button"
          className="flex items-center justify-end gap-1 text-right"
          onClick={() => handleSort("goal")}
        >
          {headersT("goal")}{" "}
          <Arrow active={sortKey === "goal"} direction={sortAsc ? "asc" : "desc"} />
        </button>
        <button
          type="button"
          className="flex items-center justify-end gap-1 text-right"
          onClick={() => handleSort("progress")}
        >
          {headersT("progress")}{" "}
          <Arrow active={sortKey === "progress"} direction={sortAsc ? "asc" : "desc"} />
        </button>
        <button
          type="button"
          className="flex items-center justify-end gap-1 text-right"
          onClick={() => handleSort("pct")}
        >
          {headersT("pct")}{" "}
          <Arrow active={sortKey === "pct"} direction={sortAsc ? "asc" : "desc"} />
        </button>
        <div className="text-right">{labelsT("visual")}</div>
        <div className="text-right">{actionsT("title")}</div>
      </div>

      <div className="divide-y divide-[#efe7ff] overflow-hidden rounded-2xl border border-[#efe7ff] bg-white shadow-sm">
        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-[#6b21a8]">{t("loading")}</div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-[#6b21a8]">
            {searchQuery.trim() || statusFilter !== "all" ? "No se encontraron resultados con los filtros aplicados" : t("empty")}
          </div>
        ) : (
          filteredAndSorted.map((r) => {
            const displayName = r.name || r.email || r.userId;
            const isEditing = editing === r.userId;
            const goalValue = isEditing ? tmp : r.goal;
            const monthly = goalValue / 3;
            return (
              <div
                key={r.userId}
                className="grid grid-cols-1 gap-5 px-5 py-6 text-sm text-[#2f0f5d] transition hover:bg-[#f9f6ff] md:grid-cols-[minmax(0,2.3fr),minmax(0,1.1fr),minmax(0,1.1fr),minmax(0,0.9fr),minmax(0,1.4fr),minmax(0,1.1fr)] md:items-center md:px-6"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ede9fe] text-base font-semibold text-[#5b21b6]">
                    {initialsFor(r.name, r.email)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#2f0f5d]">{displayName}</div>
                    {r.email && <div className="truncate text-xs text-[#7c3aed]">{r.email}</div>}
                  </div>
                </div>

                <div className="text-right md:text-left">
                  <div className="text-sm font-semibold text-[#2f0f5d]">
                    {isEditing ? (
                      <input
                        className="h-10 w-full max-w-[140px] rounded-xl border border-[#d8c7ff] bg-white px-3 text-right text-sm font-semibold text-[#4c1d95] focus:outline-none focus:ring-2 focus:ring-[#a855f7]"
                        type="number"
                        min={0}
                        value={Number.isFinite(tmp) ? tmp : 0}
                        onChange={(e) => setTmp(Number(e.target.value || 0))}
                      />
                    ) : (
                      formatUSD(r.goal)
                    )}
                  </div>
                  <div className="text-xs font-medium text-[#7c3aed]">
                    {labelsT("monthly")}: {formatUSD(Number.isFinite(monthly) ? monthly : 0)}
                  </div>
                </div>

                <div className="text-right text-sm font-semibold text-[#2f0f5d] md:text-right">
                  {formatUSD(r.progress)}
                </div>

                <div className="text-right text-sm font-semibold text-[#6d28d9] md:text-right">
                  {r.pct.toFixed(1)}%
                </div>

                <div className="md:px-2">
                  <ProgressChip pct={r.pct} />
                </div>

                <div className="flex flex-col items-stretch gap-2 text-sm font-semibold text-[#6d28d9] md:flex-row md:flex-wrap md:justify-end">
                  {isEditing ? (
                    <>
                      <button
                        className={`${actionButtonBase} border border-[#d8c7ff] bg-white text-[#6d28d9] shadow-sm hover:bg-[#f4edff] focus:ring-[#c4b5fd]`}
                        onClick={cancelEdit}
                      >
                        {actionsT("cancel")}
                      </button>
                      <button
                        className={`${actionButtonBase} bg-gradient-to-r from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] text-white shadow-md hover:brightness-110 focus:ring-[#7c3aed]`}
                        onClick={() => saveEdit(r.userId)}
                      >
                        {actionsT("save")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={`${actionButtonBase} border border-[#d8c7ff] bg-white text-[#6d28d9] shadow-sm hover:bg-[#f4edff] focus:ring-[#c4b5fd]`}
                        onClick={() => onOpenProfile({ id: r.userId, email: r.email, name: r.name })}
                      >
                        {actionsT("profile")}
                      </button>
                      {canAddManual && (
                        <button
                          className={`${actionButtonBase} bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#5b21b6] text-white shadow-md hover:brightness-110 focus:ring-[#7c3aed]`}
                          onClick={() => onAddManual({ id: r.userId, email: r.email, name: r.name })}
                        >
                          {billingT("manualCta")}
                        </button>
                      )}
                      <button
                        className={`${actionButtonBase} border border-[#c084fc] bg-[#f5f0ff] text-[#4c1d95] shadow-sm hover:bg-[#ede9fe] focus:ring-[#c4b5fd]`}
                        onClick={() => {
                          if (!canEdit) {
                            toast.info(toastT("restrictedEdit"));
                            return;
                          }
                          startEdit(r);
                        }}
                      >
                        {actionsT("edit")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


