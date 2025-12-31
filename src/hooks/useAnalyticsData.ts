"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { PipedriveDealSummary } from "@/types/pipedrive";

const CACHE_KEY = "analytics_deals_cache";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

type CachedData = {
  deals: PipedriveDealSummary[];
  syncedAt: string;
  expiresAt: number;
};

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
  const title = (deal.title || "").toLowerCase();
  const ownerName = (deal.ownerName || "").toLowerCase();
  const combined = `${title} ${ownerName}`;
  
  if (combined.includes("colombia") || combined.includes(" col ") || combined.includes("bogota") || combined.includes("medellin")) return "Colombia";
  if (combined.includes("argentina") || combined.includes(" arg ") || combined.includes("buenos aires")) return "Argentina";
  if (combined.includes("mexico") || combined.includes(" mex ") || combined.includes("méxico") || combined.includes("cdmx")) return "Mexico";
  if (combined.includes("brasil") || combined.includes("brazil") || combined.includes(" br ") || combined.includes("sao paulo")) return "Brasil";
  if (combined.includes("españa") || combined.includes("spain") || combined.includes(" esp ") || combined.includes("madrid")) return "España";
  if (combined.includes("chile") || combined.includes(" cl ") || combined.includes("santiago")) return "Chile";
  if (combined.includes("peru") || combined.includes("perú") || combined.includes("lima")) return "Peru";
  if (combined.includes("ecuador") || combined.includes("quito")) return "Ecuador";
  if (combined.includes("uruguay")) return "Uruguay";
  return "Rest Latam";
}

function extractSource(deal: PipedriveDealSummary): string {
  const stageName = (deal.stageName || "").toLowerCase();
  const title = (deal.title || "").toLowerCase();
  const combined = `${stageName} ${title}`;
  
  if (combined.includes("inbound")) return "Inbound";
  if (combined.includes("outbound")) return "Outbound";
  if (combined.includes("referral") || combined.includes("referido")) return "Referral";
  if (combined.includes("partner")) return "Partner";
  if (combined.includes("marketing") || combined.includes("evento") || combined.includes("event")) return "Marketing";
  return "Directo";
}

function isUpsellingDeal(deal: PipedriveDealSummary): boolean {
  const title = (deal.title || "").toLowerCase();
  const stageName = (deal.stageName || "").toLowerCase();
  const combined = `${title} ${stageName}`;
  
  return combined.includes("upsell") || 
         combined.includes("expansion") || 
         combined.includes("upgrade") ||
         combined.includes("cross-sell") ||
         combined.includes("ampliacion") ||
         combined.includes("renovacion");
}

function isNCMeeting(deal: PipedriveDealSummary): boolean {
  const stageName = (deal.stageName || "").toLowerCase();
  const title = (deal.title || "").toLowerCase();
  
  return stageName.includes("nc") || 
         stageName.includes("new customer") || 
         stageName.includes("first meeting") ||
         stageName.includes("demo") ||
         stageName.includes("discovery") ||
         title.includes("nc ") ||
         title.includes("new customer");
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
  let ncMeetings = 0;
  let upsellingRevenue = 0;
  let ncRevenue = 0;

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

    if (isNCMeeting(deal)) {
      ncMeetings++;
    }

    if (deal.status === "won") {
      wonRevenue += value;
      wonDeals++;
      ownerStats.revenue += value;
      ownerStats.won++;
      teamStats.revenue += value;
      teamStats.won++;
      regionStats.logos++;
      regionStats.revenue += value;
      
      const cycleDays = calculateDaysBetween(deal.createdAt, deal.wonAt);
      if (cycleDays !== null) {
        totalCycleDays += cycleDays;
        cycleCount++;
        regionStats.cycleDaysTotal += cycleDays;
        regionStats.cycleDaysCount++;
      }

      if (isUpsellingDeal(deal)) {
        upsellingRevenue += value;
      } else {
        ncRevenue += value;
      }
    } else if (deal.status === "open") {
      openRevenue += value;
      openDeals++;
      ownerStats.open++;
      ownerStats.funnel += value;
    } else if (deal.status === "lost") {
      lostDeals++;
      ownerStats.lost++;
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
  };
}

export function useAnalyticsData() {
  const [deals, setDeals] = useState<PipedriveDealSummary[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheError, setCacheError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getFromCache();
    if (cached) {
      setDeals(cached.deals);
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

      setDeals(data.deals);
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
      setDeals(cached.deals);
      setSyncedAt(cached.syncedAt);
      return;
    }

    setIsLoading(true);
    await sync();
    setIsLoading(false);
  }, [sync]);

  const stats = useMemo(() => computeStats(deals), [deals]);

  return {
    deals,
    stats,
    syncedAt,
    isLoading,
    isSyncing,
    error,
    cacheError,
    sync,
    loadInitial,
    hasData: deals.length > 0,
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
