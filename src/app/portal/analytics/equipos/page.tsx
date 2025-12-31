"use client";

import { useState } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Briefcase,
  Trophy,
  ArrowUpDown,
  Loader2,
} from "lucide-react";

export default function AnalyticsEquiposPage() {
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [isLoading] = useState(false);

  const teams = [
    { id: "all", name: "Todos los Equipos" },
    { id: "1", name: "Aguilas" },
    { id: "2", name: "Halcones" },
    { id: "3", name: "Panteras" },
  ];

  const executives = [
    { name: "Juan Perez", team: "Aguilas", revenue: 45000, won: 12, closureRate: 28, avgTicket: 3750, funnel: 25000 },
    { name: "Maria Garcia", team: "Halcones", revenue: 38000, won: 10, closureRate: 24, avgTicket: 3800, funnel: 18000 },
    { name: "Carlos Rodriguez", team: "Panteras", revenue: 32000, won: 8, closureRate: 22, avgTicket: 4000, funnel: 15000 },
    { name: "Ana Martinez", team: "Aguilas", revenue: 28000, won: 7, closureRate: 20, avgTicket: 4000, funnel: 12000 },
    { name: "Luis Fernandez", team: "Halcones", revenue: 25000, won: 6, closureRate: 18, avgTicket: 4166, funnel: 10000 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-var(--nav-h))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-slate-500">Cargando datos de equipos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-var(--nav-h))] px-4 pb-16 sm:px-6 lg:px-8 pt-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="relative rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/10 p-4 sm:p-6 border border-slate-200/50">
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
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex flex-col gap-4 w-[180px] flex-shrink-0">
            <div className="flex items-center justify-center w-[180px] h-[180px] rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-purple-50/30 overflow-hidden">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Users className="w-12 h-12 opacity-30" />
                <span className="text-xs">Selecciona un equipo</span>
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

          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniKPI icon={DollarSign} title="Revenue" value="$168,000" />
            <MiniKPI icon={Trophy} title="Logos" value="43" />
            <MiniKPI icon={Target} title="Closure" value="23%" />
            <MiniKPI icon={Briefcase} title="Ticket Prom." value="$3,906" />
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
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100">
                      <div className="flex items-center justify-end gap-1">
                        Revenue
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      Won
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      Closure
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      Ticket
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      Funnel
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {executives.map((exec, idx) => (
                    <tr
                      key={exec.name}
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
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                          {exec.team}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        ${exec.revenue.toLocaleString()}
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
                        ${exec.avgTicket.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        ${exec.funnel.toLocaleString()}
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
                  key={exec.name}
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
                    <span className="text-[10px] text-slate-400">
                      Grafico mini
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-purple-500" />
        <span className="text-xs text-slate-500">{title}</span>
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
