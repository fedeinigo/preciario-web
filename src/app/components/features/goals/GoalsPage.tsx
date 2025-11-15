// src/app/components/features/goals/GoalsPage.tsx
"use client";

import React from "react";
import type { AppRole } from "@/constants/teams";
import { toast } from "@/app/components/ui/toast";
import UserProfileModal from "@/app/components/ui/UserProfileModal";
import { useTranslations } from "@/app/LanguageProvider";
import { q1Range, q2Range, q3Range, q4Range } from "../proposals/lib/dateRanges";
import { useAdminUsers } from "../proposals/hooks/useAdminUsers";
import QuarterPicker from "./components/QuarterPicker";
import IndividualGoalCard from "./components/IndividualGoalCard";
import TeamGoalCard from "./components/TeamGoalCard";
import TeamMembersTable, { TeamGoalRow } from "./components/TeamMembersTable";
import BillingSummaryCard, { UserWonDeal } from "./components/BillingSummaryCard";
import TeamRankingCard from "./components/TeamRankingCard";
import { Download, Users2, Target } from "lucide-react";
import ManualWonDialog from "./components/ManualWonDialog";
import BillingEditorModal from "./components/BillingEditorModal";
import CardSkeleton from "@/app/components/ui/skeletons/CardSkeleton";
import Tooltip from "@/app/components/ui/Tooltip";

type Props = {
  role: AppRole;
  currentEmail: string;
  leaderTeam: string | null;
  isSuperAdmin: boolean;
};

