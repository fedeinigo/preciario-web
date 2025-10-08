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
import { Download, Users2 } from "lucide-react";

type Props = {
  role: AppRole;
  currentEmail: string;
  leaderTeam: string | null;
  isSuperAdmin: boolean;
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

  // ---- Mi objetivo
  const [myGoal, setMyGoal] = React.useState<number>(0);
  const [myProgress, setMyProgress] = React.useState<number>(0);
  const [myDeals, setMyDeals] = React.useState<UserWonDeal[]>([]);
  const [loadingDeals, setLoadingDeals] = React.useState<boolean>(false);

  const loadMyGoal = React.useCallback(async () => {
    try {
      const r = await fetch(`/api/goals/user?year=${year}&quarter=${quarter}`);
      const j = await r.json();
      setMyGoal(Number(j.amount || 0));
    } catch {
      setMyGoal(0);
    }
  }, [year, quarter]);

  const loadMyProgress = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        aggregate: "sum",
        status: "WON",
        userEmail: currentEmail,
        from: rangeForQuarter.from,
        to: rangeForQuarter.to,
      });
      const response = await fetch(`/api/proposals?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load progress");
      const payload = (await response.json()) as { totalAmount?: number };
      setMyProgress(Number(payload.totalAmount ?? 0));
    } catch {
      setMyProgress(0);
    }
  }, [currentEmail, rangeForQuarter]);

  const loadMyDeals = React.useCallback(async () => {
    setLoadingDeals(true);
    try {
      const params = new URLSearchParams({
        status: "WON",
        userEmail: currentEmail,
        from: rangeForQuarter.from,
        to: rangeForQuarter.to,
        pageSize: "200",
      });
      const response = await fetch(`/api/proposals?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load deals");
      const payload = (await response.json()) as Array<{
        id: string;
        companyName: string | null;
        totalAmount: number;
        docId?: string | null;
        docUrl?: string | null;
      }>;
      setMyDeals(
        payload.map((deal) => ({
          id: deal.id,
          companyName: deal.companyName,
          totalAmount: Number(deal.totalAmount ?? 0),
          docId: deal.docId ?? null,
          docUrl: deal.docUrl ?? null,
        }))
      );
    } catch {
      setMyDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  }, [currentEmail, rangeForQuarter]);

  React.useEffect(() => {
    loadMyGoal();
    loadMyProgress();
    loadMyDeals();
  }, [loadMyGoal, loadMyProgress, loadMyDeals]);

  const handleSaveMyGoal = async (amount: number) => {
    const r = await fetch("/api/goals/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, year, quarter }),
    });
    if (!r.ok) return toast.error(toastT("myGoalError"));
    toast.success(toastT("myGoalSaved"));
    setMyGoal(amount);
  };

  // ---- Equipo (visibles para TODOS). Para superadmin: ocultar equipos vacíos.
  const teams = React.useMemo(() => {
    if (!isSuperAdmin) return [] as string[];
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
  }, [adminUsers, isSuperAdmin]);

  const [teamFilter, setTeamFilter] = React.useState<string>("");
  const effectiveTeam = isSuperAdmin ? teamFilter : (leaderTeam ?? "");

  const [teamGoal, setTeamGoal] = React.useState<number>(0);
  const [teamProgress, setTeamProgress] = React.useState<number>(0);
  const [rows, setRows] = React.useState<TeamGoalRow[]>([]);
  const [loadingTeam, setLoadingTeam] = React.useState<boolean>(false);
  const [teamDealCounts, setTeamDealCounts] = React.useState<Record<string, number>>({});

  const loadTeam = React.useCallback(async () => {
    if (!isSuperAdmin && !effectiveTeam) { setRows([]); setTeamGoal(0); setTeamProgress(0); return; }
    if (isSuperAdmin && !effectiveTeam) { setRows([]); setTeamGoal(0); setTeamProgress(0); return; }
    setLoadingTeam(true);
    try {
      const r = await fetch(
        `/api/goals/team?year=${year}&quarter=${quarter}&team=${encodeURIComponent(effectiveTeam)}`
      );
      if (!r.ok) throw new Error("team");
      const j = await r.json();
      setTeamGoal(Number(j.teamGoal || 0));
      setTeamProgress(Number(j.teamProgress || 0));
      setRows((j.members ?? []) as TeamGoalRow[]);
    } catch {
      setTeamGoal(0); setTeamProgress(0); setRows([]);
    } finally {
      setLoadingTeam(false);
    }
  }, [effectiveTeam, isSuperAdmin, year, quarter]);

  React.useEffect(() => { loadTeam(); }, [loadTeam]);

  React.useEffect(() => {
    const handleRefresh = () => {
      loadMyProgress();
      if (isSuperAdmin || role === "lider") {
        loadTeam();
      }
      loadMyDeals();
    };
    window.addEventListener("proposals:refresh", handleRefresh as EventListener);
    return () => window.removeEventListener("proposals:refresh", handleRefresh as EventListener);
  }, [isSuperAdmin, role, loadMyProgress, loadTeam, loadMyDeals]);

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

  const loadTeamDealCounts = React.useCallback(
    async (members: TeamGoalRow[]) => {
      if (!members.length) {
        setTeamDealCounts({});
        return;
      }
      const entries = await Promise.all(
        members.map(async (member) => {
          const email = member.email;
          if (!email) return [member.userId, 0] as const;
          try {
            const params = new URLSearchParams({
              aggregate: "sum",
              status: "WON",
              userEmail: email,
              from: rangeForQuarter.from,
              to: rangeForQuarter.to,
            });
            const res = await fetch(`/api/proposals?${params.toString()}`, { cache: "no-store" });
            if (!res.ok) throw new Error("fail");
            const data = (await res.json()) as { count?: number };
            return [member.userId, Number(data.count ?? 0)] as const;
          } catch {
            return [member.userId, 0] as const;
          }
        })
      );
      setTeamDealCounts(Object.fromEntries(entries));
    },
    [rangeForQuarter]
  );

  React.useEffect(() => {
    if (!effectiveTeam) {
      setTeamDealCounts({});
      return;
    }
    loadTeamDealCounts(rows);
  }, [effectiveTeam, rows, loadTeamDealCounts]);

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
    { id: string; email: string | null; name: string | null; team?: string | null } | null
  >(null);

  const sumMembersGoal = React.useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.goal || 0), 0),
    [rows]
  );

  const textureStyle: React.CSSProperties = {
    backgroundColor: "#f8f5ff",
    backgroundImage:
      "radial-gradient( rgba(76,29,149,0.06) 1px, transparent 1px ), radial-gradient( rgba(76,29,149,0.04) 1px, transparent 1px )",
    backgroundSize: "16px 16px, 24px 24px",
    backgroundPosition: "0 0, 8px 8px",
    borderRadius: "12px",
  };

  return (
    <div className="space-y-6" style={textureStyle}>
      {/* Header Objetivos */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 h-12 flex items-center text-white font-semibold bg-[#4c1d95]">
          {pageT("title")}
        </div>
        <div className="p-4">
          <QuarterPicker year={year} quarter={quarter} onYear={setYear} onQuarter={setQuarter} />
        </div>
      </div>

      {/* 2 tarjetas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        <IndividualGoalCard
          year={year}
          quarter={quarter}
          range={rangeForQuarter}
          myGoal={myGoal}
          myProgress={myProgress}
          onSave={handleSaveMyGoal}
        />
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <BillingSummaryCard
          deals={myDeals}
          goal={myGoal}
          progress={myProgress}
          loading={loadingDeals}
        />
        <TeamRankingCard
          rows={rows}
          loading={loadingTeam}
          dealCounts={teamDealCounts}
          effectiveTeam={effectiveTeam}
        />
      </div>

      {/* Tabla de equipo */}
      <div className="max-w-6xl mx-auto">
        <div className="overflow-hidden rounded-3xl border border-[#eadeff] bg-white shadow-[0_20px_45px_rgba(76,29,149,0.1)]">
          <div className="flex flex-col gap-3 border-b border-[#efe7ff] px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-[#4c1d95]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ede9fe]">
                <Users2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c3aed]">
                  {pageT("teamTitle")}
                </p>
                <p className="text-xl font-semibold text-[#2f0f5d]">
                  {effectiveTeam ? pageT("teamTitleWithName", { team: effectiveTeam }) : pageT("teamTitle")}
                </p>
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ede9fe] px-5 py-2 text-sm font-semibold text-[#4c1d95] transition hover:bg-[#dcd0ff] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={exportCsv}
              disabled={!effectiveTeam || loadingTeam}
            >
              <Download className="h-4 w-4" />
              {teamT("exportCsv")}
            </button>
          </div>
          <div className="p-6">
            {!effectiveTeam ? (
              <div className="rounded-2xl border border-dashed border-[#d8c7ff] bg-[#faf7ff] p-6 text-sm text-[#5b21b6]">
                {isSuperAdmin ? pageT("emptySuperadmin") : pageT("emptyMember")}
              </div>
            ) : (
              <TeamMembersTable
                loading={loadingTeam}
                rows={rows}
                canEdit={isSuperAdmin || role === "lider"}
                onEditGoal={saveUserGoal}
                onOpenProfile={(u) => {
                  setProfileUser({ ...u, team: effectiveTeam });
                  setProfileOpen(true);
                }}
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
        />
      )}
    </div>
  );
}
