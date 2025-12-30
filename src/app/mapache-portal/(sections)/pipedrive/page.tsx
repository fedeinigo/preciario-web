"use client";

import * as React from "react";

import { 
  AlertTriangle, 
  ArrowDownWideNarrow, 
  ArrowUpWideNarrow, 
  Briefcase, 
  DollarSign, 
  Filter, 
  Link2, 
  Loader2, 
  RefreshCw, 
  Search, 
  TrendingUp, 
  Trophy, 
  X 
} from "lucide-react";

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

type StatusFilter = "all" | "open" | "won" | "lost";
type YearFilter = number | "all";

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Abiertos" },
  { value: "won", label: "Ganados" },
  { value: "lost", label: "Perdidos" },
];

const STORAGE_KEY = "mapache_pipedrive_cache";

type SortKey = "title" | "stageName" | "ownerName" | "value";

const DEFAULT_YEAR = new Date().getFullYear();

export default function MapachePortalPipedrivePage() {
  const [deals, setDeals] = React.useState<PipedriveDealSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date | null>(null);
  const [selectedDeal, setSelectedDeal] = React.useState<PipedriveDealSummary | null>(null);
  const [stageFilter, setStageFilter] = React.useState("all");
  const [ownerFilter, setOwnerFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const deferredSearch = React.useDeferredValue(searchTerm);
  const [wonQuarterFilter, setWonQuarterFilter] = React.useState<number | null>(null);
  const [createdQuarterFilter, setCreatedQuarterFilter] = React.useState<number | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);
  const [assignLink, setAssignLink] = React.useState("");
  const [assigning, setAssigning] = React.useState(false);
  const [yearFilter, setYearFilter] = React.useState<YearFilter>(DEFAULT_YEAR);
  const [scopeModalDeal, setScopeModalDeal] = React.useState<PipedriveDealSummary | null>(null);
  const [scopeUrlInput, setScopeUrlInput] = React.useState("");
  const [isSubmittingScope, setIsSubmittingScope] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as {
        timestamp?: string;
        deals?: PipedriveDealSummary[];
      };
      if (Array.isArray(parsed?.deals)) {
        setDeals(parsed.deals);
        if (parsed.timestamp) {
          const parsedDate = new Date(parsed.timestamp);
          if (!Number.isNaN(parsedDate.getTime())) {
            setLastSyncedAt(parsedDate);
          }
        }
      }
    } catch {
      // ignore malformed cache
    }
  }, []);

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
      const now = new Date();
      setLastSyncedAt(now);
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ timestamp: now.toISOString(), deals: payload.deals ?? [] }),
        );
      } catch {
        // ignore localStorage errors
      }
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

  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    deals.forEach((deal) => {
      const createdYear = extractYear(deal.createdAt);
      if (createdYear !== null) {
        years.add(createdYear);
      }
    });
    if (years.size === 0) {
      years.add(DEFAULT_YEAR);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [deals]);

  React.useEffect(() => {
    if (availableYears.length === 0) return;
    if (yearFilter === "all") return;
    if (!availableYears.includes(yearFilter)) {
      setYearFilter(availableYears[0]!);
    }
  }, [availableYears, yearFilter]);

  const filteredDeals = React.useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    return deals.filter((deal) => {
      const createdYear = extractYear(deal.createdAt);
      const matchesYear = yearFilter === "all" || createdYear === yearFilter;
      const createdQuarter = extractQuarter(deal.createdAt);
      const matchesCreatedQuarter =
        createdQuarterFilter === null || createdQuarter === createdQuarterFilter;
      const matchesStage =
        stageFilter === "all" ||
        (stageFilter === "—" ? !deal.stageName : deal.stageName === stageFilter);
      const matchesOwner = ownerFilter === "all" || deal.ownerName === ownerFilter;
      const matchesStatus =
        statusFilter === "all" || (deal.status ? deal.status === statusFilter : false);
      const matchesWonQuarter =
        wonQuarterFilter === null || deal.wonQuarter === wonQuarterFilter;
      const matchesSearch =
        !normalizedSearch ||
        deal.title.toLowerCase().includes(normalizedSearch) ||
        (deal.ownerName?.toLowerCase().includes(normalizedSearch) ?? false);
      return (
        matchesStage &&
        matchesOwner &&
        matchesStatus &&
        matchesWonQuarter &&
        matchesCreatedQuarter &&
        matchesYear &&
        matchesSearch
      );
    });
  }, [
    createdQuarterFilter,
    deals,
    ownerFilter,
    deferredSearch,
    stageFilter,
    statusFilter,
    wonQuarterFilter,
    yearFilter,
  ]);

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

  const defaultYear = availableYears[0] ?? DEFAULT_YEAR;
  const hasFiltersApplied = React.useMemo(() => {
    return (
      stageFilter !== "all" ||
      ownerFilter !== "all" ||
      statusFilter !== "all" ||
      Boolean(searchTerm.trim()) ||
      wonQuarterFilter !== null ||
      createdQuarterFilter !== null ||
      yearFilter !== defaultYear
    );
  }, [
    createdQuarterFilter,
    defaultYear,
    ownerFilter,
    searchTerm,
    stageFilter,
    statusFilter,
    wonQuarterFilter,
    yearFilter,
  ]);

  React.useEffect(() => {
    if (statusFilter !== "won") {
      setWonQuarterFilter(null);
    }
  }, [statusFilter]);

  const handleClearFilters = React.useCallback(() => {
    setStageFilter("all");
    setOwnerFilter("all");
    setStatusFilter("all");
    setSearchTerm("");
    setWonQuarterFilter(null);
    setCreatedQuarterFilter(null);
    setSortConfig(null);
    setYearFilter(defaultYear);
  }, [defaultYear]);

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

  const handleOpenScopeModal = React.useCallback((deal: PipedriveDealSummary) => {
    setScopeModalDeal(deal);
    setScopeUrlInput("");
  }, []);

  const handleCloseScopeModal = React.useCallback(() => {
    if (isSubmittingScope) return;
    setScopeModalDeal(null);
    setScopeUrlInput("");
  }, [isSubmittingScope]);

  const handleSubmitScope = React.useCallback(async () => {
    if (!scopeModalDeal) return;
    const trimmed = scopeUrlInput.trim();
    if (!trimmed) {
      toast.error("Pegá el enlace del alcance.");
      return;
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = new URL(trimmed).toString();
    } catch {
      toast.error("El enlace del alcance es inválido.");
      return;
    }

    setIsSubmittingScope(true);
    try {
      const response = await fetch("/api/pipedrive/tech-sale-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: scopeModalDeal.id, scopeUrl: normalizedUrl }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; scopeUrl?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "No se pudo guardar el alcance.");
      }
      const resolvedUrl = payload.scopeUrl ?? normalizedUrl;
      setDeals((prev) => {
        const next = prev.map((deal) =>
          deal.id === scopeModalDeal.id ? { ...deal, techSaleScopeUrl: resolvedUrl } : deal,
        );
        try {
          const timestamp = (lastSyncedAt ?? new Date()).toISOString();
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp, deals: next }));
        } catch {
          // ignore storage errors
        }
        return next;
      });
      setSelectedDeal((prev) =>
        prev && prev.id === scopeModalDeal.id ? { ...prev, techSaleScopeUrl: resolvedUrl } : prev,
      );
      toast.success("Alcance entregado.");
      setScopeModalDeal(null);
      setScopeUrlInput("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setIsSubmittingScope(false);
    }
  }, [lastSyncedAt, scopeModalDeal, scopeUrlInput]);

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

  const stageStats = React.useMemo(
    () => aggregateStats(filteredDeals, "stageName"),
    [filteredDeals],
  );
  const statusStats = React.useMemo(
    () => aggregateStats(filteredDeals, "status"),
    [filteredDeals],
  );
  const wonQuarterStats = React.useMemo(
    () => aggregateWonQuarterStats(filteredDeals, yearFilter),
    [filteredDeals, yearFilter],
  );
  const createdQuarterStats = React.useMemo(
    () => aggregateCreatedQuarterStats(filteredDeals, yearFilter),
    [filteredDeals, yearFilter],
  );

  const handleAssign = React.useCallback(async () => {
    const trimmed = assignLink.trim();
    if (!trimmed) {
      toast.error("Pegá el link del deal de Pipedrive.");
      return;
    }
    setAssigning(true);
    try {
      const response = await fetch("/api/pipedrive/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealLink: trimmed }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "No se pudo asignar el deal.");
      }
      toast.success("Deal asignado y sincronizado.");
      setAssignLink("");
      await handleRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  }, [assignLink, handleRefresh]);

  const totalValue = React.useMemo(() => 
    filteredDeals.reduce((sum, deal) => sum + (deal.value ?? 0), 0), 
    [filteredDeals]
  );
  
  const wonDealsCount = React.useMemo(() => 
    filteredDeals.filter(d => d.status === "won").length, 
    [filteredDeals]
  );
  
  const wonDealsValue = React.useMemo(() => 
    filteredDeals.filter(d => d.status === "won").reduce((sum, deal) => sum + (deal.value ?? 0), 0), 
    [filteredDeals]
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0a0a0f] via-[#0e0e14] to-[#11111a] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        
        {/* Header Card with KPIs */}
        <div className="rounded-3xl border border-white/10 bg-[#0f0f17] shadow-[0_20px_50px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="bg-gradient-to-r from-[#0c0c14] via-[#11111c] to-[#161626] px-6 sm:px-8 py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#6366f1]/20 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                    <Briefcase className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Deals Asignados</h1>
                    <p className="text-white/60 text-sm mt-0.5">
                      Negocios con tu nombre en &quot;Mapache Asignado&quot;
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <div className="text-xs font-medium text-white/60">
                    Última sync: {lastSyncedLabel}
                  </div>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/20 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-wait"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Sincronizar
                  </button>
                </div>
              </div>
              
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-purple-300" />
                    <p className="text-xs text-purple-200 font-medium uppercase tracking-wide">Total Deals</p>
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">{filteredDeals.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-purple-300" />
                    <p className="text-xs text-purple-200 font-medium uppercase tracking-wide">Valor Total</p>
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalValue)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-emerald-300" />
                    <p className="text-xs text-emerald-200 font-medium uppercase tracking-wide">Ganados</p>
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">{wonDealsCount}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-300" />
                    <p className="text-xs text-emerald-200 font-medium uppercase tracking-wide">Valor Ganado</p>
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">{formatCurrency(wonDealsValue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assign Deal Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#6366f1]/20 flex items-center justify-center border border-white/15">
              <Link2 className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Asignar Deal</h2>
              <p className="text-xs text-white/50">Pegá el enlace del deal que quieras tomar</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <input
                type="text"
                value={assignLink}
                onChange={(event) => setAssignLink(event.target.value)}
                placeholder="https://wcx.pipedrive.com/deal/12345"
                className="w-full rounded-xl border border-white/15 bg-[#0a0a12] px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition"
              />
            </div>
            <button
              type="button"
              onClick={handleAssign}
              disabled={assigning}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(99,102,241,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_12px_30px_rgba(99,102,241,0.4)] disabled:cursor-wait disabled:opacity-60 disabled:hover:scale-100"
            >
              {assigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              Asignarme
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Filter className="h-5 w-5 text-white/70" />
              </div>
              <h2 className="text-sm font-semibold text-white">Filtros</h2>
            </div>
            {hasFiltersApplied && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <div className="col-span-2 sm:col-span-1 lg:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-white/50 mb-2">
                Buscar deal
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nombre del deal..."
                  className="w-full rounded-xl border border-white/15 bg-[#0a0a12] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition"
                />
              </div>
            </div>
            <FilterSelect
              label="Estado"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
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
            <FilterSelect
              label="Año"
              value={yearFilter === "all" ? "all" : String(yearFilter)}
              onChange={(value) => {
                if (value === "all") {
                  setYearFilter("all");
                  return;
                }
                const parsed = Number(value);
                if (!Number.isNaN(parsed)) {
                  setYearFilter(parsed);
                }
              }}
              options={[
                { value: "all", label: "Todos" },
                ...availableYears.map((year) => ({ value: String(year), label: String(year) })),
              ]}
            />
          </div>
        </div>

        {/* Summary Section */}
        <SummarySection
            total={filteredDeals.length}
            stageStats={stageStats}
            statusStats={statusStats}
            wonQuarterStats={wonQuarterStats}
            createdQuarterStats={createdQuarterStats}
            selectedYear={yearFilter === "all" ? "Todos" : String(yearFilter)}
            onStageSelect={(stage) => setStageFilter(stage)}
            onStatusSelect={(statusKey) => {
              setWonQuarterFilter(null);
              if (statusKey === "open" || statusKey === "won" || statusKey === "lost") {
                setStatusFilter(statusKey as StatusFilter);
              } else {
                setStatusFilter("all");
              }
            }}
            onWonQuarterSelect={(quarter) => {
              setStatusFilter("won");
              setWonQuarterFilter((prev) => (prev === quarter ? null : quarter));
            }}
            onCreatedQuarterSelect={(quarter) =>
              setCreatedQuarterFilter((prev) => (prev === quarter ? null : quarter))
            }
          />

        {/* Deals Table */}
        <div className="rounded-2xl border border-white/10 bg-[#0d0d15] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
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
                  <th className="px-5 py-4 text-[11px] uppercase tracking-[0.25em] text-white/50 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {deals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center">
                          <Briefcase className="h-6 w-6 text-white/40" />
                        </div>
                        <p className="text-sm text-white/50">
                          Presiona &quot;Sincronizar&quot; para ver los deals asignados
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center">
                          <Search className="h-6 w-6 text-white/40" />
                        </div>
                        <p className="text-sm text-white/50">
                          {hasFiltersApplied
                            ? "No hay deals que coincidan con los filtros"
                            : "No se encontraron deals"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedDeals.map((deal, index) => (
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
                      className={`cursor-pointer transition hover:bg-white/[0.04] focus:bg-white/[0.04] focus-visible:outline-none ${
                        index !== 0 ? "border-t border-white/5" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-white">{deal.title || "Sin título"}</span>
                        {deal.status === "won" && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300 uppercase tracking-wide">
                            <Trophy className="h-3 w-3" />
                            Ganado
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/70">
                          {deal.stageName ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-white/70">{deal.ownerName ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-white/90">{formatCurrency(deal.value)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={(event) =>
                              openExternalLink(event, deal.dealUrl, "el enlace de Pipedrive")
                            }
                            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/70 transition hover:border-white/30 hover:text-white"
                          >
                            Pipe
                          </button>
                          <button
                            type="button"
                            onClick={(event) =>
                              openExternalLink(event, deal.proposalUrl, "la propuesta comercial")
                            }
                            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/70 transition hover:border-white/30 hover:text-white"
                          >
                            Propuesta
                          </button>
                          {deal.techSaleScopeUrl ? (
                            <button
                              type="button"
                              onClick={(event) =>
                                openExternalLink(event, deal.techSaleScopeUrl, "el alcance Tech Sale")
                              }
                              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300 transition hover:border-emerald-500/50"
                            >
                              Alcance
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenScopeModal(deal);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-300 transition hover:border-amber-500/50"
                              aria-label="Entregar alcance"
                            >
                              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                              Entregar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
            <DetailRow
              label="Doc contexto deal"
              value={
                selectedDeal.docContextDeal ? (
                  <a
                    href={selectedDeal.docContextDeal}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80 underline"
                  >
                    Abrir contexto
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow
              label="Alcance Tech Sale"
              value={
                selectedDeal.techSaleScopeUrl ? (
                  <a
                    href={selectedDeal.techSaleScopeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80 underline"
                  >
                    Abrir alcance Tech Sale
                  </a>
                ) : (
                  "—"
                )
              }
            />
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
        open={Boolean(scopeModalDeal)}
        onClose={handleCloseScopeModal}
        title="Entregar alcance"
        panelWidthClassName="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCloseScopeModal}
              disabled={isSubmittingScope}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmitScope}
              disabled={isSubmittingScope}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-[#0f1b2a] transition hover:border-white hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingScope ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Entregar alcance
            </button>
          </div>
        }
      >
        {scopeModalDeal ? (
          <div className="space-y-4 text-sm text-white/80">
            <p>
              Pegá el enlace del alcance para el deal{" "}
              <span className="font-semibold text-white">
                {scopeModalDeal.title || `#${scopeModalDeal.id}`}
              </span>
              . Lo guardaremos en Pipedrive.
            </p>
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Enlace del alcance
              <input
                type="url"
                placeholder="https://..."
                value={scopeUrlInput}
                onChange={(event) => setScopeUrlInput(event.target.value)}
                disabled={isSubmittingScope}
                className="rounded-2xl border border-white/20 bg-[#101626] px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <p className="text-xs text-white/50">
              Este enlace se guardará en el campo &quot;Alcance Tech Sale&quot; para que todo el equipo pueda verlo.
            </p>
          </div>
        ) : null}
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
    <div>
      <label className="block text-xs font-medium uppercase tracking-wider text-white/50 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/15 bg-[#0a0a12] px-4 py-2.5 text-sm text-white focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition appearance-none cursor-pointer"
        style={{ colorScheme: "dark" }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
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
    <th className="px-5 py-4">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] font-medium transition ${
          active ? "text-purple-300" : "text-white/50 hover:text-white/70"
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

function aggregateWonQuarterStats(
  deals: PipedriveDealSummary[],
  year: YearFilter,
): QuarterStat[] {
  const stats = new Map<number, QuarterStat>();
  deals.forEach((deal) => {
    if (!deal.wonAt || deal.status !== "won" || deal.wonQuarter === null) return;
    const wonYear = extractYear(deal.wonAt);
    if (year !== "all" && wonYear !== year) return;
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

function aggregateCreatedQuarterStats(
  deals: PipedriveDealSummary[],
  year: YearFilter,
): QuarterStat[] {
  const stats = new Map<number, QuarterStat>();
  deals.forEach((deal) => {
    const createdYear = extractYear(deal.createdAt);
    if (year !== "all" && createdYear !== year) return;
    const quarter = extractQuarter(deal.createdAt);
    if (quarter === null) return;
    if (!stats.has(quarter)) {
      stats.set(quarter, {
        quarter,
        label: `Deals Q${quarter}`,
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

function extractYear(value: string | null | undefined): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getFullYear();
}

function extractQuarter(value: string | null | undefined): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.getMonth();
  return Math.floor(month / 3) + 1;
}

function SummarySection({
  total,
  stageStats,
  statusStats,
  wonQuarterStats,
  createdQuarterStats,
  selectedYear,
  onStageSelect,
  onStatusSelect,
  onWonQuarterSelect,
  onCreatedQuarterSelect,
}: {
  total: number;
  stageStats: SummaryStat[];
  statusStats: SummaryStat[];
  wonQuarterStats: QuarterStat[];
  createdQuarterStats: QuarterStat[];
  selectedYear: string;
  onStageSelect: (stage: string) => void;
  onStatusSelect: (status: string) => void;
  onWonQuarterSelect: (quarter: number) => void;
  onCreatedQuarterSelect: (quarter: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#6366f1]/20 flex items-center justify-center border border-white/15">
          <TrendingUp className="h-5 w-5 text-purple-300" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Resumen</h2>
          <p className="text-xs text-white/50">{total} deals filtrados</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <QuarterSummary
          title={`Ganados Q ${selectedYear}`}
          stats={wonQuarterStats}
          onSelect={onWonQuarterSelect}
        />
        <QuarterSummary
          title={`Creados Q ${selectedYear}`}
          stats={createdQuarterStats}
          onSelect={onCreatedQuarterSelect}
        />
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
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
      <p className="text-[10px] uppercase tracking-wider text-white/50 font-medium mb-2">{title}</p>
      <ul className="space-y-0.5">
        {stats.length === 0 ? (
          <li className="text-xs text-white/40 py-1">Sin datos</li>
        ) : (
          stats.map((stat) => (
            <li key={`${title}-${stat.key}`}>
              <button
                type="button"
                onClick={() => onSelect(stat)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-white/[0.06]"
              >
                <span className="text-white/80 truncate">{stat.label}</span>
                <span className="text-white/50 whitespace-nowrap ml-2">
                  {stat.count} · {formatCurrency(stat.value)}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function QuarterSummary({
  title,
  stats,
  onSelect,
}: {
  title: string;
  stats: QuarterStat[];
  onSelect?: (quarter: number) => void;
}) {
  const isInteractive = typeof onSelect === "function";
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
      <p className="text-[10px] uppercase tracking-wider text-white/50 font-medium mb-2">{title}</p>
      <ul className="space-y-0.5">
        {stats.length === 0 ? (
          <li className="text-xs text-white/40 py-1">Sin datos</li>
        ) : (
          stats.map((stat) => (
            <li key={`quarter-${stat.quarter}`}>
              <button
                type="button"
                onClick={isInteractive ? () => onSelect?.(stat.quarter) : undefined}
                disabled={!isInteractive}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition ${
                  isInteractive ? "hover:bg-white/[0.06]" : "cursor-default"
                }`}
              >
                <span className="text-white/80">{stat.label}</span>
                <span className="text-white/50 whitespace-nowrap ml-2">
                  {stat.count} × {formatCurrency(stat.value)}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
