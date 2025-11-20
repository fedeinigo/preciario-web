"use client";

import * as React from "react";

import { ArrowDownWideNarrow, ArrowUpWideNarrow, Loader2 } from "lucide-react";

import Modal from "@/app/components/ui/Modal";
import { toast } from "@/app/components/ui/toast";
import type { PipedriveDealSummary } from "@/types/pipedrive";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});
const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type ApiResponse =
  | { ok: true; deals: PipedriveDealSummary[] }
  | { ok: false; error?: string };

const ACTION_BUTTON_CLASSES =
  "rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

const STATUS_OPTIONS: Array<{ value: "all" | "open" | "won"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Abiertos" },
  { value: "won", label: "Ganados" },
];

type SortKey = "title" | "stageName" | "ownerName" | "value";

export default function MapachePortalPipedrivePage() {
  const [deals, setDeals] = React.useState<PipedriveDealSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date | null>(null);
  const [selectedDeal, setSelectedDeal] = React.useState<PipedriveDealSummary | null>(null);
  const [stageFilter, setStageFilter] = React.useState("all");
  const [ownerFilter, setOwnerFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "open" | "won">("all");
  const [scopeDealTitle, setScopeDealTitle] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [quarterFilter, setQuarterFilter] = React.useState<number | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);

  const handleRefresh = React.useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/pipedrive/deals");
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error("Error de red");
      }
      if (!payload.ok) {
        throw new Error(payload.error ?? "Respuesta inválida");
      }
      setDeals(payload.deals ?? []);
      setLastSyncedAt(new Date());
      toast.success("Deals actualizados");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`No se pudieron cargar los deals: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const lastSyncedLabel = lastSyncedAt ? DATE_FORMATTER.format(lastSyncedAt) : "—";

  const availableStages = React.useMemo(() => {
    const set = new Set<string>();
    let hasUnknown = false;
    deals.forEach((deal) => {
      if (deal.stageName) {
        set.add(deal.stageName);
      } else {
        hasUnknown = true;
      }
    });
    if (hasUnknown) {
      set.add("—");
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [deals]);

  const availableOwners = React.useMemo(() => {
    const set = new Set<string>();
    deals.forEach((deal) => {
      if (deal.ownerName) set.add(deal.ownerName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [deals]);

  const filteredDeals = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return deals.filter((deal) => {
      const matchesStage =
        stageFilter === "all" ||
        (stageFilter === "—" ? !deal.stageName : deal.stageName === stageFilter);
      const matchesOwner = ownerFilter === "all" || deal.ownerName === ownerFilter;
      const matchesStatus =
        statusFilter === "all" || (deal.status ? deal.status === statusFilter : false);
      const matchesQuarter =
        quarterFilter === null || deal.wonQuarter === quarterFilter;
      const matchesSearch =
        !normalizedSearch ||
        deal.title.toLowerCase().includes(normalizedSearch) ||
        (deal.ownerName?.toLowerCase().includes(normalizedSearch) ?? false);
      return (
        matchesStage &&
        matchesOwner &&
        matchesStatus &&
        matchesQuarter &&
        matchesSearch
      );
    });
  }, [deals, ownerFilter, quarterFilter, searchTerm, stageFilter, statusFilter]);

  const sortedDeals = React.useMemo(() => {
    if (!sortConfig) return filteredDeals;
    const { key, direction } = sortConfig;
    const copy = [...filteredDeals];
    copy.sort((a, b) => {
      const multiplier = direction === "asc" ? 1 : -1;
      if (key === "value") {
        const aVal = a.value ?? 0;
        const bVal = b.value ?? 0;
        return (aVal - bVal) * multiplier;
      }
      const aText = (a[key] ?? "").toString().toLowerCase();
      const bText = (b[key] ?? "").toString().toLowerCase();
      return aText.localeCompare(bText) * multiplier;
    });
    return copy;
  }, [filteredDeals, sortConfig]);

  const hasFiltersApplied = React.useMemo(() => {
    return (
      stageFilter !== "all" ||
      ownerFilter !== "all" ||
      statusFilter !== "all" ||
      Boolean(searchTerm.trim()) ||
      quarterFilter !== null
    );
  }, [ownerFilter, quarterFilter, searchTerm, stageFilter, statusFilter]);

  React.useEffect(() => {
    if (statusFilter !== "won") {
      setQuarterFilter(null);
    }
  }, [statusFilter]);

  const handleClearFilters = React.useCallback(() => {
    setStageFilter("all");
    setOwnerFilter("all");
    setStatusFilter("all");
    setSearchTerm("");
    setQuarterFilter(null);
    setSortConfig(null);
  }, []);

  const openExternalLink = React.useCallback(
    (event: React.MouseEvent, url: string | null | undefined, label: string) => {
      event.stopPropagation();
      if (!url) {
        toast.error(`No hay ${label.toLowerCase()} disponible.`);
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [],
  );

  const handleViewScope = React.useCallback((event: React.MouseEvent, dealTitle: string) => {
    event.stopPropagation();
    setScopeDealTitle(dealTitle);
  }, []);

  const handleSort = React.useCallback(
    (key: SortKey) => {
      setSortConfig((prev) => {
        if (!prev || prev.key !== key) {
          return { key, direction: "asc" };
        }
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      });
    },
    [],
  );

  const stageStats = React.useMemo(() => aggregateStats(deals, "stageName"), [deals]);
  const statusStats = React.useMemo(() => aggregateStats(deals, "status"), [deals]);
  const quarterStats = React.useMemo(() => aggregateQuarterStats(deals), [deals]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0a0e16] via-[#090c1a] to-[#05060d] px-6 py-12">
      <main className="mx-auto w-full max-w-[1200px] space-y-8">
        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_100px_rgba(2,6,23,0.85)] backdrop-blur-3xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Pipedrive</p>
              <h1 className="text-2xl font-semibold text-white">Deals asignados</h1>
              <p className="text-sm text-white/60">
                Actualiza la lista para ver los negocios que tienen tu nombre en el campo “Mapache Asignado”.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                Última actualización: {lastSyncedLabel}
              </span>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white px-4 py-2 text-xs font-semibold tracking-[0.35em] text-[#0f1b2a] transition hover:border-white hover:bg-white/90 disabled:cursor-wait disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#0f1b2a]" aria-hidden="true" />
                ) : null}
                Actualizar
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Buscar deal
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Escribe el nombre del deal..."
                className="rounded-2xl border border-white/15 bg-[#101626] px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
              />
            </label>
            <FilterSelect
              label="Estado"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as "all" | "open" | "won")}
              options={STATUS_OPTIONS}
            />
            <FilterSelect
              label="Etapa"
              value={stageFilter}
              onChange={setStageFilter}
              options={[
                { value: "all", label: "Todas" },
                ...availableStages.map((stage) => ({
                  value: stage,
                  label: stage === "—" ? "Sin etapa" : stage,
                })),
              ]}
            />
            <FilterSelect
              label="Propietario"
              value={ownerFilter}
              onChange={setOwnerFilter}
              options={[
                { value: "all", label: "Todos" },
                ...availableOwners.map((owner) => ({ value: owner, label: owner })),
              ]}
            />
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
            >
              Limpiar filtros
            </button>
          </div>

          <SummarySection
            total={deals.length}
            stageStats={stageStats}
            statusStats={statusStats}
            quarterStats={quarterStats}
            onStageSelect={(stage) => setStageFilter(stage)}
            onStatusSelect={(statusKey) => {
              setQuarterFilter(null);
              if (statusKey === "open" || statusKey === "won") {
                setStatusFilter(statusKey);
              } else {
                setStatusFilter("all");
              }
            }}
            onQuarterSelect={(quarter) => {
              setStatusFilter("won");
              setQuarterFilter((prev) => (prev === quarter ? null : quarter));
            }}
          />

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-white">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.4em] text-white/50">
                    <SortableHeader
                      label="Nombre deal"
                      active={sortConfig?.key === "title"}
                      direction={sortConfig?.direction}
                      onClick={() => handleSort("title")}
                    />
                    <SortableHeader
                      label="Etapa"
                      active={sortConfig?.key === "stageName"}
                      direction={sortConfig?.direction}
                      onClick={() => handleSort("stageName")}
                    />
                    <SortableHeader
                      label="Propietario"
                      active={sortConfig?.key === "ownerName"}
                      direction={sortConfig?.direction}
                      onClick={() => handleSort("ownerName")}
                    />
                    <SortableHeader
                      label="Valor"
                      active={sortConfig?.key === "value"}
                      direction={sortConfig?.direction}
                      onClick={() => handleSort("value")}
                    />
                    <th className="px-4 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-white/60">
                        Presiona “Actualizar” para sincronizar los deals asignados a tu nombre.
                      </td>
                    </tr>
                  ) : filteredDeals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-white/60">
                        {hasFiltersApplied
                          ? "No hay deals que coincidan con los filtros seleccionados."
                          : "No se encontraron deals para mostrar."}
                      </td>
                    </tr>
                  ) : (
                    sortedDeals.map((deal) => (
                      <tr
                        key={deal.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedDeal(deal)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedDeal(deal);
                          }
                        }}
                        className="cursor-pointer border-t border-white/5 transition hover:bg-white/5 focus:bg-white/5 focus-visible:outline-none"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-white">{deal.title || "Sin título"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white/80">{deal.stageName ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white/80">{deal.ownerName ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white/80">{formatCurrency(deal.value)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={(event) =>
                                openExternalLink(event, deal.dealUrl, "el enlace de Pipedrive")
                              }
                              className={ACTION_BUTTON_CLASSES}
                            >
                              Ver en pipe
                            </button>
                            <button
                              type="button"
                              onClick={(event) =>
                                openExternalLink(event, deal.proposalUrl, "la propuesta comercial")
                              }
                              className={ACTION_BUTTON_CLASSES}
                            >
                              Ver propuesta
                            </button>
                            <button
                              type="button"
                              onClick={(event) =>
                                handleViewScope(event, deal.title || `Deal ${deal.id}`)
                              }
                              className={ACTION_BUTTON_CLASSES}
                            >
                              Ver alcance
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <Modal
        open={Boolean(selectedDeal)}
        onClose={() => setSelectedDeal(null)}
        title={selectedDeal?.title ?? "Detalles del deal"}
        panelWidthClassName="max-w-3xl"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedDeal(null)}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/20"
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedDeal ? (
          <dl className="grid gap-4 text-sm text-white/80 sm:grid-cols-2">
            <DetailRow label="ID" value={`#${selectedDeal.id}`} />
            <DetailRow label="Creado" value={formatDateTime(selectedDeal.createdAt)} />
            <DetailRow label="Ganado" value={formatDateTime(selectedDeal.wonAt)} />
            <DetailRow label="Nombre del negocio" value={selectedDeal.title || "—"} />
            <DetailRow label="Etapa del funnel" value={selectedDeal.stageName ?? "—"} />
            <DetailRow label="Propietario" value={selectedDeal.ownerName ?? "—"} />
            <DetailRow label="Estado" value={formatStatus(selectedDeal.status)} />
            <DetailRow label="Valor" value={formatCurrency(selectedDeal.value)} />
            <DetailRow label="Mapache asignado" value={selectedDeal.mapacheAssigned ?? "—"} />
            <DetailRow
              label="Propuesta comercial"
              value={
                selectedDeal.proposalUrl ? (
                  <a
                    href={selectedDeal.proposalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80 underline"
                  >
                    Abrir propuesta comercial
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow label="Doc contexto deal" value={selectedDeal.docContextDeal ?? "—"} />
            <DetailRow
              label="Ver en Pipedrive"
              value={
                <a
                  href={selectedDeal.dealUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80 underline"
                >
                  Abrir en Pipedrive
                </a>
              }
            />
          </dl>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(scopeDealTitle)}
        onClose={() => setScopeDealTitle(null)}
        title="Ver alcance"
        panelWidthClassName="max-w-md"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setScopeDealTitle(null)}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/20"
            >
              Cerrar
            </button>
          </div>
        }
      >
        <div className="text-sm text-white/80">
          <p className="font-semibold text-white">En desarrollo</p>
          <p className="mt-1">
            Esta funcionalidad se encuentra en construcción. Pronto podrás ver el alcance del deal
            {scopeDealTitle ? ` “${scopeDealTitle}”.` : "."}
          </p>
        </div>
      </Modal>
    </div>
  );
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return CURRENCY_FORMATTER.format(value);
}

