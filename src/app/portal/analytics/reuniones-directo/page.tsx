"use client";

import { useState } from "react";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function AnalyticsReunionesDirectoPage() {
  const [isLoading] = useState(false);

  const totals = {
    meetings: 156,
    value: 245000,
    funnelActual: 180000,
    avgTicket: 4250,
  };

  const weeklyData = [
    { week: "S1", count: 18, value: 32000 },
    { week: "S2", count: 22, value: 38000 },
    { week: "S3", count: 15, value: 28000 },
    { week: "S4", count: 28, value: 45000 },
    { week: "S5", count: 25, value: 42000 },
    { week: "S6", count: 20, value: 35000 },
  ];

  const sdrSummary = [
    { sdr: "Pablo Torres", totalDeals: 28 },
    { sdr: "Laura Mendez", totalDeals: 24 },
    { sdr: "Diego Ruiz", totalDeals: 22 },
    { sdr: "Carmen Diaz", totalDeals: 18 },
    { sdr: "Roberto Silva", totalDeals: 15 },
  ];

  const bdrSummary = [
    { bdr: "Juan Perez", totalDeals: 32 },
    { bdr: "Maria Garcia", totalDeals: 28 },
    { bdr: "Carlos Rodriguez", totalDeals: 25 },
    { bdr: "Ana Martinez", totalDeals: 20 },
    { bdr: "Luis Fernandez", totalDeals: 18 },
  ];

  const maxSdrDeals = Math.max(...sdrSummary.map((s) => s.totalDeals), 1);
  const maxBdrDeals = Math.max(...bdrSummary.map((b) => b.totalDeals), 1);

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
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Reuniones Directo
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Analisis de deals de origen directo (Pipeline 1 - Directo +
                Inbound + Outbound)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={Calendar}
            title="Total Reuniones"
            value={totals.meetings.toString()}
            borderColor="border-l-purple-500"
          />
          <KPICard
            icon={DollarSign}
            title="Valor Total"
            value={`$${totals.value.toLocaleString()}`}
            borderColor="border-l-emerald-500"
          />
          <KPICard
            icon={Target}
            title="Funnel Actual"
            value={`$${totals.funnelActual.toLocaleString()}`}
            borderColor="border-l-violet-500"
          />
          <KPICard
            icon={TrendingUp}
            title="Ticket Promedio"
            value={`$${totals.avgTicket.toLocaleString()}`}
            borderColor="border-l-amber-500"
          />
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Asignacion SDR → BDR (Owner Actual)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quien creo el deal (SDR) y quien es el propietario actual
                  (BDR)
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-800">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Top SDRs (Creadores)
                </h4>
                <div className="space-y-2">
                  {sdrSummary.map((s, idx) => {
                    const percentage = (s.totalDeals / maxSdrDeals) * 100;
                    return (
                      <div key={s.sdr} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="truncate font-medium text-slate-700">
                            {idx + 1}. {s.sdr}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                            {s.totalDeals}
                          </span>
                        </div>
                        <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-emerald-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Top BDRs (Owners)
                </h4>
                <div className="space-y-2">
                  {bdrSummary.map((b, idx) => {
                    const percentage = (b.totalDeals / maxBdrDeals) * 100;
                    return (
                      <div key={b.bdr} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="truncate font-medium text-slate-700">
                            {idx + 1}. {b.bdr}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-xs font-medium text-emerald-600">
                            {b.totalDeals}
                          </span>
                        </div>
                        <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-semibold text-slate-800">
                Reuniones Directas por Semana
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Evolucion semanal de reuniones
            </p>
            <div className="space-y-3">
              {weeklyData.map((w) => (
                <div key={w.week} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-8">{w.week}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded flex items-center justify-end px-2"
                      style={{ width: `${(w.count / 30) * 100}%` }}
                    >
                      <span className="text-[10px] text-white font-medium">
                        {w.count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-semibold text-slate-800">
                Valor por Semana
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Evolucion del valor en USD
            </p>
            <div className="space-y-3">
              {weeklyData.map((w) => (
                <div key={w.week} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-8">{w.week}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded flex items-center justify-end px-2"
                      style={{ width: `${(w.value / 50000) * 100}%` }}
                    >
                      <span className="text-[10px] text-white font-medium">
                        ${(w.value / 1000).toFixed(0)}k
                      </span>
                    </div>
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

function KPICard({
  icon: Icon,
  title,
  value,
  borderColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  borderColor: string;
}) {
  return (
    <div
      className={`relative rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm border-l-4 ${borderColor}`}
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
    </div>
  );
}