type TeamMemberResponse = {
  userId?: string | number;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  team?: string | null;
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

  const now = new Date();
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
  const [myTotals, setMyTotals] = React.useState<{ monthlyFees: number; billed: number; pending: number }>({
    monthlyFees: 0,
    billed: 0,
    pending: 0,
  });
  const [loadingDeals, setLoadingDeals] = React.useState<boolean>(false);
  const [manualDialogTarget, setManualDialogTarget] = React.useState<
    { userId?: string; email?: string | null; name?: string | null } | null
  >(null);
  const closeManualDialog = React.useCallback(() => setManualDialogTarget(null), []);

  const [billingEditorDeal, setBillingEditorDeal] = React.useState<UserWonDeal | null>(null);

  const loadMyGoal = React.useCallback(async () => {
    try {
      const r = await fetch(`/api/goals/user?year=${year}&quarter=${quarter}`);
      const j = await r.json();
      setMyGoal(Number(j.amount || 0));
    } catch {
      setMyGoal(0);
    }
  }, [year, quarter]);

  const loadMyWins = React.useCallback(async () => {
    setLoadingDeals(true);
    try {
      const params = new URLSearchParams({ year: String(year), quarter: String(quarter) });
      const response = await fetch(`/api/goals/wins?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load wins");
      const payload = (await response.json()) as {
        progress?: number;
        deals?: Array<UserWonDeal>;
        totals?: { monthlyFees?: number; billed?: number; pending?: number };
      };
      const normalizedDeals = (payload.deals ?? []).map((deal) => {
        const wonType: "NEW_CUSTOMER" | "UPSELL" = deal.wonType === "UPSELL" ? "UPSELL" : "NEW_CUSTOMER";
        return {
          ...deal,
          monthlyFee: Number(deal.monthlyFee ?? 0),
          billedAmount: Number(deal.billedAmount ?? 0),
          pendingAmount: Number(deal.pendingAmount ?? 0),
          billingPct: Number.isFinite(deal.billingPct) ? deal.billingPct : 0,
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
      const totals = normalizedDeals.reduce(
        (acc, deal) => {
          acc.monthlyFees += Number(deal.monthlyFee ?? 0);
          acc.billed += Number(deal.billedAmount ?? 0);
          acc.pending += Number(deal.pendingAmount ?? Math.max(0, deal.monthlyFee - deal.billedAmount));
          return acc;
        },
        { monthlyFees: 0, billed: 0, pending: 0 }
      );
      setMyTotals({
        monthlyFees: Number.isFinite(payload.totals?.monthlyFees ?? NaN)
          ? Number(payload.totals?.monthlyFees)
          : totals.monthlyFees,
        billed: Number.isFinite(payload.totals?.billed ?? NaN) ? Number(payload.totals?.billed) : totals.billed,
        pending: Number.isFinite(payload.totals?.pending ?? NaN) ? Number(payload.totals?.pending) : totals.pending,
      });
    } catch {
      setMyProgress(0);
      setMyDeals([]);
      setMyMonthlyProgress(0);
      setMyTotals({ monthlyFees: 0, billed: 0, pending: 0 });
    } finally {
      setLoadingDeals(false);
    }
  }, [quarter, year]);

  React.useEffect(() => {
    loadMyGoal();
    loadMyWins();
  }, [loadMyGoal, loadMyWins]);

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
    adminUsers.forEach((u) => {
      const t = (u.team || "").trim();
      if (!t) return;
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    return Array.from(counts.entries())
      .filter(([, count]) => count > 0)
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b));
  }, [adminUsers, isSuperAdmin, role]);

  const [teamFilter, setTeamFilter] = React.useState<string>("");
  const effectiveTeam = (isSuperAdmin || role === "admin") ? teamFilter : (leaderTeam ?? "");

  const [teamGoal, setTeamGoal] = React.useState<number>(0);
  const [teamProgress, setTeamProgress] = React.useState<number>(0);
  const [rows, setRows] = React.useState<TeamGoalRow[]>([]);
  const [loadingTeam, setLoadingTeam] = React.useState<boolean>(false);
  const canAddManual = isSuperAdmin || role === "lider" || role === "admin";
  const canAddSelfManual = true;

  const loadTeam = React.useCallback(async () => {
    const canSelectTeam = isSuperAdmin || role === "admin";
    if (!canSelectTeam && !effectiveTeam) {
      setRows([]);
      setTeamGoal(0);
      setTeamProgress(0);
      return;
    }
    if (canSelectTeam && !effectiveTeam) {
      setRows([]);
      setTeamGoal(0);
      setTeamProgress(0);
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
      setRows(
        members.map((member) => ({
          userId: String(member.userId ?? ""),
          email: member.email ?? null,
          name: member.name ?? null,
          role: member.role ?? null,
          team: member.team ?? null,
          goal: Number(member.goal ?? 0),
          progress: Number(member.progress ?? 0),
          pct: Number(member.pct ?? 0),
          dealsCount: Number(member.dealsCount ?? 0),
        }))
      );
    } catch {
      setTeamGoal(0); setTeamProgress(0); setRows([]);
    } finally {
      setLoadingTeam(false);
    }
  }, [effectiveTeam, isSuperAdmin, role, year, quarter]);

  React.useEffect(() => { loadTeam(); }, [loadTeam]);

  React.useEffect(() => {
    const handleRefresh = () => {
      loadMyWins();
      if (isSuperAdmin || role === "lider" || role === "admin") {
        loadTeam();
      }
    };
    window.addEventListener("proposals:refresh", handleRefresh as EventListener);
    return () => window.removeEventListener("proposals:refresh", handleRefresh as EventListener);
  }, [isSuperAdmin, role, loadMyWins, loadTeam]);

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
    async (deal: UserWonDeal) => {
      if (!deal.manualDealId) return;
      const confirmed = window.confirm(
        billingT("deleteManualConfirm", { company: deal.companyName || billingT("unknownCompany") })
      );
      if (!confirmed) return;
      try {
        const res = await fetch(`/api/goals/wins?manualDealId=${deal.manualDealId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("fail");
        toast.success(toastT("manualWonDeleted"));
        await loadMyWins();
        if (isSuperAdmin || role === "lider" || role === "admin") {
          await loadTeam();
        }
      } catch {
        toast.error(toastT("manualWonDeleteError"));
      }
    },
    [billingT, toastT, loadMyWins, isSuperAdmin, role, loadTeam]
  );

  const handleUpdateBilling = React.useCallback(
    async (deal: UserWonDeal, billedAmount: number) => {
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
        const updated = prev.map((item) =>
          item.id === deal.id
            ? {
                ...item,
                billedAmount: billed,
                pendingAmount: Math.max(0, item.monthlyFee - billed),
                billingPct: item.monthlyFee > 0 ? (billed / item.monthlyFee) * 100 : 0,
              }
            : item
        );
        const totals = updated.reduce(
          (acc, item) => {
            acc.monthlyFees += item.monthlyFee;
            acc.billed += item.billedAmount;
            acc.pending += item.pendingAmount;
            return acc;
          },
          { monthlyFees: 0, billed: 0, pending: 0 }
        );
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
        return updated;
      });
    },
    []
  );

  const openBillingEditor = React.useCallback(
    (deal: UserWonDeal) => {
      setBillingEditorDeal(deal);
    },
    []
  );

  const handleSaveBilling = React.useCallback(
    async (billedAmount: number) => {
      if (!billingEditorDeal) return;
      try {
        await handleUpdateBilling(billingEditorDeal, billedAmount);
        toast.success(toastT("billingSaved"));
      } catch {
        toast.error(toastT("billingError"));
        throw new Error("Failed to save billing");
      }
    },
    [billingEditorDeal, handleUpdateBilling, toastT]
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

  const [profileOpen, setProfileOpen] = React.useState(false);
  const [profileUser, setProfileUser] = React.useState<
    { id: string; email: string | null; name: string | null; team?: string | null; role?: string | null } | null
  >(null);

  const sumMembersGoal = React.useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.goal || 0), 0),
    [rows]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-purple-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Modern Header with KPIs */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="bg-gradient-to-r from-[#311160] via-[#4c1d95] to-[#5b21b6] px-6 sm:px-8 py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{pageT("title")}</h1>
                    <p className="text-purple-200 text-sm mt-0.5">
                      {rangeForQuarter.from} - {rangeForQuarter.to}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <QuarterPicker year={year} quarter={quarter} onYear={setYear} onQuarter={setQuarter} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-purple-200 font-medium uppercase tracking-wide">Objetivo</p>
                    <Tooltip content="Tu meta de ventas para este trimestre" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">${myGoal.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-purple-200 font-medium uppercase tracking-wide">Progreso</p>
                    <Tooltip content="Total acumulado de ventas cerradas hasta ahora" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">${myProgress.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
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
            onEditBilling={openBillingEditor}
            onAddManual={canAddSelfManual ? () => setManualDialogTarget({ email: currentEmail || null }) : undefined}
            onDeleteDeal={handleDeleteManualWon}
          />
          <TeamRankingCard rows={rows} loading={loadingTeam} effectiveTeam={effectiveTeam} />
        </div>

        {/* Team Members Table - Enhanced */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 sm:px-8 py-6 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-slate-50 to-purple-50/20">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200/50">
                <Users2 className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                  {pageT("teamTitle")}
                </p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {effectiveTeam ? pageT("teamTitleWithName", { team: effectiveTeam }) : pageT("teamTitle")}
                </p>
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              onClick={exportCsv}
              disabled={!effectiveTeam || loadingTeam}
            >
              <Download className="h-4 w-4" />
              {teamT("exportCsv")}
            </button>
          </div>
          <div className="p-6 sm:p-8">
            {!effectiveTeam ? (
              <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-8 text-center">
                <div className="mx-auto max-w-md">
                  <div className="h-16 w-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <Users2 className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-sm text-purple-900 font-medium">
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
                onEditGoal={saveUserGoal}
                onOpenProfile={(u) => {
                  // Use team from row (API) instead of effectiveTeam to ensure it's always present
                  setProfileUser({ ...u, team: u.team ?? effectiveTeam, role: u.role });
                  setProfileOpen(true);
                }}
                onAddManual={(u) =>
                  setManualDialogTarget({ userId: u.id, email: u.email, name: u.name })
                }
              />
            )}
          </div>
        </div>
      </div>

      {profileUser && (
        <UserProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          viewer={{ role, team: leaderTeam }}
          targetUser={profileUser}
          appearance="light"
        />
      )}
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

      <BillingEditorModal
        deal={billingEditorDeal}
        isOpen={billingEditorDeal !== null}
        onClose={() => setBillingEditorDeal(null)}
        onSave={handleSaveBilling}
      />
    </div>
  );
}
