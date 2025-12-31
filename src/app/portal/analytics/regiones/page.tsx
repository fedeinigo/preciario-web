"use client";

import { useState } from "react";
import {
  Globe,
  TrendingUp,
  Clock,
  MapPin,
  Loader2,
} from "lucide-react";

const REGION_COLORS: Record<string, string> = {
  Colombia: "#3b82f6",
  Argentina: "#10b981",
  Mexico: "#f59e0b",
  Brasil: "#ef4444",
  España: "#8b5cf6",
  "Rest Latam": "#6b7280",
};

const REGION_BG_COLORS: Record<string, string> = {
  Colombia: "bg-blue-50 border-blue-200",
  Argentina: "bg-emerald-50 border-emerald-200",
  Mexico: "bg-amber-50 border-amber-200",
  Brasil: "bg-red-50 border-red-200",
  España: "bg-violet-50 border-violet-200",
  "Rest Latam": "bg-gray-50 border-gray-200",
};

export default function AnalyticsRegionesPage() {
  const [isLoading] = useState(false);

  const regions = [
    { region: "Colombia", meetings: 45, logos: 12, revenue: 48000, avgDays: 38 },
    { region: "Argentina", meetings: 38, logos: 10, revenue: 42000, avgDays: 42 },
    { region: "Mexico", meetings: 32, logos: 8, revenue: 35000, avgDays: 45 },
    { region: "Brasil", meetings: 28, logos: 6, revenue: 28000, avgDays: 52 },
    { region: "España", meetings: 22, logos: 5, revenue: 22000, avgDays: 48 },
    { region: "Rest Latam", meetings: 18, logos: 4, revenue: 15000, avgDays: 55 },
  ];

  const topOriginsByRegion = [
    { region: "Colombia", origins: [{ origin: "Inbound", revenue: 18000 }, { origin: "Referral", revenue: 15000 }, { origin: "Outbound", revenue: 10000 }] },
    { region: "Argentina", origins: [{ origin: "Partner", revenue: 16000 }, { origin: "Inbound", revenue: 14000 }, { origin: "Events", revenue: 8000 }] },
    { region: "Mexico", origins: [{ origin: "Outbound", revenue: 15000 }, { origin: "Inbound", revenue: 12000 }, { origin: "Referral", revenue: 5000 }] },
    { region: "Brasil", origins: [{ origin: "Partner", revenue: 12000 }, { origin: "Inbound", revenue: 10000 }, { origin: "Events", revenue: 4000 }] },
    { region: "España", origins: [{ origin: "Inbound", revenue: 10000 }, { origin: "Partner", revenue: 8000 }, { origin: "Referral", revenue: 3000 }] },
    { region: "Rest Latam", origins: [{ origin: "Partner", revenue: 8000 }, { origin: "Inbound", revenue: 5000 }, { origin: "Outbound", revenue: 2000 }] },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-var(--nav-h))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-slate-500">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-var(--nav-h))] px-4 pb-16 sm:px-6 lg:px-8 pt-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="relative rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/10 p-4 sm:p-6 border border-slate-200/50">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-semibold text-slate-800">
                USD Cerrados por Region
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Evolucion de ingresos por region
            </p>
            <div className="h-[250px] rounded-lg bg-gradient-to-br from-slate-50 to-purple-50/30 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Grafico de lineas</p>
              </div>
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
              {regions.map((r) => (
                <div key={r.region} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: REGION_COLORS[r.region] }}
                  />
                  <span className="text-sm text-slate-700 w-24">{r.region}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: REGION_COLORS[r.region],
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
                Top 5 Origenes por Region
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
                  className={`rounded-lg border p-3 ${REGION_BG_COLORS[r.region]}`}
                >
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-current/10">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: REGION_COLORS[r.region] }}
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
                          ${origin.revenue.toLocaleString()}
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
                          style={{ backgroundColor: REGION_COLORS[r.region] }}
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
                      ${r.revenue.toLocaleString()}
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
