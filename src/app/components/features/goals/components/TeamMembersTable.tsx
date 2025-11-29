// src/app/components/features/goals/components/TeamMembersTable.tsx
"use client";

import React from "react";
import { ChevronDown, ChevronUp, Search, Filter, User, Target, TrendingUp } from "lucide-react";
import { toast } from "@/app/components/ui/toast";
import { formatUSD } from "../../proposals/lib/format";
import { useTranslations } from "@/app/LanguageProvider";
import UserAvatar from "@/app/components/ui/UserAvatar";

export type TeamGoalRow = {
  userId: string;
  email: string | null;
  name: string | null;
  role?: string | null;
  team?: string | null;
  image?: string | null;
  goal: number;
  progress: number;
  pct: number; // puede superar 100
  dealsCount?: number;
};

type SortKey = "user" | "goal" | "progress" | "pct";

type TeamMembersTableProps = {
  loading: boolean;
  rows: TeamGoalRow[];
  canEdit: boolean;
  canAddManual: boolean;
  onEditGoal: (userId: string, amount: number) => Promise<boolean> | boolean;
  onOpenProfile: (u: {
    id: string;
    email: string | null;
    name: string | null;
    role?: string | null;
    team?: string | null;
    image?: string | null;
  }) => void;
  onAddManual: (u: { id: string; email: string | null; name: string | null }) => void;
  onShowDeals?: (row: TeamGoalRow) => void;
  theme?: "direct" | "mapache";
};

