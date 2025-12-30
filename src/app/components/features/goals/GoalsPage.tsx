// src/app/components/features/goals/GoalsPage.tsx
"use client";

import React from "react";
import type { AppRole } from "@/constants/teams";
import { toast } from "@/app/components/ui/toast";
import Modal from "@/app/components/ui/Modal";
import { useTranslations } from "@/app/LanguageProvider";
import { q1Range, q2Range, q3Range, q4Range } from "../proposals/lib/dateRanges";
import { useAdminUsers } from "../proposals/hooks/useAdminUsers";
import type { AdminUser } from "../proposals/hooks/useAdminUsers";
import QuarterPicker from "./components/QuarterPicker";
import IndividualGoalCard from "./components/IndividualGoalCard";
import TeamGoalCard from "./components/TeamGoalCard";
import TeamMembersTable, { TeamGoalRow } from "./components/TeamMembersTable";
import BillingSummaryCard, { UserWonDeal } from "./components/BillingSummaryCard";
import { Download, Users2, Target } from "lucide-react";
import ManualWonDialog from "./components/ManualWonDialog";
import CardSkeleton from "@/app/components/ui/skeletons/CardSkeleton";
import Tooltip from "@/app/components/ui/Tooltip";
import MemberDealsModal from "./components/MemberDealsModal";
import BonusCalculatorCard from "./components/BonusCalculatorCard";

const PIPEDRIVE_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const isCacheFresh = (timestamp?: string | null) => {
  if (!timestamp) return false;
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return false;
  return Date.now() - parsed.getTime() <= PIPEDRIVE_CACHE_TTL_MS;
};

type Props = {
  role: AppRole;
  currentEmail: string;
  leaderTeam: string | null;
  isSuperAdmin: boolean;
  viewerImage?: string | null;
  viewerId?: string | null;
  theme?: "direct" | "mapache";
  winsSource?: "goals" | "pipedrive";
  disableManualWins?: boolean;
  pipedriveMode?: "mapache" | "owner";
};

type TeamMemberResponse = {
  userId?: string | number;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  team?: string | null;
  image?: string | null;
  positionName?: string | null;
  leaderEmail?: string | null;
  goal?: number | string;
  progress?: number | string;
  pct?: number | string;
  dealsCount?: number | string;
};

