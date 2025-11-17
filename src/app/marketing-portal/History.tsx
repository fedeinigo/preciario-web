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

const QUICK_RANGE_BUTTON_CLASS =
  "rounded-full border border-transparent bg-[rgb(var(--marketing-surface-strong))]/80 px-3 py-1.5 text-xs font-semibold text-[rgb(var(--marketing-primary))] transition hover:bg-[rgb(var(--marketing-primary))]/15";

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
        <button
          key={range.label}
          type="button"
          className={QUICK_RANGE_BUTTON_CLASS}
          onClick={() => apply(range.get())}
        >
          {range.label}
        </button>
      ))}
      {quarters.map((q) => (
        <button
          key={q.label}
          type="button"
          className={QUICK_RANGE_BUTTON_CLASS}
          onClick={() => apply(q.get())}
        >
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

  const filterFieldClass =
    "rounded-2xl border border-[rgb(var(--marketing-ring))]/70 bg-white/90 px-4 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[rgb(var(--marketing-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--marketing-primary))]/25";
  const actionButtonClass =
    "inline-flex items-center justify-center rounded-full bg-[rgb(var(--marketing-primary))] px-6 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] transition hover:bg-[rgb(var(--marketing-primary))]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--marketing-primary))] disabled:opacity-50";
  const ghostButtonClass =
    "rounded-full border border-[rgb(var(--marketing-ring))]/70 px-5 py-2 text-sm font-semibold text-[rgb(var(--marketing-primary))] transition hover:bg-[rgb(var(--marketing-primary))]/10";
  const tableActionClass =
    "inline-flex items-center gap-2 rounded-full border border-[rgb(var(--marketing-ring))]/70 bg-white px-3 py-1.5 text-xs font-semibold text-[rgb(var(--marketing-primary))] transition hover:bg-[rgb(var(--marketing-primary))]/10";
  const dangerButtonClass =
    "inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(220,38,38,0.25)] transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300";

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
      <div className="flex flex-col gap-4 rounded-[32px] border border-[rgb(var(--marketing-ring))]/70 bg-white/85 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Histórico de informes</h2>
            <p className="text-sm text-slate-600">
              Consulta todos los documentos generados desde este portal y filtra por equipo, segmento, país y fechas.
            </p>
          </div>
          <button
            type="button"
            className={actionButtonClass}
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
                className={filterFieldClass}
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
              className={filterFieldClass}
              value={draftFilters.name}
              onChange={(event) => applyFilterChange("name", event.target.value)}
              placeholder="Ej: Análisis de Acme..."
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Empresa
            <input
              type="text"
              className={filterFieldClass}
              value={draftFilters.company}
              onChange={(event) => applyFilterChange("company", event.target.value)}
              placeholder="Filtra por empresa"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Email del creador
            <input
              type="email"
              className={filterFieldClass}
              value={draftFilters.email}
              onChange={(event) => applyFilterChange("email", event.target.value)}
              placeholder="usuario@dominio.com"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            País
            <select
              className={filterFieldClass}
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
              className={filterFieldClass}
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
              className={filterFieldClass}
              value={draftFilters.from}
              max={draftFilters.to || undefined}
              onChange={(event) => applyFilterChange("from", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Hasta
            <input
              type="date"
              className={filterFieldClass}
              value={draftFilters.to}
              min={draftFilters.from || undefined}
              onChange={(event) => applyFilterChange("to", event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-[rgb(var(--marketing-ring))]/70 bg-[rgb(var(--marketing-surface-strong))]/80 p-4 shadow-inner shadow-sky-100/40">
          <span className="text-sm font-medium text-slate-700">Atajos de fechas</span>
          <QuickRanges
            setFrom={(value) => applyFilterChange("from", value)}
            setTo={(value) => applyFilterChange("to", value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={actionButtonClass}
            onClick={() => setAppliedFilters(() => ({ ...draftFilters }))}
            disabled={loading}
          >
            Aplicar filtros
          </button>
          <button type="button" className={ghostButtonClass} onClick={resetFilters} disabled={loading}>
            Limpiar filtros
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-[rgb(var(--marketing-ring))]/70 bg-white/95 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[rgb(var(--marketing-ring))]/60">
            <thead className="bg-[rgb(var(--marketing-surface-strong))] text-xs uppercase tracking-wide text-[rgb(var(--marketing-muted))]">
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
                  <tr key={report.id} className="hover:bg-[rgb(var(--marketing-surface))]/80">
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
                            className={tableActionClass}
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver
                          </a>
                          <button
                            type="button"
                            className={tableActionClass}
                            onClick={() => handleCopyLink(report.url)}
                          >
                            <Copy className="h-4 w-4" />
                            Copiar
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
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
        containerClassName="marketing-portal-theme"
        panelClassName="border-[rgb(var(--marketing-ring))]/80 bg-white/95 text-slate-900 shadow-[0_35px_110px_rgba(15,23,42,0.25)]"
        headerClassName="bg-[rgb(var(--marketing-card))] border-b border-[rgb(var(--marketing-ring))]/60 text-slate-900"
        titleClassName="text-lg font-semibold text-[rgb(var(--marketing-primary-strong))]"
        backdropClassName="bg-[rgba(12,74,110,0.35)]"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button type="button" className={ghostButtonClass} onClick={() => setConfirmId(null)}>
              Cancelar
            </button>
            <button type="button" className={dangerButtonClass} onClick={handleDelete}>
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
