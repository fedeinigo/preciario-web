"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  Target,
  Clock,
  Briefcase,
  CalendarCheck,
  Banknote,
  Trophy,
  BarChart3,
  TrendingUp,
  UserPlus,
  ArrowUpCircle,
  Loader2,
} from "lucide-react";
import { useAnalyticsData, getDefaultFilters, type AnalyticsFilters } from "@/hooks/useAnalyticsData";
import { SyncButton } from "../components/SyncButton";
import { AnalyticsFilters as FiltersComponent } from "../components/AnalyticsFilters";

export default function AnalyticsDashboardPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(getDefaultFilters);

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

  if (isLoading && !hasData) {
    return (
      <div className="min-h-[calc(100vh-var(--nav-h))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-slate-500">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const topOwners = Array.from(stats.byOwner.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 3)
    .map(([, s]) => s.name);

  const topSources = Array.from(stats.bySource.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const topRegions = Array.from(stats.byRegion.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 3)
    .map(([name]) => name);

  return (
    <div className="min-h-[calc(100vh-var(--nav-h))] px-4 pb-16 sm:px-6 lg:px-8 pt-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="relative rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/10 p-4 sm:p-6 border border-slate-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-purple-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Resumen General
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Panel de control de metricas comerciales
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <KPICard
            title="Revenue Total"
            value={formatCurrency(stats.wonRevenue)}
            change={12.5}
            trend="up"
            icon={DollarSign}
            className="border-l-4 border-l-purple-500"
          />
          <KPICard
            title="Tasa de Cierre"
            value={`${stats.closureRate.toFixed(1)}%`}
            change={3.2}
            trend="up"
            icon={Target}
          />
          <KPICard
            title="Reuniones NC"
            value={stats.ncMeetings.toString()}
            change={-2.1}
            trend="down"
            icon={CalendarCheck}
          />
          <KPICard
            title="Logos Ganados"
            value={stats.wonDeals.toString()}
            change={8.0}
            trend="up"
            icon={Briefcase}
          />
          <KPICard
            title="Ciclo de Ventas"
            value={`${stats.avgCycleDays || 45} dias`}
            change={-5.0}
            trend="up"
            icon={Clock}
          />
          <KPICard
            title="Ticket Promedio"
            value={formatCurrency(stats.avgTicket)}
            change={15.3}
            trend="up"
            icon={Banknote}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <KPICard
            title="Total New Customers"
            value={formatCurrency(stats.ncRevenue)}
            change={18.5}
            trend="up"
            icon={UserPlus}
          />
          <KPICard
            title="Total Upselling"
            value={formatCurrency(stats.upsellingRevenue)}
            change={22.1}
            trend="up"
            icon={ArrowUpCircle}
          />
        </div>

        <div>
          <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Analisis de Tendencias
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <ChartPlaceholder title="Evolucion de Ingresos" />
            <ChartPlaceholder title="Tarjetas NC Creadas" />
            <ChartPlaceholder title="Tasa de Cierre" />
            <ChartPlaceholder title="Tamaño de Empresas" />
          </div>
        </div>

        <div>
          <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
            <Trophy className="w-5 h-5 text-amber-500" />
            Rankings de Rendimiento
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <RankingCard
              title="Top Equipos"
              items={topRegions.length > 0 ? topRegions : ["--", "--", "--"]}
            />
            <RankingCard
              title="Top Personas"
              items={topOwners.length > 0 ? topOwners : ["--", "--", "--"]}
            />
            <RankingCard
              title="Top Sources"
              items={topSources.length > 0 ? topSources : ["--", "--", "--"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  className = "",
}: {
  title: string;
  value: string;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const trendColor =
    trend === "up"
      ? "text-emerald-600 bg-emerald-50"
      : trend === "down"
        ? "text-red-600 bg-red-50"
        : "text-slate-600 bg-slate-50";

  return (
    <div
      className={`relative rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-lg bg-purple-50 p-2">
          <Icon className="h-5 w-5 text-purple-600" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${trendColor}`}
        >
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {Math.abs(change)}%
        </span>
        <span className="text-xs text-slate-400">vs periodo anterior</span>
      </div>
    </div>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-700 mb-3">{title}</h4>
      <div className="h-[180px] rounded-lg bg-gradient-to-br from-slate-50 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Grafico disponible pronto</p>
        </div>
      </div>
    </div>
  );
}

function RankingCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        {title}
      </h4>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0
                    ? "bg-amber-100 text-amber-700"
                    : idx === 1
                      ? "bg-slate-200 text-slate-600"
                      : "bg-orange-100 text-orange-700"
                }`}
              >
                {idx + 1}
              </span>
              <span className="text-sm font-medium text-slate-700">{item}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
