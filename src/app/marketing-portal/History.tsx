"use client";

import React from "react";
import { Copy, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import { TableSkeletonRows } from "@/app/components/ui/Skeleton";
import { toast } from "@/app/components/ui/toast";
import { copyToClipboard } from "@/app/components/features/proposals/lib/clipboard";
import {
  currentMonthRange,
  prevMonthRange,
  currentWeekRange,
  prevWeekRange,
  q1Range,
  q2Range,
  q3Range,
  q4Range,
} from "@/app/components/features/proposals/lib/dateRanges";
import { formatDateTime } from "@/app/components/features/proposals/lib/format";

type MarketingReportItem = {
  id: string;
  documentId: string;
  name: string;
  companyName: string;
  country: string | null;
  segment: string | null;
  url: string;
  createdAt: string;
  creator: {
    id: string;
    email: string | null;
    name: string | null;
    team: string | null;
  };
};

type HistoryResponse = {
  data: MarketingReportItem[];
  meta?: {
    isAdmin?: boolean;
    isLeader?: boolean;
    countryOptions?: string[];
    segmentOptions?: string[];
    teamOptions?: string[];
  };
  error?: string;
};

type Filters = {
  team: string;
  name: string;
  company: string;
  email: string;
  country: string;
  segment: string;
  from: string;
  to: string;
};

const DEFAULT_FILTERS: Filters = {
  team: "",
  name: "",
  company: "",
  email: "",
  country: "",
  segment: "",
  from: "",
  to: "",
};

function QuickRanges({ setFrom, setTo }: { setFrom: (value: string) => void; setTo: (value: string) => void }) {
  const year = new Date().getFullYear();
  const apply = (range: { from: string; to: string }) => {
    setFrom(range.from);
    setTo(range.to);
  };

  const ranges = [
    { label: "Este mes", get: currentMonthRange },
    { label: "Mes anterior", get: prevMonthRange },
    { label: "Semana actual", get: currentWeekRange },
    { label: "Semana anterior", get: prevWeekRange },
  ];

  const quarters = [
    { label: `Q1 ${year}`, get: () => q1Range(year) },
    { label: `Q2 ${year}`, get: () => q2Range(year) },
    { label: `Q3 ${year}`, get: () => q3Range(year) },
    { label: `Q4 ${year}`, get: () => q4Range(year) },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {ranges.map((range) => (
        <button key={range.label} type="button" className="btn-ghost !py-1" onClick={() => apply(range.get())}>
          {range.label}
        </button>
      ))}
      {quarters.map((q) => (
        <button key={q.label} type="button" className="btn-ghost !py-1" onClick={() => apply(q.get())}>
          {q.label}
        </button>
      ))}
    </div>
  );
}

export default function MarketingHistory() {
  const [reports, setReports] = React.useState<MarketingReportItem[]>([]);
  const [meta, setMeta] = React.useState<HistoryResponse["meta"]>();
  const [draftFilters, setDraftFilters] = React.useState<Filters>(() => ({ ...DEFAULT_FILTERS }));
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(() => ({ ...DEFAULT_FILTERS }));
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const isAdmin = Boolean(meta?.isAdmin);
  const isLeader = Boolean(meta?.isLeader);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (appliedFilters.team) params.set("team", appliedFilters.team);
      if (appliedFilters.name) params.set("name", appliedFilters.name);
      if (appliedFilters.company) params.set("company", appliedFilters.company);
      if (appliedFilters.email) params.set("email", appliedFilters.email);
      if (appliedFilters.country) params.set("country", appliedFilters.country);
      if (appliedFilters.segment) params.set("segment", appliedFilters.segment);
      if (appliedFilters.from) params.set("from", appliedFilters.from);
      if (appliedFilters.to) params.set("to", appliedFilters.to);

      const res = await fetch(`/api/marketing/documents?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      const payload = (await res.json()) as HistoryResponse;

      if (!res.ok) {
        throw new Error(payload?.error ?? "No se pudo obtener el histórico");
      }

      setReports(Array.isArray(payload.data) ? payload.data : []);
      setMeta(payload.meta);
    } catch (err) {
      setReports([]);
      setMeta(undefined);
      setError(err instanceof Error ? err.message : "Error inesperado al cargar el histórico");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  React.useEffect(() => {
    load();
  }, [load, refreshKey]);

  React.useEffect(() => {
    const onFocus = () => setRefreshKey((key) => key + 1);
    const onRefresh = () => setRefreshKey((key) => key + 1);
    window.addEventListener("focus", onFocus);
    window.addEventListener("marketing-history:refresh", onRefresh as EventListener);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("marketing-history:refresh", onRefresh as EventListener);
    };
  }, []);

  const resetFilters = () => {
    const defaults = { ...DEFAULT_FILTERS };
    setDraftFilters(() => defaults);
    setAppliedFilters(() => defaults);
  };

  const applyFilterChange = (field: keyof Filters, value: string) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleCopyLink = async (url: string) => {
    if (!url) return;
    const ok = await copyToClipboard(url);
    if (ok) toast.success("Enlace copiado al portapapeles");
    else toast.error("No se pudo copiar el enlace");
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      const res = await fetch(`/api/marketing/documents/${confirmId}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        const message = payload?.error ?? "No se pudo eliminar el informe";
        throw new Error(message);
      }
      toast.success("Informe eliminado");
      setConfirmId(null);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar el informe");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white/85 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Histórico de informes</h2>
            <p className="text-sm text-slate-500">
              Consulta todos los documentos generados desde este portal y filtra por equipo, segmento, país y fechas.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {(isAdmin || isLeader) && (
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Equipo
              <select
                className="select"
                value={draftFilters.team}
                onChange={(event) => applyFilterChange("team", event.target.value)}
              >
                <option value="">Todos</option>
                {(meta?.teamOptions ?? []).map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Nombre del documento
            <input
              type="text"
              className="input"
              value={draftFilters.name}
              onChange={(event) => applyFilterChange("name", event.target.value)}
              placeholder="Ej: Análisis de Acme..."
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Empresa
            <input
              type="text"
              className="input"
              value={draftFilters.company}
              onChange={(event) => applyFilterChange("company", event.target.value)}
              placeholder="Filtra por empresa"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Email del creador
            <input
              type="email"
              className="input"
              value={draftFilters.email}
              onChange={(event) => applyFilterChange("email", event.target.value)}
              placeholder="usuario@dominio.com"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            País
            <select
              className="select"
              value={draftFilters.country}
              onChange={(event) => applyFilterChange("country", event.target.value)}
            >
              <option value="">Todos</option>
              {(meta?.countryOptions ?? []).map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Segmento
            <select
              className="select"
              value={draftFilters.segment}
              onChange={(event) => applyFilterChange("segment", event.target.value)}
            >
              <option value="">Todos</option>
              {(meta?.segmentOptions ?? []).map((segment) => (
                <option key={segment} value={segment}>
                  {segment}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Desde
            <input
              type="date"
              className="input"
              value={draftFilters.from}
              max={draftFilters.to || undefined}
              onChange={(event) => applyFilterChange("from", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Hasta
            <input
              type="date"
              className="input"
              value={draftFilters.to}
              min={draftFilters.from || undefined}
              onChange={(event) => applyFilterChange("to", event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <span className="text-sm font-medium text-slate-700">Atajos de fechas</span>
          <QuickRanges
            setFrom={(value) => applyFilterChange("from", value)}
            setTo={(value) => applyFilterChange("to", value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setAppliedFilters(() => ({ ...draftFilters }))}
            disabled={loading}
          >
            Aplicar filtros
          </button>
          <button type="button" className="btn-ghost" onClick={resetFilters} disabled={loading}>
            Limpiar filtros
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">País</th>
                <th className="px-4 py-3 text-left">Segmento</th>
                <th className="px-4 py-3 text-left">Email del creador</th>
                <th className="px-4 py-3 text-left">Fecha de creación</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeletonRows rows={6} cols={6} />
            ) : (
              <tbody className="divide-y divide-slate-100">
                {reports.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 text-center text-sm text-slate-500" colSpan={6}>
                      No hay informes que coincidan con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{report.name}</span>
                          <span className="text-xs text-slate-500">{report.companyName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{report.country ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{report.segment ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{report.creator.email ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDateTime(report.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={report.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-bar inline-flex items-center gap-2 !py-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver
                          </a>
                          <button
                            type="button"
                            className="btn-bar inline-flex items-center gap-2 !py-1"
                            onClick={() => handleCopyLink(report.url)}
                          >
                            <Copy className="h-4 w-4" />
                            Copiar
                          </button>
                          <button
                            type="button"
                            className="btn-ghost inline-flex items-center gap-2 !py-1 text-red-600 hover:bg-red-50"
                            onClick={() => setConfirmId(report.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            )}
          </table>
        </div>
      </div>

      <Modal
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        title="Eliminar informe"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setConfirmId(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Eliminar
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          Esta acción elimina el registro del histórico y, cuando es posible, también el documento asociado en Google Docs.
        </p>
      </Modal>
    </div>
  );
}
