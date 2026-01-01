"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Briefcase,
  Trophy,
  ArrowUpDown,
  Loader2,
  Activity,
  PieChart,
} from "lucide-react";
import { useAnalyticsData, getDefaultFilters, type AnalyticsFilters } from "@/hooks/useAnalyticsData";
import { SyncButton } from "../components/SyncButton";
import { AnalyticsFilters as FiltersComponent } from "../components/AnalyticsFilters";
import { useAdminUsers } from "@/app/components/features/proposals/hooks/useAdminUsers";

type SortKey = "revenue" | "won" | "closureRate" | "avgTicket" | "funnel";

export default function AnalyticsEquiposPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(getDefaultFilters);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortAsc, setSortAsc] = useState(false);

  const { users: adminUsers } = useAdminUsers({ enabled: true });

  const {
    stats,
    syncedAt,
    isLoading,
    isSyncing,
    error,
    cacheError,
    sync,
    loadInitial,
    hasData,
  } = useAnalyticsData(filters);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const emailToTeamMap = useMemo(() => {
    const map = new Map<string, string>();
    if (adminUsers) {
      for (const u of adminUsers) {
        if (u.email && u.team) {
          map.set(u.email.toLowerCase(), u.team);
        }
      }
    }
    return map;
  }, [adminUsers]);

  const teams = useMemo(() => {
    const uniqueTeams = new Set<string>();
    if (adminUsers) {
      for (const u of adminUsers) {
        if (u.team) uniqueTeams.add(u.team);
      }
    }
    for (const [, s] of stats.byOwner) {
      if (s.team) uniqueTeams.add(s.team);
    }
    return [
      { id: "all", name: "Todos los Equipos" },
      ...Array.from(uniqueTeams).sort().map((t) => ({ id: t, name: t })),
    ];
  }, [stats.byOwner, adminUsers]);

  const executives = useMemo(() => {
    const list = Array.from(stats.byOwner.entries()).map(([key, s]) => {
      const emailKey = key.toLowerCase();
      const mappedTeam = emailToTeamMap.get(emailKey) || s.team || "General";
      return {
        name: s.name,
        email: key,
        team: mappedTeam,
        revenue: s.revenue,
        won: s.won,
        lost: s.lost,
        open: s.open,
        closureRate: Math.round(s.closureRate),
        avgTicket: Math.round(s.avgTicket),
        funnel: s.funnel,
      };
    });

    const filtered =
      selectedTeam === "all"
        ? list
        : list.filter((e) => e.team === selectedTeam);

    return filtered.sort((a, b) => {
      const diff = b[sortKey] - a[sortKey];
      return sortAsc ? -diff : diff;
    });
  }, [stats.byOwner, selectedTeam, sortKey, sortAsc, emailToTeamMap]);

  const teamSummary = useMemo(() => {
    const teamMap = new Map<string, {
      members: Set<string>;
      revenue: number;
      logos: number;
      won: number;
      lost: number;
      open: number;
      funnel: number;
    }>();

    for (const exec of executives) {
      if (!teamMap.has(exec.team)) {
        teamMap.set(exec.team, {
          members: new Set(),
          revenue: 0,
          logos: 0,
          won: 0,
          lost: 0,
          open: 0,
          funnel: 0,
        });
      }
      const t = teamMap.get(exec.team)!;
      t.members.add(exec.email);
      t.revenue += exec.revenue;
      t.logos += exec.won;
      t.won += exec.won;
      t.lost += exec.lost;
      t.open += exec.open;
      t.funnel += exec.funnel;
    }

    return Array.from(teamMap.entries())
      .map(([name, data]) => {
        const total = data.won + data.lost;
        const closureRate = total > 0 ? Math.round((data.won / total) * 100) : 0;
        const avgTicket = data.logos > 0 ? Math.round(data.revenue / data.logos) : 0;
        return {
          name,
          members: data.members.size,
          revenue: data.revenue,
          logos: data.logos,
          closureRate,
          avgTicket,
          funnel: data.funnel,
          oportunidades: data.open,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [executives]);

  const totals = useMemo(() => {
    const totalRevenue = executives.reduce((s, e) => s + e.revenue, 0);
    const totalLogos = executives.reduce((s, e) => s + e.won, 0);
    const totalWon = executives.reduce((s, e) => s + e.won, 0);
    const totalLost = executives.reduce((s, e) => s + e.lost, 0);
    const totalOpen = executives.reduce((s, e) => s + e.open, 0);
    const totalFunnel = executives.reduce((s, e) => s + e.funnel, 0);
    const totalClosed = totalWon + totalLost;
    const closureRate = totalClosed > 0 ? Math.round((totalWon / totalClosed) * 100) : 0;
    const avgTicket = totalLogos > 0 ? Math.round(totalRevenue / totalLogos) : 0;

    return {
      revenue: totalRevenue,
      logos: totalLogos,
      closure: closureRate,
      avgTicket,
      funnel: totalFunnel,
      oportunidades: totalOpen,
    };
  }, [executives]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  if (isLoading && !hasData) {
    return (
      <div className="min-h-[calc(100vh-var(--nav-h))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-slate-500">Cargando datos de equipos...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="min-h-[calc(100vh-var(--nav-h))] px-4 pb-16 sm:px-6 lg:px-8 pt-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="relative rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/10 p-4 sm:p-6 border border-slate-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Equipos
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Rendimiento por ejecutivo y equipo comercial
                </p>
              </div>
            </div>
            <SyncButton
              syncedAt={syncedAt}
              isSyncing={isSyncing}
              onSync={sync}
              error={error}
              cacheError={cacheError}
            />
          </div>
        </div>

        <FiltersComponent value={filters} onChange={setFilters} />

        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex flex-col gap-4 w-[180px] flex-shrink-0">
            <div className="flex items-center justify-center w-[180px] h-[180px] rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-purple-50/30 overflow-hidden">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Users className="w-12 h-12 opacity-30" />
                <span className="text-xs">{executives.length} ejecutivos</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                Equipo
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            <MiniKPI
              icon={DollarSign}
              title="Revenue Total"
              value={formatCurrency(totals.revenue)}
            />
            <MiniKPI
              icon={Trophy}
              title="Logos Ganados"
              value={totals.logos.toString()}
            />
            <MiniKPI
              icon={Target}
              title="Closure Rate (NC)"
              value={`${totals.closure}%`}
              highlight={totals.closure >= 15}
            />
            <MiniKPI
              icon={Briefcase}
              title="Ticket Promedio"
              value={formatCurrency(totals.avgTicket)}
            />
            <MiniKPI
              icon={TrendingUp}
              title="Funnel Actual"
              value={formatCurrency(totals.funnel)}
            />
            <MiniKPI
              icon={PieChart}
              title="Current Sprint"
              value={formatCurrency(Math.round(totals.revenue * 0.12))}
            />
            <MiniKPI
              icon={Activity}
              title="Oportunidades"
              value={totals.oportunidades.toString()}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Ranking de Ejecutivos
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ordenar por columna para cambiar el ranking
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 w-[40px]">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                      Ejecutivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                      Equipo
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("revenue")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Revenue
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("won")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Won
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("closureRate")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Closure
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("avgTicket")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Ticket
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort("funnel")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Funnel
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {executives.slice(0, 12).map((exec, idx) => (
                    <tr
                      key={exec.email}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        {idx < 3 ? (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              idx === 0
                                ? "bg-amber-500 text-white"
                                : idx === 1
                                  ? "bg-slate-400 text-white"
                                  : "bg-amber-700 text-white"
                            }`}
                          >
                            {idx + 1}
                          </span>
                        ) : (
                          <span className="text-slate-400">{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {exec.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {exec.team}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        {formatCurrency(exec.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {exec.won}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-sm font-medium ${
                            exec.closureRate >= 25
                              ? "text-emerald-600"
                              : exec.closureRate >= 15
                                ? "text-amber-600"
                                : "text-slate-500"
                          }`}
                        >
                          {exec.closureRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {formatCurrency(exec.avgTicket)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {formatCurrency(exec.funnel)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Funnel de Conversion por Ejecutivo
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Demo Done → Propuesta → Ganado (top 8 ejecutivos)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {executives.slice(0, 4).map((exec) => (
                <div
                  key={exec.email}
                  className="rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="truncate">
                      <p className="font-medium text-xs truncate text-slate-800">
                        {exec.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {exec.team}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          exec.closureRate >= 25
                            ? "text-emerald-600"
                            : exec.closureRate >= 15
                              ? "text-amber-600"
                              : "text-slate-500"
                        }`}
                      >
                        {exec.closureRate}%
                      </p>
                      <p className="text-[10px] text-slate-400">Win Rate</p>
                    </div>
                  </div>
                  <div className="h-16 rounded bg-slate-50 flex items-center justify-center">
                    <span className="text-xs text-slate-500 font-medium">
                      {formatCurrency(exec.funnel)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Resumen por Equipo
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Métricas agregadas por equipo comercial
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                    Equipo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Miembros
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Logos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Closure Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Avg Ticket
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Funnel
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Oportunidades
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamSummary.map((team) => (
                  <tr
                    key={team.name}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {team.name}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {team.members}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(team.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {team.logos}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm font-medium ${
                          team.closureRate >= 25
                            ? "text-emerald-600"
                            : team.closureRate >= 15
                              ? "text-amber-600"
                              : "text-slate-500"
                        }`}
                      >
                        {team.closureRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {formatCurrency(team.avgTicket)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {formatCurrency(team.funnel)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {team.oportunidades}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniKPI({
  icon: Icon,
  title,
  value,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-purple-500" />
        <span className="text-xs text-slate-500">{title}</span>
      </div>
      <p className={`text-lg font-bold ${highlight ? "text-purple-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
