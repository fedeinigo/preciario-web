"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { PipedriveDealSummary } from "@/types/pipedrive";
import { DEAL_TYPES, PROPOSAL_STAGES, COUNTRY_OPTIONS, ORIGEN_OPTIONS } from "@/types/pipedrive";

const CACHE_KEY = "analytics_deals_cache";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export type AnalyticsFilters = {
  year: number;
  quarter: Quarter;
};

type CachedData = {
  deals: PipedriveDealSummary[];
  syncedAt: string;
  expiresAt: number;
};

function getCurrentQuarter(): Quarter {
  const month = new Date().getMonth();
  if (month < 3) return "Q1";
  if (month < 6) return "Q2";
  if (month < 9) return "Q3";
  return "Q4";
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getDefaultFilters(): AnalyticsFilters {
  return {
    year: getCurrentYear(),
    quarter: getCurrentQuarter(),
  };
}

export function getQuarterDateRange(year: number, quarter: Quarter): { from: Date; to: Date } {
  const quarterIndex = (["Q1", "Q2", "Q3", "Q4"] as Quarter[]).indexOf(quarter);
  const startMonth = quarterIndex * 3;
  const endMonth = startMonth + 2;
  
  const from = new Date(year, startMonth, 1, 0, 0, 0, 0);
  const to = new Date(year, endMonth + 1, 0, 23, 59, 59, 999);
  
  return { from, to };
}

function filterDealsByQuarter(deals: PipedriveDealSummary[], filters: AnalyticsFilters): PipedriveDealSummary[] {
  const { from, to } = getQuarterDateRange(filters.year, filters.quarter);
  
  return deals.filter((deal) => {
    const dateStr = deal.createdAt || deal.wonAt;
    if (!dateStr) return false;
    
    const dealDate = new Date(dateStr);
    return dealDate >= from && dealDate <= to;
  });
}

type AnalyticsStats = {
  totalRevenue: number;
  wonRevenue: number;
  openRevenue: number;
  totalDeals: number;
  wonDeals: number;
  openDeals: number;
  lostDeals: number;
  closureRate: number;
  avgTicket: number;
  avgCycleDays: number;
  byOwner: Map<string, OwnerStats>;
  byRegion: Map<string, RegionStats>;
  bySource: Map<string, number>;
  byTeam: Map<string, TeamStats>;
  ncMeetings: number;
  upsellingRevenue: number;
  ncRevenue: number;
  ncWonDeals: number;
  upsellingWonDeals: number;
  ncClosureRate: number;
  ncAvgTicket: number;
  ncAvgCycleDays: number;
  ncLogosWon: number;
  funnelReuniones: number;
  funnelPropuestas: number;
  funnelCierres: number;
};

type OwnerStats = {
  name: string;
  email: string | null;
  revenue: number;
  won: number;
  open: number;
  lost: number;
  closureRate: number;
  avgTicket: number;
  funnel: number;
  team: string;
};

type RegionStats = {
  meetings: number;
  logos: number;
  revenue: number;
  avgDays: number;
  cycleDaysTotal: number;
  cycleDaysCount: number;
};

type TeamStats = {
  revenue: number;
  won: number;
  closureRate: number;
  avgTicket: number;
};

function getFromCache(): CachedData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedData;
    if (data.expiresAt > Date.now()) {
      return data;
    }
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function saveToCache(deals: PipedriveDealSummary[], syncedAt: string): boolean {
  if (typeof window === "undefined") return false;
  const data: CachedData = {
    deals,
    syncedAt,
    expiresAt: Date.now() + CACHE_EXPIRY_MS,
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn("Failed to save analytics cache:", err);
    return false;
  }
}

function extractRegion(deal: PipedriveDealSummary): string {
  if (deal.country && COUNTRY_OPTIONS[deal.country]) {
    return COUNTRY_OPTIONS[deal.country];
  }
  return "Rest Latam";
}

function extractSource(deal: PipedriveDealSummary): string {
  if (deal.origin && ORIGEN_OPTIONS[deal.origin]) {
    return ORIGEN_OPTIONS[deal.origin];
  }
  return "Otros";
}

function isUpsellingDeal(deal: PipedriveDealSummary): boolean {
  return deal.dealType === DEAL_TYPES.UPSELLING;
}

function isNCDeal(deal: PipedriveDealSummary): boolean {
  return deal.dealType === DEAL_TYPES.NEW_CUSTOMER;
}

function isInProposalStage(deal: PipedriveDealSummary): boolean {
  return deal.stageId !== null && PROPOSAL_STAGES.includes(deal.stageId);
}

function calculateDaysBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
  const diffMs = endDate.getTime() - startDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : null;
}

