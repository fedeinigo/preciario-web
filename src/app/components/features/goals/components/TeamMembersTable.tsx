// src/app/components/features/goals/components/TeamMembersTable.tsx
"use client";

import React from "react";
import { ChevronDown, ChevronUp, Search, Filter, User, Target, TrendingUp } from "lucide-react";
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

  const getPerformanceColor = (pct: number) => {
    if (pct >= 100) return { bg: "bg-gradient-to-br from-purple-500 to-purple-700", text: "text-purple-700", ring: "ring-purple-500/20" };
    if (pct >= 75) return { bg: "bg-gradient-to-br from-blue-500 to-blue-600", text: "text-blue-700", ring: "ring-blue-500/20" };
    if (pct >= 50) return { bg: "bg-gradient-to-br from-amber-500 to-amber-600", text: "text-amber-700", ring: "ring-amber-500/20" };
    return { bg: "bg-gradient-to-br from-slate-400 to-slate-500", text: "text-slate-700", ring: "ring-slate-500/20" };
  };

  const actionButtonBase =
    "inline-flex w-full md:w-auto items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white";

  return (
    <div className="space-y-5">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl text-sm bg-white shadow-sm focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "above" | "below")}
            className="px-5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition bg-white shadow-sm"
          >
            <option value="all">Todos</option>
            <option value="above">✓ Arriba del objetivo</option>
            <option value="below">↓ Abajo del objetivo</option>
          </select>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-medium text-slate-500 self-center">Ordenar por:</span>
        <button
          type="button"
          onClick={() => handleSort("user")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            sortKey === "user"
              ? "bg-purple-100 text-purple-700 shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <User className="h-3 w-3" />
          Usuario
          {sortKey === "user" && <Arrow active={true} direction={sortAsc ? "asc" : "desc"} />}
        </button>
        <button
          type="button"
          onClick={() => handleSort("goal")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            sortKey === "goal"
              ? "bg-purple-100 text-purple-700 shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Target className="h-3 w-3" />
          Objetivo
          {sortKey === "goal" && <Arrow active={true} direction={sortAsc ? "asc" : "desc"} />}
        </button>
        <button
          type="button"
          onClick={() => handleSort("progress")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            sortKey === "progress"
              ? "bg-purple-100 text-purple-700 shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <TrendingUp className="h-3 w-3" />
          Avance
          {sortKey === "progress" && <Arrow active={true} direction={sortAsc ? "asc" : "desc"} />}
        </button>
        <button
          type="button"
          onClick={() => handleSort("pct")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            sortKey === "pct"
              ? "bg-purple-100 text-purple-700 shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          % Cumpl.
          {sortKey === "pct" && <Arrow active={true} direction={sortAsc ? "asc" : "desc"} />}
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm px-8 py-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 mb-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
            </div>
            <p className="text-sm font-medium text-slate-600">{t("loading")}</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-purple-50 border border-purple-100 shadow-sm px-8 py-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 mb-4">
              <Search className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              {searchQuery.trim() || statusFilter !== "all" ? "No se encontraron resultados con los filtros aplicados" : t("empty")}
            </p>
          </div>
        ) : (
          filteredAndSorted.map((r) => {
            const displayName = r.name || r.email || r.userId;
            const isEditing = editing === r.userId;
            const goalValue = isEditing ? tmp : r.goal;
            const monthly = goalValue / 3;
            const perfColor = getPerformanceColor(r.pct);
            const pctSafe = Number.isFinite(r.pct) ? r.pct : 0;
            const progressWidth = Math.min(100, Math.max(0, pctSafe));
            
            return (
              <div
                key={r.userId}
                className="group relative rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300 overflow-hidden"
              >
                {/* Progress Background */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-purple-50/40 to-transparent transition-all duration-300"
                  style={{ width: `${Math.min(progressWidth, 100)}%` }}
                />
                
                <div className="relative p-6">
                  {/* Header: Avatar + Name + Performance Badge */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${perfColor.bg} text-white text-xl font-bold shadow-lg ring-4 ${perfColor.ring}`}>
                        {initialsFor(r.name, r.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-slate-900 truncate mb-0.5">{displayName}</h3>
                        {r.email && <p className="text-sm text-slate-500 truncate">{r.email}</p>}
                      </div>
                    </div>
                    <div className={`shrink-0 px-4 py-2 rounded-2xl ${perfColor.bg} shadow-md`}>
                      <div className="text-2xl font-bold text-white text-center leading-none">{pctSafe.toFixed(0)}%</div>
                      <div className="text-[10px] font-medium text-white/90 text-center mt-0.5 uppercase tracking-wide">Cumpl.</div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    {/* Objetivo */}
                    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Objetivo</div>
                      {isEditing ? (
                        <input
                          className="w-full px-3 py-2 rounded-xl border-2 border-purple-300 bg-white text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          type="number"
                          min={0}
                          value={Number.isFinite(tmp) ? tmp : 0}
                          onChange={(e) => setTmp(Number(e.target.value || 0))}
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="text-lg font-bold text-slate-900">{formatUSD(r.goal)}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {labelsT("monthly")}: {formatUSD(Number.isFinite(monthly) ? monthly : 0)}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Avance */}
                    <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-4 border border-purple-200">
                      <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1.5">Avance</div>
                      <div className="text-lg font-bold text-purple-900">{formatUSD(r.progress)}</div>
                      <div className="text-xs text-purple-600 mt-0.5">
                        {r.dealsCount !== undefined ? `${r.dealsCount} deal${r.dealsCount !== 1 ? 's' : ''}` : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600">Progreso visual</span>
                      <span className="text-xs font-bold text-purple-700">{pctSafe.toFixed(1)}%</span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 shadow-sm transition-all duration-500"
                        style={{ width: `${progressWidth}%` }}
                      />
                      {pctSafe > 100 && (
                        <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-amber-400 to-transparent opacity-75" />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button
                          className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold bg-white border-2 border-slate-300 text-slate-700 shadow-sm hover:bg-slate-50 transition"
                          onClick={cancelEdit}
                        >
                          {actionsT("cancel")}
                        </button>
                        <button
                          className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] transition-all"
                          onClick={() => saveEdit(r.userId)}
                        >
                          {actionsT("save")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold bg-white border border-slate-300 text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition"
                          onClick={() => onOpenProfile({ id: r.userId, email: r.email, name: r.name })}
                        >
                          {actionsT("profile")}
                        </button>
                        {canAddManual && (
                          <button
                            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                            onClick={() => onAddManual({ id: r.userId, email: r.email, name: r.name })}
                          >
                            {billingT("manualCta")}
                          </button>
                        )}
                        <button
                          className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold bg-purple-50 border border-purple-200 text-purple-700 shadow-sm hover:bg-purple-100 hover:border-purple-300 transition"
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