export default function TeamMembersTable({
  loading,
  rows,
  canEdit,
  canAddManual,
  onEditGoal,
  onOpenProfile,
  onAddManual,
  onShowDeals,
  theme = "direct",
}: TeamMembersTableProps) {
  const t = useTranslations("goals.table");
  const actionsT = useTranslations("goals.table.actions");
  const billingT = useTranslations("goals.billing");
  const labelsT = useTranslations("goals.table.labels");
  const toastT = useTranslations("goals.toast");
  const [editing, setEditing] = React.useState<string | null>(null);
  const [tmp, setTmp] = React.useState<number>(0);

  const [sortKey, setSortKey] = React.useState<SortKey>("pct");
  const [sortAsc, setSortAsc] = React.useState<boolean>(false);

  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "above" | "below">("all");
  const isMapache = theme === "mapache";

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

  const getPerformanceColor = (pct: number) => {
    if (isMapache) {
      if (pct >= 100)
        return {
          bg: "bg-gradient-to-r from-[#22d3ee] via-[#8b5cf6] to-[#c084fc]",
          ring: "ring-white/30",
        };
      if (pct >= 75)
        return {
          bg: "bg-gradient-to-r from-[#10b981] to-[#22d3ee]",
          ring: "ring-emerald-300/30",
        };
      if (pct >= 50)
        return {
          bg: "bg-gradient-to-r from-[#fbbf24] to-[#f97316]",
          ring: "ring-amber-300/25",
        };
      return {
        bg: "bg-gradient-to-r from-[#475569] to-[#1e293b]",
        ring: "ring-slate-400/25",
      };
    }
    if (pct >= 100)
      return {
        bg: "bg-gradient-to-br from-purple-500 to-purple-700",
        text: "text-purple-700",
        ring: "ring-purple-500/20",
      };
    if (pct >= 75)
      return {
        bg: "bg-gradient-to-br from-blue-500 to-blue-600",
        text: "text-blue-700",
        ring: "ring-blue-500/20",
      };
    if (pct >= 50)
      return {
        bg: "bg-gradient-to-br from-amber-500 to-amber-600",
        text: "text-amber-700",
        ring: "ring-amber-500/20",
      };
    return {
      bg: "bg-gradient-to-br from-slate-400 to-slate-500",
      text: "text-slate-700",
      ring: "ring-slate-500/20",
    };
  };

  const searchIconClass = isMapache
    ? "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50"
    : "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400";
  const searchInputClass = isMapache
    ? "w-full pl-12 pr-4 py-3 border border-white/15 rounded-2xl text-sm bg-white/5 text-white placeholder:text-white/50 shadow-[0_15px_45px_rgba(0,0,0,0.4)] focus:border-white/35 focus:outline-none focus:ring-4 focus:ring-white/15 transition backdrop-blur"
    : "w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl text-sm bg-white shadow-sm focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition";
  const filterIconClass = isMapache ? "h-5 w-5 text-white/65" : "h-5 w-5 text-slate-500";
  const selectClass = isMapache
    ? "px-5 py-3 border border-white/15 rounded-2xl text-sm font-semibold text-white bg-white/5 shadow-[0_12px_32px_rgba(0,0,0,0.4)] focus:border-white/40 focus:outline-none focus:ring-4 focus:ring-white/15 transition"
    : "px-5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition bg-white shadow-sm";
  const sortLabelClass = isMapache
    ? "text-xs font-medium text-white/70 self-center"
    : "text-xs font-medium text-slate-500 self-center";
  const sortButtonBase =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition";
  const sortButtonClass = (active: boolean) =>
    `${sortButtonBase} ${
      active
        ? isMapache
          ? "bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#22d3ee] text-white shadow-[0_12px_30px_rgba(99,102,241,0.45)]"
          : "bg-purple-100 text-purple-700 shadow-sm"
        : isMapache
          ? "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`;
  const loadingCardClass = isMapache
    ? "mapache-surface-card border-white/15 px-8 py-12 text-center text-white shadow-[0_25px_70px_rgba(0,0,0,0.55)]"
    : "rounded-3xl bg-white border border-slate-200 shadow-sm px-8 py-12 text-center";
  const emptyStateClass = isMapache
    ? "mapache-surface-card border-white/15 px-8 py-12 text-center text-white shadow-[0_25px_70px_rgba(0,0,0,0.45)]"
    : "rounded-3xl bg-gradient-to-br from-slate-50 to-purple-50 border border-purple-100 shadow-sm px-8 py-12 text-center";
  const emptyTextClass = isMapache ? "text-sm font-medium text-white/80" : "text-sm font-medium text-slate-700";
  const loadingIconShell = isMapache
    ? "inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 mb-4"
    : "inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 mb-4";
  const loadingSpinnerClass = isMapache
    ? "h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"
    : "h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent";
  const loadingTextClass = isMapache ? "text-sm font-medium text-white/75" : "text-sm font-medium text-slate-600";
  const emptyIconShell = isMapache
    ? "inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 mb-4"
    : "inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 mb-4";
  const emptyIconColor = isMapache ? "h-6 w-6 text-white" : "h-6 w-6 text-purple-600";
  const rowCardClass = isMapache
    ? "mapache-surface-card border-white/15 text-white shadow-[0_25px_70px_rgba(0,0,0,0.55)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.65)] transition-all duration-300 p-4 space-y-4"
    : "rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-purple-200 hover:shadow-lg transition-all duration-300 p-4 space-y-4";
  const memberNameClass = isMapache ? "text-base font-semibold text-white truncate" : "text-base font-semibold text-slate-900 truncate";
  const memberEmailClass = isMapache ? "text-sm text-white/60 truncate" : "text-sm text-slate-500 truncate";
  const labelUpperClass = isMapache
    ? "text-xs font-semibold uppercase tracking-wide text-white/55 mb-1"
    : "text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1";
  const goalValueClass = isMapache ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900";
  const goalSubLabelClass = isMapache ? "text-xs text-white/60" : "text-xs text-slate-500";
  const progressLabelClass = isMapache
    ? "text-xs font-semibold uppercase tracking-wide text-white/65 mb-1"
    : "text-xs font-semibold uppercase tracking-wide text-purple-600 mb-1";
  const progressValueClass = isMapache ? "text-lg font-bold text-white" : "text-lg font-bold text-purple-900";
  const progressMetaClass = isMapache ? "text-xs text-white/65" : "text-xs text-purple-600";
  const editInputClass = isMapache
    ? "w-full rounded-lg border-2 border-white/20 bg-white/5 px-3 py-1.5 text-base font-semibold text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
    : "w-full rounded-lg border-2 border-purple-200 px-3 py-1.5 text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/40";
  const primaryActionClass = isMapache
    ? "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#22d3ee] px-3 py-2 text-xs font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.4)] transition hover:translate-y-[-1px]"
    : "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md";
  const secondaryActionClass = isMapache
    ? "inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/85 shadow-sm transition hover:bg-white/15"
    : "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-2 text-xs font-semibold text-white/80 shadow-sm transition hover:shadow-md";
  const progressMetaRowClass = isMapache
    ? "flex items-center justify-between text-xs text-white/60 mb-1"
    : "flex items-center justify-between text-xs text-slate-500 mb-1";
  const progressTrackClass = isMapache
    ? "relative h-2 w-full overflow-hidden rounded-full bg-white/10"
    : "relative h-2 w-full overflow-hidden rounded-full bg-slate-100";
  const progressFillClass = isMapache
    ? "absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#22d3ee] via-[#8b5cf6] to-[#c084fc] transition-all duration-500"
    : "absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 transition-all duration-500";

  return (
    <div className="space-y-5">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={searchIconClass} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className={searchInputClass}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className={filterIconClass} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "above" | "below")}
            className={selectClass}
          >
            <option value="all">Todos</option>
            <option value="above">Arriba del objetivo</option>
            <option value="below">Abajo del objetivo</option>
          </select>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex flex-wrap gap-2">
        <span className={sortLabelClass}>Ordenar por:</span>
        <button
          type="button"
          onClick={() => handleSort("user")}
          className={sortButtonClass(sortKey === "user")}
        >
          <User className="h-3 w-3" />
          Usuario
          {sortKey === "user" && <Arrow active={true} direction={sortAsc ? "asc" : "desc"} />}
        </button>
        <button
          type="button"
          onClick={() => handleSort("goal")}
          className={sortButtonClass(sortKey === "goal")}
        >
          <Target className="h-3 w-3" />
          Objetivo
          {sortKey === "goal" && <Arrow active={true} direction={sortAsc ? "asc" : "desc"} />}
        </button>
        <button
          type="button"
          onClick={() => handleSort("progress")}
          className={sortButtonClass(sortKey === "progress")}
        >
          <TrendingUp className="h-3 w-3" />
          Avance
          {sortKey === "progress" && <Arrow active={true} direction={sortAsc ? "asc" : "desc"} />}
        </button>
        <button
          type="button"
          onClick={() => handleSort("pct")}
          className={sortButtonClass(sortKey === "pct")}
        >
          % Cumpl.
          {sortKey === "pct" && <Arrow active={true} direction={sortAsc ? "asc" : "desc"} />}
        </button>
      </div>


      <div className="space-y-3">
        {loading ? (
          <div className={loadingCardClass}>
            <div className={loadingIconShell}>
              <div className={loadingSpinnerClass} />
            </div>
            <p className={loadingTextClass}>{t("loading")}</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className={emptyStateClass}>
            <div className={emptyIconShell}>
              <Search className={emptyIconColor} />
            </div>
            <p className={emptyTextClass}>
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
                className={rowCardClass}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                  <div className="flex items-center gap-3 min-w-[220px] flex-1">
                    <UserAvatar
                      name={displayName}
                      email={r.email ?? undefined}
                      image={r.image ?? undefined}
                      size={56}
                      className={`shadow-sm ring-4 ${perfColor.ring}`}
                    />
                    <div className="min-w-0">
                      <p className={memberNameClass}>{displayName}</p>
                      {r.email && <p className={memberEmailClass}>{r.email}</p>}
                    </div>
                  </div>

                  <div className="min-w-[160px]">
                    <p className={labelUpperClass}>Objetivo</p>
                    {isEditing ? (
                      <input
                        className={editInputClass}
                        type="number"
                        min={0}
                        value={Number.isFinite(tmp) ? tmp : 0}
                        onChange={(e) => setTmp(Number(e.target.value || 0))}
                        autoFocus
                      />
                    ) : (
                      <>
                        <p className={goalValueClass}>{formatUSD(r.goal)}</p>
                        <p className={goalSubLabelClass}>
                          {labelsT("monthly")}: {formatUSD(Number.isFinite(monthly) ? monthly : 0)}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="min-w-[150px]">
                    <p className={progressLabelClass}>Avance</p>
                    <p className={progressValueClass}>{formatUSD(r.progress)}</p>
                    <p className={progressMetaClass}>
                      {r.dealsCount !== undefined ? `${r.dealsCount} deal${r.dealsCount !== 1 ? "s" : ""}` : "-"}
                    </p>
                  </div>

                  <div className="flex w-full gap-2 sm:w-auto sm:min-w-[140px]">
                    <div className="flex w-full flex-col gap-2">
                      {isEditing ? (
                        <>
                          <button
                            className={primaryActionClass}
                            onClick={() => saveEdit(r.userId)}
                          >
                            {actionsT("save")}
                          </button>
                          <button
                            className={secondaryActionClass}
                            onClick={cancelEdit}
                          >
                            {actionsT("cancel")}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className={primaryActionClass}
                            onClick={() => onShowDeals?.(r)}
                          >
                            Ver deals
                          </button>
                          <button
                            className={primaryActionClass}
                            onClick={() =>
                              onOpenProfile({
                                id: r.userId,
                                email: r.email,
                                name: r.name,
                                role: r.role,
                                team: r.team,
                                image: r.image ?? null,
                              })
                            }
                          >
                            {actionsT("profile")}
                          </button>
                          {canAddManual && (
                            <button
                              className={primaryActionClass}
                              onClick={() => onAddManual({ id: r.userId, email: r.email, name: r.name })}
                            >
                              {billingT("manualCta")}
                            </button>
                          )}
                          <button
                            className={primaryActionClass}
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

                  <div className={`flex flex-col items-center justify-center rounded-xl px-4 py-2 ${perfColor.bg} shadow-sm`}>
                    <span className="text-2xl font-bold text-white leading-none">{pctSafe.toFixed(0)}%</span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80 mt-1">
                      Cumpl.
                    </span>
                  </div>
                </div>

                <div>
                  <div className={progressMetaRowClass}>
                    <span>Progreso visual</span>
                    <span className={progressValueClass}>{pctSafe.toFixed(1)}%</span>
                  </div>
                  <div className={progressTrackClass}>
                    <div
                      className={progressFillClass}
                      style={{ width: `${progressWidth}%` }}
                    />
                    {pctSafe > 100 && (
                      <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-amber-400 to-transparent opacity-70" />
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