function extractTeam(deal: PipedriveDealSummary): string {
  const ownerName = (deal.ownerName || "").toLowerCase();
  const mapache = (deal.mapacheAssigned || "").toLowerCase();
  
  if (mapache.includes("nc") || mapache.includes("new customer")) return "NC Team";
  if (mapache.includes("upsell")) return "Upsell Team";
  if (ownerName.includes("aguilas") || ownerName.includes("aguila")) return "Aguilas";
  if (ownerName.includes("halcones") || ownerName.includes("halcon")) return "Halcones";
  if (ownerName.includes("panteras") || ownerName.includes("pantera")) return "Panteras";
  
  return "General";
}

function computeStats(deals: PipedriveDealSummary[]): AnalyticsStats {
  const byOwner = new Map<string, OwnerStats>();
  const byRegion = new Map<string, RegionStats>();
  const bySource = new Map<string, number>();
  const byTeam = new Map<string, TeamStats>();

  let totalRevenue = 0;
  let wonRevenue = 0;
  let openRevenue = 0;
  let wonDeals = 0;
  let openDeals = 0;
  let lostDeals = 0;
  let totalCycleDays = 0;
  let cycleCount = 0;
  let upsellingRevenue = 0;
  let ncRevenue = 0;
  
  let ncWonDeals = 0;
  let ncLostDeals = 0;
  let upsellingWonDeals = 0;
  let ncCycleDaysTotal = 0;
  let ncCycleCount = 0;

  const ncDeals = deals.filter(isNCDeal);
  const ncMeetings = ncDeals.length;
  const funnelPropuestas = ncDeals.filter(d => isInProposalStage(d) || d.status === "won").length;
  const funnelCierres = ncDeals.filter(d => d.status === "won").length;

  for (const deal of deals) {
    const value = deal.value ?? 0;
    totalRevenue += value;

    const ownerKey = deal.ownerEmail || deal.ownerName || "Sin asignar";
    const team = extractTeam(deal);
    
    if (!byOwner.has(ownerKey)) {
      byOwner.set(ownerKey, {
        name: deal.ownerName || "Sin nombre",
        email: deal.ownerEmail,
        revenue: 0,
        won: 0,
        open: 0,
        lost: 0,
        closureRate: 0,
        avgTicket: 0,
        funnel: 0,
        team,
      });
    }
    const ownerStats = byOwner.get(ownerKey)!;

    if (!byTeam.has(team)) {
      byTeam.set(team, {
        revenue: 0,
        won: 0,
        closureRate: 0,
        avgTicket: 0,
      });
    }
    const teamStats = byTeam.get(team)!;

    const region = extractRegion(deal);
    if (!byRegion.has(region)) {
      byRegion.set(region, { meetings: 0, logos: 0, revenue: 0, avgDays: 0, cycleDaysTotal: 0, cycleDaysCount: 0 });
    }
    const regionStats = byRegion.get(region)!;
    regionStats.meetings++;

    const source = extractSource(deal);
    bySource.set(source, (bySource.get(source) ?? 0) + value);

    if (deal.status === "won") {
      wonRevenue += value;
      wonDeals++;
      ownerStats.revenue += value;
      ownerStats.won++;
      teamStats.revenue += value;
      teamStats.won++;
      regionStats.logos++;
      regionStats.revenue += value;
      
      const cycleDays = deal.salesCycleDays ?? calculateDaysBetween(deal.createdAt, deal.wonAt);
      if (cycleDays !== null && cycleDays >= 0) {
        totalCycleDays += cycleDays;
        cycleCount++;
        regionStats.cycleDaysTotal += cycleDays;
        regionStats.cycleDaysCount++;
      }

      if (isUpsellingDeal(deal)) {
        upsellingRevenue += value;
        upsellingWonDeals++;
      } else if (isNCDeal(deal)) {
        ncRevenue += value;
        ncWonDeals++;
        if (cycleDays !== null && cycleDays >= 0) {
          ncCycleDaysTotal += cycleDays;
          ncCycleCount++;
        }
      }
    } else if (deal.status === "open") {
      openRevenue += value;
      openDeals++;
      ownerStats.open++;
      ownerStats.funnel += value;
    } else if (deal.status === "lost") {
      lostDeals++;
      ownerStats.lost++;
      if (isNCDeal(deal)) {
        ncLostDeals++;
      }
    }
  }

  for (const [, stats] of byOwner) {
    const total = stats.won + stats.lost;
    stats.closureRate = total > 0 ? (stats.won / total) * 100 : 0;
    stats.avgTicket = stats.won > 0 ? stats.revenue / stats.won : 0;
  }

  for (const [, stats] of byTeam) {
    stats.avgTicket = stats.won > 0 ? stats.revenue / stats.won : 0;
  }

  for (const [, stats] of byRegion) {
    stats.avgDays = stats.cycleDaysCount > 0 
      ? Math.round(stats.cycleDaysTotal / stats.cycleDaysCount) 
      : 0;
  }

  const totalCompleted = wonDeals + lostDeals;
  const closureRate = totalCompleted > 0 ? (wonDeals / totalCompleted) * 100 : 0;
  const avgTicket = wonDeals > 0 ? wonRevenue / wonDeals : 0;
  const avgCycleDays = cycleCount > 0 ? Math.round(totalCycleDays / cycleCount) : 0;

  const ncClosedDeals = ncWonDeals + ncLostDeals;
  const ncClosureRate = ncClosedDeals > 0 ? (ncWonDeals / ncClosedDeals) * 100 : 0;
  const ncAvgTicket = ncWonDeals > 0 ? ncRevenue / ncWonDeals : 0;
  const ncAvgCycleDays = ncCycleCount > 0 ? Math.round(ncCycleDaysTotal / ncCycleCount) : 0;

  return {
    totalRevenue,
    wonRevenue,
    openRevenue,
    totalDeals: deals.length,
    wonDeals,
    openDeals,
    lostDeals,
    closureRate,
    avgTicket,
    avgCycleDays,
    byOwner,
    byRegion,
    bySource,
    byTeam,
    ncMeetings,
    upsellingRevenue,
    ncRevenue,
    ncWonDeals,
    upsellingWonDeals,
    ncClosureRate,
    ncAvgTicket,
    ncAvgCycleDays,
    ncLogosWon: ncWonDeals,
    funnelReuniones: ncMeetings,
    funnelPropuestas,
    funnelCierres,
  };
}