export default function GoalsPage({
  role,
  currentEmail,
  leaderTeam,
  isSuperAdmin,
  viewerImage = null,
  viewerId = null,
  theme = "direct",
  winsSource = "goals",
  disableManualWins = false,
  pipedriveMode = "mapache",
}: Props) {
  const pageT = useTranslations("goals.page");
  const toastT = useTranslations("goals.toast");
  const csvT = useTranslations("goals.csv");
  const teamT = useTranslations("goals.team");
  const billingT = useTranslations("goals.billing");

  const { users: adminUsers } = useAdminUsers({
    isSuperAdmin,
    isLeader: role === "lider",
  });

  const emailToAdminUser = React.useMemo(() => {
    const map = new Map<string, AdminUser>();
    adminUsers.forEach((user) => {
      if (user.email) map.set(user.email, user);
    });
    return map;
  }, [adminUsers]);

  const now = React.useMemo(() => new Date(), []);
  const [year, setYear] = React.useState<number>(now.getFullYear());
  const [quarter, setQuarter] = React.useState<1 | 2 | 3 | 4>(() => {
    const m = now.getMonth();
    if (m <= 2) return 1;
    if (m <= 5) return 2;
    if (m <= 8) return 3;
    return 4;
  });
  const rangeForQuarter = React.useMemo(() => {
    return [q1Range, q2Range, q3Range, q4Range][quarter - 1](year);
  }, [year, quarter]);

  const [myGoal, setMyGoal] = React.useState<number>(0);
  const [myProgress, setMyProgress] = React.useState<number>(0);
  const [myDeals, setMyDeals] = React.useState<UserWonDeal[]>([]);
  const [myMonthlyProgress, setMyMonthlyProgress] = React.useState<number>(0);
  const [myTotals, setMyTotals] = React.useState<{ monthlyFees: number; handoff: number; pending: number }>({
    monthlyFees: 0,
    handoff: 0,
    pending: 0,
  });
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date | null>(null);
  const [loadingDeals, setLoadingDeals] = React.useState<boolean>(false);
  const [manualDialogTarget, setManualDialogTarget] = React.useState<
    { userId?: string; email?: string | null; name?: string | null } | null
  >(null);
  const closeManualDialog = React.useCallback(() => setManualDialogTarget(null), []);

  const [deleteConfirmDeal, setDeleteConfirmDeal] = React.useState<UserWonDeal | null>(null);

  const winsCacheKey = React.useMemo(
    () => `goals:pipedrive:${currentEmail || "unknown"}:${year}:Q${quarter}`,
    [currentEmail, quarter, year]
  );

  const resolveHandoff = React.useCallback((deal: UserWonDeal): boolean => {
    const billed = Number(deal.billedAmount ?? 0);
    const fee = Number(deal.monthlyFee ?? 0);
    return Boolean(deal.handoffCompleted ?? (Number.isFinite(fee) && billed >= fee));
  }, []);

  const computeTotals = React.useCallback(
    (deals: UserWonDeal[]) => {
      const monthlyFees = deals.reduce((acc, deal) => acc + Number(deal.monthlyFee ?? 0), 0);
      const handoff = deals.reduce(
        (acc, deal) => (resolveHandoff(deal) ? acc + Number(deal.monthlyFee ?? 0) : acc),
        0
      );
      return { monthlyFees, handoff, pending: Math.max(0, monthlyFees - handoff) };
    },
    [resolveHandoff]
  );

  const loadWinsFromCache = React.useCallback(() => {
    if (winsSource !== "pipedrive") return false;
    if (typeof window === "undefined") return false;
    try {
      const raw = window.localStorage.getItem(winsCacheKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as {
        deals?: UserWonDeal[];
        progress?: number;
        monthlyProgress?: number;
        totals?: { monthlyFees?: number; handoff?: number; pending?: number };
        lastSyncedAt?: string | null;
      };
      if (!Array.isArray(parsed.deals)) return false;
      if (parsed.lastSyncedAt && !isCacheFresh(parsed.lastSyncedAt)) return false;
      setMyDeals(parsed.deals);
      setMyProgress(Number(parsed.progress ?? 0));
      setMyMonthlyProgress(Number(parsed.monthlyProgress ?? 0));
      const cachedTotals = {
        monthlyFees: Number(parsed.totals?.monthlyFees ?? 0),
        handoff: Number(parsed.totals?.handoff ?? NaN),
        pending: Number(parsed.totals?.pending ?? NaN),
      };
      const totals = Number.isFinite(cachedTotals.handoff) ? cachedTotals : computeTotals(parsed.deals);
      setMyTotals({
        monthlyFees: totals.monthlyFees,
        handoff: totals.handoff,
        pending: Number.isFinite(totals.pending) ? totals.pending : Math.max(0, totals.monthlyFees - totals.handoff),
      });
      setLastSyncedAt(parsed.lastSyncedAt ? new Date(parsed.lastSyncedAt) : null);
      return true;
    } catch {
      return false;
    }
  }, [computeTotals, winsCacheKey, winsSource]);

  const persistWinsCache = React.useCallback(
    (payload: {
      deals: UserWonDeal[];
      progress: number;
      monthlyProgress: number;
      totals: { monthlyFees: number; handoff: number; pending: number };
      lastSyncedAt: string;
    }) => {
      if (winsSource !== "pipedrive") return;
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(winsCacheKey, JSON.stringify(payload));
      } catch {
        // ignore cache errors
      }
    },
    [winsCacheKey, winsSource]
  );

  const loadMyGoal = React.useCallback(async () => {
    try {
      const r = await fetch(`/api/goals/user?year=${year}&quarter=${quarter}`);
      const j = await r.json();
      setMyGoal(Number(j.amount || 0));
    } catch {
      setMyGoal(0);
    }
  }, [year, quarter]);

  const loadMyWins = React.useCallback(
    async (options?: { force?: boolean }) => {
      const shouldUseCacheOnly = winsSource === "pipedrive" && !options?.force;
      if (shouldUseCacheOnly) {
        const restored = loadWinsFromCache();
        if (restored) return;
        setLastSyncedAt(null);
        setMyDeals([]);
        setMyProgress(0);
        setMyMonthlyProgress(0);
        setMyTotals({ monthlyFees: 0, handoff: 0, pending: 0 });
        return;
      }
      setLoadingDeals(true);
      try {
        if (winsSource === "pipedrive") {
          const modeQuery = pipedriveMode === "owner" ? "?mode=owner" : "";
          const response = await fetch(`/api/pipedrive/deals${modeQuery}` as const, { cache: "no-store" });
          if (!response.ok) throw new Error("Failed to load wins");
          const payload = (await response.json()) as { ok: boolean; deals?: Array<{ [key: string]: unknown }> };
          if (!payload.ok || !Array.isArray(payload.deals)) throw new Error("Invalid deals payload");
          const filteredDeals = payload.deals.filter((deal) => {
            const status = String((deal as { status?: string }).status ?? "").toLowerCase();
            if (status !== "won") return false;
            const wonQuarter = Number((deal as { wonQuarter?: number | null }).wonQuarter ?? null);
            const wonAt = (deal as { wonAt?: string | null }).wonAt ?? null;
            const wonYear = wonAt ? new Date(wonAt).getFullYear() : null;
            return wonQuarter === quarter && wonYear === year;
          });
          const normalizedDeals: UserWonDeal[] = filteredDeals.map((deal) => {
            const feeMensual = Number((deal as { feeMensual?: number | null }).feeMensual ?? 0);
            const value = Number((deal as { value?: number | null }).value ?? 0);
            const monthlyFee = Number.isFinite(feeMensual) && feeMensual > 0 ? feeMensual : value;
            const wonAt = (deal as { wonAt?: string | null }).wonAt ?? null;
            const createdAt = wonAt || (deal as { createdAt?: string | null }).createdAt || new Date().toISOString();
            return {
              id: String((deal as { id?: string | number }).id ?? ""),
              type: "auto",
              companyName: String((deal as { title?: string }).title ?? ""),
              monthlyFee: Number.isFinite(monthlyFee) ? monthlyFee : 0,
              billedAmount: 0,
              pendingAmount: Number.isFinite(monthlyFee) ? monthlyFee : 0,
              billingPct: 0,
              handoffCompleted: false,
              link: ((deal as { dealUrl?: string }).dealUrl ?? null) as string | null,
              createdAt,
              proposalId: undefined,
              manualDealId: undefined,
              docId: null,
              docUrl: ((deal as { techSaleScopeUrl?: string | null; proposalUrl?: string | null }).techSaleScopeUrl ??
                (deal as { proposalUrl?: string | null }).proposalUrl ??
                null) as string | null,
              wonType: "NEW_CUSTOMER",
            };
          });
          const totalFees = normalizedDeals.reduce((acc, deal) => acc + Number(deal.monthlyFee ?? 0), 0);
          setMyProgress(totalFees);
          setMyDeals(normalizedDeals);
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          const monthlyProgress = normalizedDeals.reduce((acc, deal) => {
            const createdDate = new Date(deal.createdAt);
            if (!Number.isNaN(createdDate.getTime()) && createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
              return acc + Number(deal.monthlyFee ?? 0);
            }
            return acc;
          }, 0);
          setMyMonthlyProgress(monthlyProgress);
          const totals = computeTotals(normalizedDeals);
          setMyTotals(totals);
          const syncMoment = new Date();
          setLastSyncedAt(syncMoment);
          persistWinsCache({
            deals: normalizedDeals,
            progress: totalFees,
            monthlyProgress,
            totals,
            lastSyncedAt: syncMoment.toISOString(),
          });
          return;
        }

      const params = new URLSearchParams({ year: String(year), quarter: String(quarter) });
      const response = await fetch(`/api/goals/wins?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load wins");
      const payload = (await response.json()) as {
        progress?: number;
        deals?: Array<UserWonDeal>;
        totals?: { monthlyFees?: number; handoff?: number; pending?: number };
      };
      const normalizedDeals = (payload.deals ?? []).map((deal) => {
        const wonType: "NEW_CUSTOMER" | "UPSELL" = deal.wonType === "UPSELL" ? "UPSELL" : "NEW_CUSTOMER";
        return {
          ...deal,
          monthlyFee: Number(deal.monthlyFee ?? 0),
          billedAmount: Number(deal.billedAmount ?? 0),
          pendingAmount: Number(deal.pendingAmount ?? 0),
          billingPct: Number.isFinite(deal.billingPct) ? deal.billingPct : 0,
          handoffCompleted: Boolean(deal.handoffCompleted ?? (deal.billedAmount ?? 0) >= (deal.monthlyFee ?? 0)),
          wonType,
        } satisfies UserWonDeal;
      });
      setMyProgress(Number(payload.progress ?? 0));
      setMyDeals(normalizedDeals);
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const monthlyProgress = normalizedDeals.reduce((acc, deal) => {
        const createdAt = new Date(deal.createdAt);
        if (!Number.isNaN(createdAt.getTime()) && createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear) {
          return acc + Number(deal.monthlyFee ?? 0);
        }
        return acc;
      }, 0);
      setMyMonthlyProgress(monthlyProgress);
      const totals = computeTotals(normalizedDeals);
      setMyTotals({
        monthlyFees: Number.isFinite(payload.totals?.monthlyFees ?? NaN)
          ? Number(payload.totals?.monthlyFees)
          : totals.monthlyFees,
        handoff: Number.isFinite(payload.totals?.handoff ?? NaN) ? Number(payload.totals?.handoff) : totals.handoff,
        pending: Number.isFinite(payload.totals?.pending ?? NaN) ? Number(payload.totals?.pending) : totals.pending,
      });
    } catch {
      setMyProgress(0);
      setMyDeals([]);
      setMyMonthlyProgress(0);
      setMyTotals({ monthlyFees: 0, handoff: 0, pending: 0 });
    } finally {
      setLoadingDeals(false);
    }
  }, [computeTotals, loadWinsFromCache, persistWinsCache, quarter, winsSource, year, pipedriveMode]);

  React.useEffect(() => {
    if (winsSource === "pipedrive") {
      void loadMyGoal();
      const restored = loadWinsFromCache();
      if (!restored) {
        setLastSyncedAt(null);
        setMyDeals([]);
        setMyProgress(0);
        setMyMonthlyProgress(0);
        setMyTotals({ monthlyFees: 0, handoff: 0, pending: 0 });
      }
      return;
    }
    void Promise.all([loadMyGoal(), loadMyWins()]);
  }, [loadMyGoal, loadMyWins, loadWinsFromCache, winsSource]);

  const handleSaveMyGoal = async (amount: number) => {
    const r = await fetch("/api/goals/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, year, quarter }),
    });
    if (!r.ok) return toast.error(toastT("myGoalError"));
    toast.success(toastT("myGoalSaved"));
    setMyGoal(amount);
    await loadMyWins();
  };

  const teams = React.useMemo(() => {
    if (!isSuperAdmin && role !== "admin") return [] as string[];
    const counts = new Map<string, number>();
    if (leaderTeam) {
      counts.set(leaderTeam, (counts.get(leaderTeam) || 0) + 1);
    }
    adminUsers.forEach((u) => {
      const t = (u.team || "").trim();
      if (!t) return;
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    return Array.from(counts.entries())
      .filter(([, count]) => count > 0)
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b));
  }, [adminUsers, isSuperAdmin, leaderTeam, role]);

  const [teamFilter, setTeamFilter] = React.useState<string>(leaderTeam ?? "");
  const effectiveTeam = (isSuperAdmin || role === "admin") ? teamFilter : (leaderTeam ?? "");

  const [teamGoal, setTeamGoal] = React.useState<number>(0);
  const [teamProgress, setTeamProgress] = React.useState<number>(0);
  const [teamProgressRaw, setTeamProgressRaw] = React.useState<number>(0);
  const [teamMonthlyProgressRaw, setTeamMonthlyProgressRaw] = React.useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [teamMonthlyProgress, setTeamMonthlyProgress] = React.useState<number>(0);
  const [teamDealsByUser, setTeamDealsByUser] = React.useState<Record<string, UserWonDeal[]>>({});
  const [teamDealsBaseMap, setTeamDealsBaseMap] = React.useState<Record<string, UserWonDeal[]>>({});
  const [rows, setRows] = React.useState<TeamGoalRow[]>([]);
  const [baseRows, setBaseRows] = React.useState<TeamGoalRow[]>([]);
  const [loadingTeam, setLoadingTeam] = React.useState<boolean>(false);
  const canAddManual = !disableManualWins && (isSuperAdmin || role === "lider" || role === "admin");
  const canAddSelfManual = !disableManualWins;
  const [memberDealsTarget, setMemberDealsTarget] = React.useState<
    { user: TeamGoalRow; deals: UserWonDeal[] } | null
  >(null);

  const teamCacheKey = React.useMemo(
    () => `goals:pipedrive:team:${effectiveTeam || "unknown"}:${year}:Q${quarter}`,
    [effectiveTeam, quarter, year]
  );

  const loadTeamFromCache = React.useCallback(() => {
    if (winsSource !== "pipedrive") return false;
    if (typeof window === "undefined") return false;
    try {
      const raw = window.localStorage.getItem(teamCacheKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as {
        teamGoal?: number;
        teamProgress?: number;
        teamProgressRaw?: number;
        teamMonthlyProgressRaw?: number;
        rows?: TeamGoalRow[];
        baseRows?: TeamGoalRow[];
        teamMonthlyProgress?: number;
        teamDealsByUser?: Record<string, UserWonDeal[]>;
        teamDealsBaseMap?: Record<string, UserWonDeal[]>;
        lastSyncedAt?: string | null;
      };
      if (!Array.isArray(parsed.rows) || !Array.isArray(parsed.baseRows)) return false;
      if (parsed.lastSyncedAt && !isCacheFresh(parsed.lastSyncedAt)) return false;
      setTeamGoal(Number(parsed.teamGoal ?? 0));
      setTeamProgress(Number(parsed.teamProgress ?? 0));
      setTeamProgressRaw(Number(parsed.teamProgressRaw ?? 0));
      setTeamMonthlyProgressRaw(Number(parsed.teamMonthlyProgressRaw ?? 0));
      setTeamMonthlyProgress(Number(parsed.teamMonthlyProgress ?? 0));
      setTeamDealsByUser(parsed.teamDealsByUser ?? {});
      setTeamDealsBaseMap(parsed.teamDealsBaseMap ?? {});
      setRows(parsed.rows);
      setBaseRows(parsed.baseRows);
      setLastSyncedAt(parsed.lastSyncedAt ? new Date(parsed.lastSyncedAt) : null);
      return true;
    } catch {
      return false;
    }
  }, [teamCacheKey, winsSource]);

  const persistTeamCache = React.useCallback(
    (payload: {
      teamGoal: number;
      teamProgress: number;
      teamProgressRaw: number;
      teamMonthlyProgress: number;
      teamMonthlyProgressRaw: number;
      rows: TeamGoalRow[];
      baseRows: TeamGoalRow[];
      teamDealsByUser: Record<string, UserWonDeal[]>;
      teamDealsBaseMap: Record<string, UserWonDeal[]>;
      lastSyncedAt: string;
    }) => {
      if (winsSource !== "pipedrive") return;
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(teamCacheKey, JSON.stringify(payload));
      } catch {
        // ignore cache errors
      }
    },
    [teamCacheKey, winsSource]
  );

  const normalizeName = React.useCallback((value: string | null | undefined) => {
    const normalized = value
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
    return normalized ?? "";
  }, []);

  const mergePipedriveSelfProgress = React.useCallback(
    (
      incomingRows: TeamGoalRow[],
      incomingProgress: number,
      incomingDealsMap: Record<string, UserWonDeal[]> = {},
      incomingMonthlyProgress = 0,
    ) => {
      if (winsSource !== "pipedrive") {
        return {
          rows: incomingRows,
          teamProgress: incomingProgress,
          dealsMap: incomingDealsMap,
          teamMonthlyProgress: incomingMonthlyProgress,
        };
      }

      const normalizedEmail = (currentEmail || "").trim().toLowerCase();

      const matchIndex = incomingRows.findIndex((row) => {
        const rowEmail = (row.email || "").trim().toLowerCase();
        return (viewerId && row.userId === viewerId) || (!!normalizedEmail && rowEmail === normalizedEmail);
      });

      const currentMapMonthly = (userId: string) =>
        (incomingDealsMap[userId] ?? []).reduce((acc, deal) => {
          const date = new Date(deal.createdAt);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
            ? acc + deal.monthlyFee
            : acc;
        }, 0);

      if (matchIndex === -1) {
        return {
          rows: incomingRows,
          teamProgress: incomingProgress,
          dealsMap: incomingDealsMap,
          teamMonthlyProgress: incomingMonthlyProgress,
        };
      }

      const matched = incomingRows[matchIndex];
      const nextDealsMap = { ...incomingDealsMap };
      if (matched.userId) {
        nextDealsMap[matched.userId] = myDeals;
      }

      const replacedMonthly = matched.userId ? currentMapMonthly(matched.userId) : 0;

      const updatedRows = incomingRows.map((row, idx) =>
        idx === matchIndex
          ? {
              ...row,
              progress: myProgress,
              dealsCount: myDeals.length,
              pct: row.goal > 0 ? (myProgress / row.goal) * 100 : 0,
            }
          : row
      );

      const adjustedTeamProgress = incomingProgress - matched.progress + myProgress;
      const adjustedMonthly = incomingMonthlyProgress - replacedMonthly + myMonthlyProgress;

      return {
        rows: updatedRows,
        teamProgress: adjustedTeamProgress,
        dealsMap: nextDealsMap,
        teamMonthlyProgress: adjustedMonthly,
      };
    },
    [currentEmail, myDeals, myMonthlyProgress, myProgress, now, viewerId, winsSource]
  );

  const loadTeam = React.useCallback(async (options?: { force?: boolean }) => {
    const canSelectTeam = isSuperAdmin || role === "admin";
    if (!canSelectTeam && !effectiveTeam) {
      setRows([]);
      setTeamGoal(0);
      setTeamProgress(0);
      setTeamProgressRaw(0);
      setTeamMonthlyProgressRaw(0);
      setTeamMonthlyProgress(0);
      setTeamDealsByUser({});
      setTeamDealsBaseMap({});
      return;
    }
    if (canSelectTeam && !effectiveTeam) {
      setRows([]);
      setTeamGoal(0);
      setTeamProgress(0);
      setTeamProgressRaw(0);
      setTeamMonthlyProgressRaw(0);
      setTeamMonthlyProgress(0);
      setTeamDealsByUser({});
      setTeamDealsBaseMap({});
      return;
    }
    const shouldUseCacheOnly = winsSource === "pipedrive" && !options?.force;
    if (shouldUseCacheOnly) {
      const restored = loadTeamFromCache();
      if (restored) return;
      setTeamGoal(0);
      setTeamProgress(0);
      setRows([]);
      setBaseRows([]);
      setTeamProgressRaw(0);
      setTeamMonthlyProgressRaw(0);
      setTeamMonthlyProgress(0);
      setTeamDealsByUser({});
      setTeamDealsBaseMap({});
      setLastSyncedAt(null);
      return;
    }
    setLoadingTeam(true);
    try {
      const r = await fetch(
        `/api/goals/team?year=${year}&quarter=${quarter}&team=${encodeURIComponent(effectiveTeam)}`
      );
      if (!r.ok) throw new Error("team");
      const j = await r.json();
      setTeamGoal(Number(j.teamGoal || 0));
      setTeamProgress(Number(j.teamProgress || 0));
      const members = (Array.isArray(j.members) ? j.members : []) as TeamMemberResponse[];
      const normalizedRows = members.map((member) => {
        const memberId = String(member.userId ?? "");
        const email = member.email ?? null;
        let image = member.image ?? (email ? emailToAdminUser.get(email)?.image ?? null : null);
        if (!image && viewerId && viewerId === memberId) {
          image = viewerImage ?? null;
        }
        return {
          userId: memberId,
          email,
          name: member.name ?? null,
          role: member.role ?? null,
          team: member.team ?? null,
          image,
          positionName: member.positionName ?? null,
          leaderEmail: member.leaderEmail ?? null,
          goal: Number(member.goal ?? 0),
          progress: Number(member.progress ?? 0),
          pct: Number(member.pct ?? 0),
          dealsCount: Number(member.dealsCount ?? 0),
        };
      });

      let resolvedRows = normalizedRows;
      let resolvedProgress = normalizedRows.reduce((acc, row) => acc + row.progress, 0);
      const resolvedDealsMap: Record<string, UserWonDeal[]> = {};
      let resolvedMonthlyProgress = 0;

      if (winsSource === "pipedrive") {
        const memberIdentifiers =
          pipedriveMode === "owner"
            ? normalizedRows
                .map((member) => (member.email || "").trim().toLowerCase())
                .filter((email): email is string => !!email)
            : normalizedRows.map((member) => member.name).filter((name): name is string => !!name?.trim());
        try {
          if (memberIdentifiers.length > 0) {
            const modeQuery = pipedriveMode === "owner" ? "?mode=owner" : "";
            const pdRes = await fetch(`/api/pipedrive/team-deals${modeQuery}` as const, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ names: memberIdentifiers }),
            });
            if (!pdRes.ok) throw new Error(`team-deals-${pdRes.status}`);
            const pdPayload = (await pdRes.json()) as { ok?: boolean; deals?: Array<{ [key: string]: unknown }> };
            if (!pdPayload.ok || !Array.isArray(pdPayload.deals)) throw new Error("team-deals-invalid");

            const filteredDeals = pdPayload.deals.filter((deal) => {
              const status = String((deal as { status?: string | null }).status ?? "").toLowerCase();
              if (status !== "won") return false;
              const wonAt = (deal as { wonAt?: string | null }).wonAt ?? null;
              const wonDate = wonAt ? new Date(wonAt) : null;
              const wonYear = wonDate?.getFullYear() ?? null;
              const wonQuarter = (deal as { wonQuarter?: number | null }).wonQuarter ?? null;
              const wonMonthQuarter = wonDate ? (Math.floor(wonDate.getMonth() / 3) + 1) : null;
              return wonYear === year && (wonQuarter === quarter || wonMonthQuarter === quarter);
            });

            const normalizedDeals = filteredDeals.map((deal) => {
              const feeMensual = Number((deal as { feeMensual?: number | null }).feeMensual ?? 0);
              const value = Number((deal as { value?: number | null }).value ?? 0);
              const monthlyFee = Number.isFinite(feeMensual) && feeMensual > 0 ? feeMensual : value;
              const wonAt = (deal as { wonAt?: string | null }).wonAt ?? null;
              const createdAt =
                wonAt || (deal as { createdAt?: string | null }).createdAt || new Date().toISOString();
              const dealUrl = (deal as { dealUrl?: string | null }).dealUrl ?? null;
              return {
                mapacheAssigned: String((deal as { mapacheAssigned?: string | null }).mapacheAssigned ?? ""),
                ownerName: String((deal as { ownerName?: string | null }).ownerName ?? ""),
                ownerEmail: String((deal as { ownerEmail?: string | null }).ownerEmail ?? ""),
                monthlyFee: Number.isFinite(monthlyFee) ? monthlyFee : 0,
                deal: {
                  id: String((deal as { id?: string | number }).id ?? ""),
                  type: "auto" as const,
                  companyName: String((deal as { title?: string }).title ?? ""),
                  monthlyFee: Number.isFinite(monthlyFee) ? monthlyFee : 0,
                  billedAmount: 0,
                  pendingAmount: Number.isFinite(monthlyFee) ? monthlyFee : 0,
                  billingPct: 0,
                  link: dealUrl,
                  createdAt,
                  wonType: "NEW_CUSTOMER" as const,
                },
              };
            });

            resolvedRows = normalizedRows.map((row) => {
              const rowName = normalizeName(row.name);
              const rowEmail = (row.email || "").trim().toLowerCase();
              const deals = normalizedDeals.filter((deal) => {
                if (pipedriveMode === "owner") {
                  const ownerEmail = (deal.ownerEmail || "").trim().toLowerCase();
                  return !!ownerEmail && !!rowEmail && ownerEmail === rowEmail;
                }
                if (!rowName) return false;
                return normalizeName(deal.mapacheAssigned) === rowName;
              });
              const progress = deals.reduce((acc, deal) => acc + Number(deal.monthlyFee ?? 0), 0);
              const memberDeals = deals.map((deal) => deal.deal);
              const monthlySum = memberDeals.reduce((acc, deal) => {
                const createdAt = new Date(deal.createdAt);
                if (createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()) {
                  return acc + deal.monthlyFee;
                }
                return acc;
              }, 0);
              resolvedDealsMap[row.userId] = memberDeals;
              resolvedMonthlyProgress += monthlySum;
              return {
                ...row,
                progress,
                dealsCount: deals.length,
                pct: row.goal > 0 ? (progress / row.goal) * 100 : 0,
              };
            });

            resolvedProgress = resolvedRows.reduce((acc, row) => acc + row.progress, 0);
          }
        } catch (error) {
          console.error("team-pipedrive-sync-failed", error);
        }
      }

      setTeamDealsBaseMap(resolvedDealsMap);
      setTeamMonthlyProgressRaw(resolvedMonthlyProgress);

      setBaseRows(resolvedRows);
      setTeamProgressRaw(resolvedProgress);
      const merged = mergePipedriveSelfProgress(
        resolvedRows,
        resolvedProgress,
        resolvedDealsMap,
        resolvedMonthlyProgress,
      );
      setRows(merged.rows);
      setTeamProgress(merged.teamProgress);
      setTeamDealsByUser(merged.dealsMap);
      setTeamMonthlyProgress(merged.teamMonthlyProgress);
      const syncMoment = new Date();
      if (winsSource === "pipedrive") {
        setLastSyncedAt(syncMoment);
        persistTeamCache({
          teamGoal: Number(j.teamGoal || 0),
          teamProgress: merged.teamProgress,
          teamProgressRaw: resolvedProgress,
          teamMonthlyProgressRaw: resolvedMonthlyProgress,
          teamMonthlyProgress: merged.teamMonthlyProgress,
          rows: merged.rows,
          baseRows: resolvedRows,
          teamDealsByUser: merged.dealsMap,
          teamDealsBaseMap: resolvedDealsMap,
          lastSyncedAt: syncMoment.toISOString(),
        });
        
        const snapshotsToSave = merged.rows.map((row) => ({
          userId: row.userId,
          year,
          quarter,
          goalAmount: row.goal,
          progressAmount: row.progress,
          pct: row.pct,
          dealsCount: row.dealsCount ?? 0,
          source: "pipedrive",
        }));
        
        if (snapshotsToSave.length > 0) {
          fetch("/api/goals/snapshot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ snapshots: snapshotsToSave }),
          }).catch((err) => console.error("Failed to save snapshots", err));
        }
      }
    } catch {
      setTeamGoal(0); setTeamProgress(0); setRows([]); setBaseRows([]); setTeamProgressRaw(0); setTeamMonthlyProgressRaw(0); setTeamMonthlyProgress(0); setTeamDealsByUser({}); setTeamDealsBaseMap({});
    } finally {
      setLoadingTeam(false);
    }
  }, [effectiveTeam, isSuperAdmin, role, year, quarter, emailToAdminUser, viewerId, viewerImage, mergePipedriveSelfProgress, winsSource, normalizeName, loadTeamFromCache, persistTeamCache, pipedriveMode, now]);

  React.useEffect(() => { loadTeam(); }, [loadTeam]);

  React.useEffect(() => {
    if (winsSource !== "pipedrive") return;
    if (baseRows.length === 0) return;
    const merged = mergePipedriveSelfProgress(
      baseRows,
      teamProgressRaw,
      teamDealsBaseMap,
      teamMonthlyProgressRaw,
    );
    setRows(merged.rows);
    setTeamProgress(merged.teamProgress);
    setTeamDealsByUser(merged.dealsMap);
    setTeamMonthlyProgress(merged.teamMonthlyProgress);
  }, [baseRows, mergePipedriveSelfProgress, teamProgressRaw, winsSource, teamDealsBaseMap, teamMonthlyProgressRaw]);

  React.useEffect(() => {
    const handleRefresh = () => {
      loadMyWins();
      loadTeam();
    };
    const handleGoalsSyncRequest = () => {
      loadMyWins({ force: true });
      loadTeam({ force: true });
    };
    window.addEventListener("proposals:refresh", handleRefresh as EventListener);
    window.addEventListener("goals:request-sync", handleGoalsSyncRequest as EventListener);
    return () => {
      window.removeEventListener("proposals:refresh", handleRefresh as EventListener);
      window.removeEventListener("goals:request-sync", handleGoalsSyncRequest as EventListener);
    };
  }, [loadMyWins, loadTeam]);

  const handleSync = React.useCallback(async () => {
    await loadMyWins({ force: true });
    await loadTeam({ force: true });
  }, [loadMyWins, loadTeam]);

  const handleManualWon = React.useCallback(
    async (payload: {
      companyName: string;
      monthlyFee: number;
      proposalUrl?: string | null;
      userId?: string;
      wonType: "NEW_CUSTOMER" | "UPSELL";
    }) => {
      const body: Record<string, unknown> = {
        companyName: payload.companyName,
        monthlyFee: payload.monthlyFee,
        proposalUrl: payload.proposalUrl ?? undefined,
        year,
        quarter,
        wonType: payload.wonType,
      };
      if (payload.userId) body.userId = payload.userId;
      const res = await fetch("/api/goals/wins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error("manual-won-request failed", res.status, errorText);
        throw new Error("manual-won-" + res.status);
      }
      toast.success(toastT("manualWonSaved"));
      await loadMyWins();
      if (isSuperAdmin || role === "lider" || role === "admin") {
        await loadTeam();
      }
    },
    [year, quarter, loadMyWins, isSuperAdmin, role, loadTeam, toastT]
  );

  const handleDeleteManualWon = React.useCallback(
    (deal: UserWonDeal) => {
      if (!deal.manualDealId) return;
      setDeleteConfirmDeal(deal);
    },
    []
  );

  const confirmDeleteManualWon = React.useCallback(
    async () => {
      if (!deleteConfirmDeal || !deleteConfirmDeal.manualDealId) return;
      try {
        const res = await fetch(`/api/goals/wins?manualDealId=${deleteConfirmDeal.manualDealId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("fail");
        toast.success(toastT("manualWonDeleted"));
        setDeleteConfirmDeal(null);
        await loadMyWins();
        if (isSuperAdmin || role === "lider" || role === "admin") {
          await loadTeam();
        }
      } catch {
        toast.error(toastT("manualWonDeleteError"));
      }
    },
    [deleteConfirmDeal, toastT, loadMyWins, isSuperAdmin, role, loadTeam]
  );

  const handleUpdateBilling = React.useCallback(
    async (deal: UserWonDeal, billedAmount: number) => {
      const applyLocalUpdate = (billed: number) => {
        setMyDeals((prev) => {
          const updated = prev.map((item) => {
            if (item.id !== deal.id) return item;
            const handoffCompleted = billed >= item.monthlyFee;
            return {
              ...item,
              billedAmount: billed,
              pendingAmount: Math.max(0, item.monthlyFee - billed),
              billingPct: item.monthlyFee > 0 ? (billed / item.monthlyFee) * 100 : 0,
              handoffCompleted,
            };
          });

          const totals = computeTotals(updated);
          setMyTotals(totals);

          const currentDate = new Date();
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          const monthlyTotal = updated.reduce((acc, item) => {
            const createdAt = new Date(item.createdAt);
            if (!Number.isNaN(createdAt.getTime()) && createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear) {
              return acc + item.monthlyFee;
            }
            return acc;
          }, 0);
          setMyMonthlyProgress(monthlyTotal);

          if (winsSource === "pipedrive") {
            const progressTotal = updated.reduce((acc, item) => acc + Number(item.monthlyFee ?? 0), 0);
            const cacheSyncedAt = lastSyncedAt ? lastSyncedAt.toISOString() : new Date().toISOString();
            persistWinsCache({
              deals: updated,
              progress: progressTotal,
              monthlyProgress: monthlyTotal,
              totals,
              lastSyncedAt: cacheSyncedAt,
            });
          }

          return updated;
        });
      };

      if (!deal.proposalId && !deal.manualDealId) {
        applyLocalUpdate(billedAmount);
        return;
      }

      const payload: Record<string, unknown> = { billedAmount };
      if (deal.proposalId) payload.proposalId = deal.proposalId;
      if (deal.manualDealId) payload.manualDealId = deal.manualDealId;
      const res = await fetch("/api/goals/wins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { billedAmount?: number };
      const billed = Number(data.billedAmount ?? billedAmount);
      setMyDeals((prev) => {
        const updated = prev.map((item) => {
          if (item.id !== deal.id) return item;
          const handoffCompleted = billed >= item.monthlyFee;
          return {
            ...item,
            billedAmount: billed,
            pendingAmount: Math.max(0, item.monthlyFee - billed),
            billingPct: item.monthlyFee > 0 ? (billed / item.monthlyFee) * 100 : 0,
            handoffCompleted,
          };
        });
        setMyTotals(computeTotals(updated));
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const monthlyTotal = updated.reduce((acc, item) => {
          const createdAt = new Date(item.createdAt);
          if (!Number.isNaN(createdAt.getTime()) && createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear) {
            return acc + item.monthlyFee;
          }
          return acc;
        }, 0);
        setMyMonthlyProgress(monthlyTotal);
        return updated;
      });
    },
    [computeTotals]
  );

  const handleToggleHandOff = React.useCallback(
    async (deal: UserWonDeal, completed: boolean) => {
      try {
        await handleUpdateBilling(deal, completed ? deal.monthlyFee : 0);
        toast.success(completed ? toastT("handoffSaved") : toastT("handoffRemoved"));
      } catch {
        toast.error(toastT("billingError"));
      }
    },
    [handleUpdateBilling, toastT]
  );

  const saveUserGoal = async (userId: string, amount: number) => {
    const res = await fetch("/api/goals/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount, year, quarter }),
    });
    if (!res.ok) {
      toast.error(toastT("userGoalError"));
      return false;
    }
    toast.success(toastT("userGoalSaved"));
    setRows((prev) =>
      prev.map((r) =>
        r.userId === userId ? { ...r, goal: amount, pct: (r.progress / (amount || 1)) * 100 } : r
      )
    );
    return true;
  };

  const saveTeamGoal = async (amount: number) => {
    try {
      const res = await fetch(`/api/goals/team?team=${encodeURIComponent(effectiveTeam)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: effectiveTeam, year, quarter, amount }),
      });
      if (!res.ok) throw new Error("fail");
      toast.success(toastT("teamGoalSaved"));
      setTeamGoal(amount);
    } catch {
      toast.error(toastT("teamGoalError"));
    }
  };

  const exportCsv = () => {
    const headers = [
      csvT("headers.user"),
      csvT("headers.goal"),
      csvT("headers.progress"),
      csvT("headers.pct"),
    ];
    const lines = rows.map((r) =>
      [(r.name || r.email || r.userId), r.goal.toFixed(2), r.progress.toFixed(2), `${r.pct.toFixed(1)}%`].join(",")
    );
    const blob = new Blob([headers.join(","), "\n", lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileTeam = effectiveTeam || csvT("fallbackTeam");
    a.download = csvT("fileName", { team: fileTeam });
    a.click(); URL.revokeObjectURL(url);
  };


  const sumMembersGoal = React.useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.goal || 0), 0),
    [rows]
  );

  const isMapache = theme === "mapache";
  const containerBg = isMapache
    ? "min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0e0e14] to-[#11111a] px-4 sm:px-6 lg:px-8 py-8"
    : "min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-purple-50/30 px-4 sm:px-6 lg:px-8 py-8";
  const headerBg = isMapache
    ? "bg-gradient-to-r from-[#0c0c14] via-[#11111c] to-[#161626] px-6 sm:px-8 py-6"
    : "bg-gradient-to-r from-[#311160] via-[#4c1d95] to-[#5b21b6] px-6 sm:px-8 py-6";
  const kpiCardBg = isMapache
    ? "bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3"
    : "bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3";
  const tableCardClass = isMapache
    ? "bg-[#0f0f17] border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.45)] overflow-hidden"
    : "bg-white rounded-3xl border border-slate-200/60 shadow-[0_18px_40px_rgba(15,23,42,0.08)] overflow-hidden";
  const tableHeaderClass = isMapache
    ? "flex items-center justify-between gap-4 px-6 sm:px-8 py-6 border-b border-white/10 bg-gradient-to-r from-[#0c0c14] via-[#11111c] to-[#161626]"
    : "flex items-center justify-between gap-4 px-6 sm:px-8 py-6 border-b border-slate-200/70 bg-gradient-to-r from-purple-50 via-purple-50 to-white";
  const tableIconShell = isMapache
    ? "h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center shadow-inner"
    : "h-12 w-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center shadow-inner";
  const tableSubtitleClass = isMapache ? "text-sm font-medium text-white/70" : "text-sm font-semibold text-purple-700";
  const tableTitleClass = isMapache ? "text-2xl font-bold text-white" : "text-2xl font-bold text-slate-900";
  const overviewCardClass = isMapache
    ? "mapache-surface-card rounded-3xl border-white/15 shadow-[0_30px_100px_rgba(0,0,0,0.55)] overflow-hidden"
    : "bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden";

  return (
    <div className={containerBg}>
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Modern Header with KPIs */}
        <div className={overviewCardClass}>
          <div className={headerBg}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{pageT("title")}</h1>
                    <p className="text-white/70 text-sm mt-0.5">
                      {rangeForQuarter.from} - {rangeForQuarter.to}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {winsSource === "pipedrive" && (
                    <div className="text-xs font-medium text-white/80">
                      {lastSyncedAt
                        ? `Última sincronización: ${lastSyncedAt.toLocaleString("es-AR")}`
                        : "Aún no sincronizaste"}
                    </div>
                  )}
                  <QuarterPicker year={year} quarter={quarter} onYear={setYear} onQuarter={setQuarter} />
                  {winsSource === "pipedrive" && (
                    <button
                      className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/20 hover:scale-[1.01]"
                      onClick={handleSync}
                      disabled={loadingDeals}
                    >
                      {loadingDeals ? "Sincronizando..." : "Sincronizar"}
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                <div className={kpiCardBg}>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-purple-200 font-medium uppercase tracking-wide">Objetivo</p>
                    <Tooltip content="Tu meta de ventas para este trimestre" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">${myGoal.toLocaleString()}</p>
                </div>
                <div className={kpiCardBg}>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-purple-200 font-medium uppercase tracking-wide">Progreso</p>
                    <Tooltip content="Total acumulado de ventas cerradas hasta ahora" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">${myProgress.toLocaleString()}</p>
                </div>
                <div className={kpiCardBg}>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-purple-200 font-medium uppercase tracking-wide">% Cumplimiento</p>
                    <Tooltip content="Porcentaje de tu objetivo alcanzado" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">
                    {myGoal > 0 ? ((myProgress / myGoal) * 100).toFixed(1) : "0.0"}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Improved Spacing */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {loadingDeals && myGoal === 0 ? (
            <CardSkeleton />
          ) : (
            <IndividualGoalCard
            range={rangeForQuarter}
            myGoal={myGoal}
            myProgress={myProgress}
            monthlyProgress={myMonthlyProgress}
            onSave={handleSaveMyGoal}
            onAddManual={canAddSelfManual ? () => setManualDialogTarget({ email: currentEmail || null }) : undefined}
            theme={theme}
          />
          )}
          {loadingTeam && teamGoal === 0 ? (
            <CardSkeleton />
          ) : (
            <TeamGoalCard
            year={year}
            quarter={quarter}
            isSuperAdmin={isSuperAdmin}
            role={role}
            allTeams={teams}
            effectiveTeam={effectiveTeam}
            onChangeTeam={setTeamFilter}
            teamGoal={teamGoal}
            teamProgress={teamProgress}
            sumMembersGoal={sumMembersGoal}
            onSaveTeamGoal={saveTeamGoal}
            theme={theme}
          />
          )}
        </div>

        {/* Secondary Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          <BillingSummaryCard
            deals={myDeals}
            totals={myTotals}
            loading={loadingDeals}
            goal={myGoal}
            onToggleHandOff={handleToggleHandOff}
            onAddManual={canAddSelfManual ? () => setManualDialogTarget({ email: currentEmail || null }) : undefined}
            onDeleteDeal={canAddManual ? handleDeleteManualWon : undefined}
            theme={theme}
          />
          
          {/* Team Members Table - Unified (replaces TeamRankingCard) */}
          <div className={tableCardClass}>
            <div className={tableHeaderClass}>
              <div className="flex items-center gap-4">
                <div className={tableIconShell}>
                  <Users2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={tableSubtitleClass}>
                    {pageT("teamTitle")}
                  </p>
                  <p className={tableTitleClass}>
                    {effectiveTeam ? pageT("teamTitleWithName", { team: effectiveTeam }) : pageT("teamTitle")}
                  </p>
                </div>
              </div>
              <button
                className={
                  isMapache
                    ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.35)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                    : "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                }
                onClick={exportCsv}
                disabled={!effectiveTeam || loadingTeam}
              >
                <Download className="h-4 w-4" />
                {teamT("exportCsv")}
              </button>
            </div>
            <div className="p-4 sm:p-5">
              {!effectiveTeam ? (
                <div className={isMapache 
                  ? "rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center"
                  : "rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-8 text-center"
                }>
                  <div className="mx-auto max-w-md">
                    <div className={isMapache
                      ? "h-16 w-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4"
                      : "h-16 w-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-4"
                    }>
                      <Users2 className={isMapache ? "h-8 w-8 text-white" : "h-8 w-8 text-purple-600"} />
                    </div>
                    <p className={isMapache ? "text-sm text-white/80 font-medium" : "text-sm text-purple-900 font-medium"}>
                      {isSuperAdmin ? pageT("emptyAdmin") : pageT("emptyMember")}
                    </p>
                  </div>
                </div>
              ) : (
                <TeamMembersTable
                  loading={loadingTeam}
                  rows={rows}
                  canEdit={isSuperAdmin || role === "lider" || role === "admin"}
                  canAddManual={canAddManual}
                  theme={theme}
                  onEditGoal={saveUserGoal}
                  onAddManual={(u) =>
                    setManualDialogTarget({ userId: u.id, email: u.email, name: u.name })
                  }
                  onShowDeals={(row) =>
                    setMemberDealsTarget({ user: row, deals: teamDealsByUser[row.userId] ?? [] })
                  }
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:gap-8">
          <BonusCalculatorCard
            goal={myGoal}
            progress={myProgress}
            handoffTotal={myTotals.handoff}
            pendingHandoff={myTotals.pending}
            theme={theme}
          />
        </div>
      </div>

      {manualDialogTarget && (
        <ManualWonDialog
          open={!!manualDialogTarget}
          onClose={closeManualDialog}
          target={manualDialogTarget}
          onSubmit={async (values) => {
            try {
              await handleManualWon(values);
            } catch (err) {
              toast.error(toastT("manualWonError"));
              throw err;
            }
          }}
        />
      )}

      {memberDealsTarget && (
        <MemberDealsModal
          open={!!memberDealsTarget}
          onClose={() => setMemberDealsTarget(null)}
          member={memberDealsTarget.user}
          deals={memberDealsTarget.deals}
          theme={theme}
          year={year}
          quarter={quarter}
        />
      )}

      <Modal
        open={!!deleteConfirmDeal}
        onClose={() => setDeleteConfirmDeal(null)}
        title={billingT("deleteManualTitle")}
        footer={
          <div className="flex justify-end gap-3">
            <button
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
              onClick={() => setDeleteConfirmDeal(null)}
            >
              {billingT("deleteCancel")}
            </button>
            <button
              className="rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400/50"
              onClick={confirmDeleteManualWon}
            >
              {billingT("deleteConfirm")}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-900">
              {billingT("deleteManualConfirm", { 
                company: deleteConfirmDeal?.companyName || billingT("unknownCompany") 
              })}
            </p>
          </div>
          {deleteConfirmDeal && (
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span className="font-medium">{billingT("monthlyFee")}:</span>
                <span className="font-semibold text-slate-900">
                  ${deleteConfirmDeal.monthlyFee.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{billingT("wonTypeLabel")}:</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  deleteConfirmDeal.wonType === "UPSELL" 
                    ? "bg-amber-100 text-amber-800" 
                    : "bg-purple-100 text-purple-800"
                }`}>
                  {deleteConfirmDeal.wonType === "UPSELL" ? billingT("wonTypeUpsell") : billingT("wonTypeNew")}
                </span>
              </div>
            </div>
          )}
          <p className="text-sm text-slate-500">
            {billingT("deleteWarning")}
          </p>
        </div>
      </Modal>
    </div>
  );
}