function formatStatus(status: string | null | undefined) {
  if (!status) return "—";
  if (status === "open") return "Abierto";
  if (status === "won") return "Ganado";
  if (status === "lost") return "Perdido";
  return status;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMATTER.format(date);
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[11px] uppercase tracking-[0.35em] text-white/50">{label}</dt>
      <dd className="text-sm text-white">{value}</dd>
    </div>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
};

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-white/15 bg-[#101626] px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
        style={{ colorScheme: "dark" }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active?: boolean;
  direction?: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-4">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 ${
          active ? "text-white" : "text-white/60"
        }`}
      >
        <span>{label}</span>
        {active ? (
          direction === "asc" ? (
            <ArrowUpWideNarrow className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
          )
        ) : null}
      </button>
    </th>
  );
}

function aggregateStats(
  deals: PipedriveDealSummary[],
  type: "stageName" | "status",
): SummaryStat[] {
  const stats = new Map<string, SummaryStat>();
  deals.forEach((deal) => {
    const rawKey = type === "status" ? deal.status ?? "all" : deal.stageName ?? "—";
    const label = type === "status" ? formatStatus(deal.status) : rawKey;
    const value = deal.value ?? 0;
    if (!stats.has(rawKey)) {
      stats.set(rawKey, { key: rawKey, label, count: 0, value: 0 });
    }
    const current = stats.get(rawKey)!;
    current.count += 1;
    current.value += value;
  });
  return Array.from(stats.values());
}

function aggregateQuarterStats(deals: PipedriveDealSummary[]): QuarterStat[] {
  const currentYear = new Date().getFullYear();
  const stats = new Map<number, QuarterStat>();
  deals.forEach((deal) => {
    if (!deal.wonAt || deal.status !== "won" || deal.wonQuarter === null) return;
    const date = new Date(deal.wonAt);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== currentYear) return;
    const quarter = deal.wonQuarter;
    if (!stats.has(quarter)) {
      stats.set(quarter, {
        quarter,
        label: `Ganados Q${quarter}`,
        count: 0,
        value: 0,
      });
    }
    const current = stats.get(quarter)!;
    current.count += 1;
    current.value += deal.value ?? 0;
  });
  return Array.from(stats.values()).sort((a, b) => a.quarter - b.quarter);
}

function SummarySection({
  total,
  stageStats,
  statusStats,
  quarterStats,
  onStageSelect,
  onStatusSelect,
  onQuarterSelect,
}: {
  total: number;
  stageStats: SummaryStat[];
  statusStats: SummaryStat[];
  quarterStats: QuarterStat[];
  onStageSelect: (stage: string) => void;
  onStatusSelect: (status: string) => void;
  onQuarterSelect: (quarter: number) => void;
}) {
  return (
    <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-white/80">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Resumen</p>
        <p className="text-3xl font-semibold text-white">{total} deals</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryList
          title="Por etapa"
          stats={stageStats}
          onSelect={(stat) => onStageSelect(stat.key)}
        />
        <SummaryList
          title="Por estado"
          stats={statusStats}
          onSelect={(stat) => onStatusSelect(stat.key)}
        />
        <QuarterSummary stats={quarterStats} onSelect={onQuarterSelect} />
      </div>
    </div>
  );
}

type SummaryStat = { key: string; label: string; count: number; value: number };
type QuarterStat = { quarter: number; label: string; count: number; value: number };

function SummaryList({
  title,
  stats,
  onSelect,
}: {
  title: string;
  stats: SummaryStat[];
  onSelect: (stat: SummaryStat) => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{title}</p>
      <ul className="mt-1 space-y-1">
        {stats.map((stat) => (
          <li key={`${title}-${stat.key}`}>
            <button
              type="button"
              onClick={() => onSelect(stat)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-white/80 hover:bg-white/10"
            >
              <span>{stat.label}</span>
              <span>
                {stat.count} · {formatCurrency(stat.value)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuarterSummary({
  stats,
  onSelect,
}: {
  stats: QuarterStat[];
  onSelect: (quarter: number) => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Ganados por trimestre</p>
      <ul className="mt-1 space-y-1">
        {stats.map((stat) => (
          <li key={`quarter-${stat.quarter}`}>
            <button
              type="button"
              onClick={() => onSelect(stat.quarter)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-white/80 hover:bg-white/10"
            >
              <span>{stat.label}</span>
              <span>
                {stat.count} · {formatCurrency(stat.value)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