export function useAnalyticsData(filters?: AnalyticsFilters) {
  const [allDeals, setAllDeals] = useState<PipedriveDealSummary[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheError, setCacheError] = useState<string | null>(null);

  const activeFilters = filters ?? getDefaultFilters();

  useEffect(() => {
    const cached = getFromCache();
    if (cached) {
      setAllDeals(cached.deals);
      setSyncedAt(cached.syncedAt);
    }
  }, []);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    setCacheError(null);

    try {
      const res = await fetch("/api/analytics/deals");
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Error al sincronizar");
      }

      setAllDeals(data.deals);
      setSyncedAt(data.syncedAt);
      
      const saved = saveToCache(data.deals, data.syncedAt);
      if (!saved) {
        setCacheError("Los datos se cargaron pero no se pudieron guardar en caché");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const loadInitial = useCallback(async () => {
    const cached = getFromCache();
    if (cached) {
      setAllDeals(cached.deals);
      setSyncedAt(cached.syncedAt);
      return;
    }

    setIsLoading(true);
    await sync();
    setIsLoading(false);
  }, [sync]);

  const deals = useMemo(
    () => filterDealsByQuarter(allDeals, activeFilters),
    [allDeals, activeFilters]
  );

  const stats = useMemo(() => computeStats(deals), [deals]);

  return {
    deals,
    allDeals,
    stats,
    syncedAt,
    isLoading,
    isSyncing,
    error,
    cacheError,
    sync,
    loadInitial,
    hasData: deals.length > 0,
    totalDealsInCache: allDeals.length,
  };
}

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Nunca";
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function getWeeklyData(deals: PipedriveDealSummary[]) {
  const weeks = new Map<string, { count: number; value: number }>();
  
  for (const deal of deals) {
    if (!deal.createdAt) continue;
    
    const date = new Date(deal.createdAt);
    const year = date.getFullYear();
    const weekNum = getWeekNumber(date);
    const weekKey = `${year}-W${weekNum.toString().padStart(2, '0')}`;
    
    const current = weeks.get(weekKey) || { count: 0, value: 0 };
    weeks.set(weekKey, {
      count: current.count + 1,
      value: current.value + (deal.value ?? 0),
    });
  }

  return Array.from(weeks.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8)
    .reverse()
    .map(([weekKey, data]) => {
      const [, weekPart] = weekKey.split('-');
      return { week: weekPart, ...data };
    });
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
