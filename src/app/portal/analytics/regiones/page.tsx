"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Globe,
  TrendingUp,
  Clock,
  MapPin,
  Loader2,
} from "lucide-react";
import { useAnalyticsData, getDefaultFilters, type AnalyticsFilters } from "@/hooks/useAnalyticsData";
import { SyncButton } from "../components/SyncButton";
import { AnalyticsFilters as FiltersComponent } from "../components/AnalyticsFilters";

const REGION_COLORS: Record<string, string> = {
  Colombia: "#3b82f6",
  Argentina: "#10b981",
  Mexico: "#f59e0b",
  Brasil: "#ef4444",
  España: "#8b5cf6",
  Chile: "#0ea5e9",
  Peru: "#f97316",
  "Rest Latam": "#6b7280",
};

const REGION_BG_COLORS: Record<string, string> = {
  Colombia: "bg-blue-50 border-blue-200",
  Argentina: "bg-emerald-50 border-emerald-200",
  Mexico: "bg-amber-50 border-amber-200",
  Brasil: "bg-red-50 border-red-200",
  España: "bg-violet-50 border-violet-200",
  Chile: "bg-sky-50 border-sky-200",
  Peru: "bg-orange-50 border-orange-200",
  "Rest Latam": "bg-gray-50 border-gray-200",
};

export default function AnalyticsRegionesPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(getDefaultFilters);

  const {
    stats,
    deals,
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

  const regions = useMemo(() => {
    return Array.from(stats.byRegion.entries())
      .map(([region, data]) => ({
        region,
        meetings: data.meetings,
        logos: data.logos,
        revenue: data.revenue,
        avgDays: data.avgDays || 45,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [stats.byRegion]);

  const topOriginsByRegion = useMemo(() => {
    const originsByRegion = new Map<string, Map<string, number>>();

    for (const deal of deals) {
      const title = deal.title.toLowerCase();
      let region = "Rest Latam";
      if (title.includes("colombia") || title.includes("col")) region = "Colombia";
      else if (title.includes("argentina") || title.includes("arg")) region = "Argentina";
      else if (title.includes("mexico") || title.includes("mex") || title.includes("méxico")) region = "Mexico";
      else if (title.includes("brasil") || title.includes("brazil") || title.includes("br")) region = "Brasil";
      else if (title.includes("españa") || title.includes("spain") || title.includes("esp")) region = "España";
      else if (title.includes("chile") || title.includes("cl")) region = "Chile";
      else if (title.includes("peru") || title.includes("perú")) region = "Peru";

      if (!originsByRegion.has(region)) {
        originsByRegion.set(region, new Map());
      }

      const stageName = deal.stageName?.toLowerCase() ?? "";
      let source = "Otros";
      if (stageName.includes("inbound")) source = "Inbound";
      else if (stageName.includes("outbound")) source = "Outbound";
      else if (stageName.includes("referral") || stageName.includes("referido")) source = "Referral";
      else if (stageName.includes("partner")) source = "Partner";
      else if (stageName.includes("marketing")) source = "Marketing";

      const sourceMap = originsByRegion.get(region)!;
      sourceMap.set(source, (sourceMap.get(source) ?? 0) + (deal.value ?? 0));
    }

    return Array.from(originsByRegion.entries())
      .map(([region, sources]) => ({
        region,
        origins: Array.from(sources.entries())
          .map(([origin, revenue]) => ({ origin, revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3),
      }))
      .sort((a, b) => {
        const aTotal = a.origins.reduce((s, o) => s + o.revenue, 0);
        const bTotal = b.origins.reduce((s, o) => s + o.revenue, 0);
        return bTotal - aTotal;
      })
      .slice(0, 6);
  }, [deals]);

  if (isLoading && !hasData) {
    return (
      <div className="min-h-[calc(100vh-var(--nav-h))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-slate-500">Cargando datos...</p>
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
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="relative rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/10 p-4 sm:p-6 border border-slate-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 rounded-xl">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Regiones Estrategicas
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Analisis de rendimiento por region geografica
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-semibold text-slate-800">
                USD Cerrados por Region
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Ingresos totales por region
            </p>
            <div className="space-y-3">
              {regions.slice(0, 6).map((r) => {
                const maxRevenue = Math.max(...regions.map((x) => x.revenue), 1);
                return (
                  <div key={r.region} className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: REGION_COLORS[r.region] || "#6b7280" }}
                    />
                    <span className="text-sm text-slate-700 w-24">{r.region}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="h-full rounded flex items-center justify-end px-2"
                        style={{
                          backgroundColor: REGION_COLORS[r.region] || "#6b7280",
                          width: `${(r.revenue / maxRevenue) * 100}%`,
                        }}
                      >
                        <span className="text-[10px] text-white font-medium">
                          {formatCurrency(r.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-semibold text-slate-800">
                Ciclo de Ventas por Region
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Promedio de dias para cerrar (deals ganados)
            </p>
            <div className="space-y-3">
              {regions.slice(0, 6).map((r) => (
                <div key={r.region} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: REGION_COLORS[r.region] || "#6b7280" }}
                  />
                  <span className="text-sm text-slate-700 w-24">{r.region}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: REGION_COLORS[r.region] || "#6b7280",
                        width: `${(r.avgDays / 60) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-600 w-12 text-right">
                    {r.avgDays}d
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-semibold text-slate-800">
                Top Origenes por Region
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Origenes con mayor revenue por cada celula
            </p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {topOriginsByRegion.map((r) => (
                <div
                  key={r.region}
                  className={`rounded-lg border p-3 ${REGION_BG_COLORS[r.region] || "bg-gray-50 border-gray-200"}`}
                >
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-current/10">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: REGION_COLORS[r.region] || "#6b7280" }}
                    />
                    <h4 className="font-semibold text-sm text-slate-800">
                      {r.region}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {r.origins.map((origin) => (
                      <div
                        key={origin.origin}
                        className="flex justify-between text-xs gap-2"
                      >
                        <span className="truncate text-slate-600">
                          {origin.origin}
                        </span>
                        <span className="font-semibold text-slate-800 whitespace-nowrap">
                          {formatCurrency(origin.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-base font-semibold text-slate-800">
              Metricas por Region Estrategica
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Resumen de reuniones, logos y revenue
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                    Region
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Reuniones
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Logos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Ciclo (dias)
                  </th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r) => (
                  <tr
                    key={r.region}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: REGION_COLORS[r.region] || "#6b7280" }}
                        />
                        <span className="text-sm font-medium text-slate-800">
                          {r.region}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {r.meetings}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {r.logos}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">
                      {formatCurrency(r.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {r.avgDays}
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
