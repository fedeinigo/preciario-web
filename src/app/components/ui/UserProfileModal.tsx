// src/app/components/ui/UserProfileModal.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Modal from "@/app/components/ui/Modal";
import UserAvatar from "@/app/components/ui/UserAvatar";
import { Mail, Shield, Users2, TrendingUp, Calendar, Award, Briefcase, UserCircle2 } from "lucide-react";
import { formatUSD } from "@/app/components/features/proposals/lib/format";
import { q1Range, q2Range, q3Range, q4Range } from "@/app/components/features/proposals/lib/dateRanges";
import type { AppRole } from "@/constants/teams";
import { useTranslations } from "@/app/LanguageProvider";
import { useAdminUsers } from "@/app/components/features/proposals/hooks/useAdminUsers";

type Viewer = {
  id?: string | null;
  email?: string | null;
  role: AppRole | string;
  team?: string | null;
  name?: string | null;
  image?: string | null;
  positionName?: string | null;
  leaderEmail?: string | null;
};

type TargetUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: AppRole | string | null;
  team?: string | null;
  image?: string | null;
  positionName?: string | null;
  leaderEmail?: string | null;
};

type ProfileAppearance = "dark" | "light" | "mapache" | "direct";

export default function UserProfileModal({
  open,
  onClose,
  viewer,
  targetUser,
  appearance = "dark",
}: {
  open: boolean;
  onClose: () => void;
  viewer: Viewer;
  targetUser?: TargetUser;
  appearance?: ProfileAppearance;
}) {
  const profileT = useTranslations("common.profileModal");
  const rolesT = useTranslations("common.roles");
  const metricsT = useTranslations("goals.individual.metrics");

  const baseTarget = useMemo<TargetUser>(() => {
    if (targetUser?.email || targetUser?.id) {
      return {
        ...targetUser,
        image: targetUser.image ?? viewer.image ?? null,
      };
    }
    return {
      id: viewer.id ?? null,
      email: viewer.email ?? null,
      name: viewer.name ?? null,
      role: (viewer.role as AppRole) ?? "usuario",
      team: viewer.team ?? null,
      image: viewer.image ?? null,
      positionName: viewer.positionName ?? null,
      leaderEmail: viewer.leaderEmail ?? null,
    };
  }, [targetUser, viewer]);

  const [resolvedTarget, setResolvedTarget] = useState<TargetUser>(baseTarget);
  
  // Update resolvedTarget when baseTarget changes
  useEffect(() => {
    setResolvedTarget(baseTarget);
  }, [baseTarget]);

  // Only fetch admin users if we're missing critical data for enrichment
  // Use resolvedTarget since it updates after baseTarget sync
  const hasIdentityData = !!(
    resolvedTarget.team &&
    resolvedTarget.id &&
    resolvedTarget.role &&
    resolvedTarget.name
  );
  const hasPositionInfo = resolvedTarget.positionName !== undefined;
  const hasLeaderInfo = resolvedTarget.leaderEmail !== undefined;
  const { users: adminUsers } = useAdminUsers({
    isSuperAdmin: viewer.role === "admin",
    isLeader: viewer.role === "lider",
    enabled: !(hasIdentityData && hasPositionInfo && hasLeaderInfo),
  });

  useEffect(() => {
    if (!open) return;

    const needsEnrichment =
      !resolvedTarget.team ||
      !resolvedTarget.id ||
      !resolvedTarget.role ||
      !resolvedTarget.name ||
      resolvedTarget.positionName === undefined ||
      resolvedTarget.leaderEmail === undefined;
    if (!needsEnrichment) return;
    
    // Only try enrichment if we have admin users loaded
    if (!adminUsers.length) return;

    const match = adminUsers.find(
      (u) =>
        (!!resolvedTarget.id && u.id === resolvedTarget.id) ||
        (!!resolvedTarget.email && u.email === resolvedTarget.email)
    );
    if (match) {
      setResolvedTarget((prev) => ({
        id: match.id,
        email: match.email ?? prev.email ?? null,
        name: match.name ?? prev.name ?? null,
        role: match.role ?? prev.role ?? "usuario",
        team: match.team ?? prev.team ?? null,
        image: match.image ?? prev.image ?? null,
        positionName:
          match.positionName ?? (prev.positionName !== undefined ? prev.positionName : null),
        leaderEmail:
          match.leaderEmail ?? (prev.leaderEmail !== undefined ? prev.leaderEmail : null),
      }));
    }
  }, [
    open,
    adminUsers,
    resolvedTarget.id,
    resolvedTarget.email,
    resolvedTarget.team,
    resolvedTarget.role,
    resolvedTarget.name,
    resolvedTarget.positionName,
    resolvedTarget.leaderEmail,
  ]);

  const isSelf =
    (!!viewer.id && !!resolvedTarget.id && viewer.id === resolvedTarget.id) ||
    (!!viewer.email && !!resolvedTarget.email && viewer.email === resolvedTarget.email);

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const quarter = useMemo<1 | 2 | 3 | 4>(() => {
    const m = now.getMonth();
    if (m <= 2) return 1;
    if (m <= 5) return 2;
    if (m <= 8) return 3;
    return 4;
  }, [now]);

  const [goalAmount, setGoalAmount] = useState<number>(0);

  const range = useMemo(() => {
    return [q1Range, q2Range, q3Range, q4Range][quarter - 1](year);
  }, [year, quarter]);

  const [wonAmount, setWonAmount] = useState<number>(0);
  const loadProgress = useCallback(async () => {
    const params = new URLSearchParams({ year: String(year), quarter: String(quarter) });
    if (resolvedTarget.id) {
      params.set("userId", resolvedTarget.id);
    } else if (resolvedTarget.email) {
      params.set("email", resolvedTarget.email);
    } else {
      setWonAmount(0);
      return;
    }
    try {
      const response = await fetch(`/api/goals/wins?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("fail");
      const payload = (await response.json()) as { progress?: number };
      setWonAmount(Number(payload.progress ?? 0));
    } catch {
      setWonAmount(0);
    }
  }, [resolvedTarget.id, resolvedTarget.email, year, quarter]);

  const loadGoal = useCallback(async () => {
    try {
      const qs: string[] = [`year=${year}`, `quarter=${quarter}`];
      if (!isSelf) {
        if (resolvedTarget.id) qs.push(`userId=${encodeURIComponent(resolvedTarget.id)}`);
        else if (resolvedTarget.email) qs.push(`email=${encodeURIComponent(resolvedTarget.email)}`);
      } else if (resolvedTarget.id) {
        qs.push(`userId=${encodeURIComponent(resolvedTarget.id)}`);
      }
      const r = await fetch(`/api/goals/user?${qs.join("&")}`);
      const j = (await r.json()) as { amount?: number };
      const amt = Number(j.amount ?? 0);
      setGoalAmount(amt);
    } catch {
      setGoalAmount(0);
    }
  }, [resolvedTarget.id, resolvedTarget.email, year, quarter, isSelf]);

  useEffect(() => {
    if (open) {
      loadGoal().catch(() => undefined);
      loadProgress().catch(() => undefined);
    }
  }, [open, loadGoal, loadProgress]);

  const pct = useMemo(() => {
    if (goalAmount <= 0) return 0;
    return (wonAmount / goalAmount) * 100;
  }, [goalAmount, wonAmount]);

  const rolesMap = useMemo(
    () => ({
      admin: rolesT("admin"),
      lider: rolesT("lider"),
      usuario: rolesT("usuario"),
    }),
    [rolesT]
  );

  const resolveRole = useCallback(
    (value: AppRole | string | null | undefined) => {
      if (!value) return rolesT("unknown");
      const key = value.toString();
      return rolesMap[key as keyof typeof rolesMap] ?? key;
    },
    [rolesMap, rolesT]
  );

  const name = resolvedTarget.name ?? profileT("fallbacks.name");
  const role = resolveRole(resolvedTarget.role as AppRole | string | null);
  const team = resolvedTarget.team ?? profileT("fallbacks.team");
  const email = resolvedTarget.email ?? profileT("fallbacks.email");
  const profileImage = resolvedTarget.image ?? viewer.image ?? null;
  const position =
    resolvedTarget.positionName && resolvedTarget.positionName.trim().length > 0
      ? resolvedTarget.positionName
      : profileT("fallbacks.position");
  const leader =
    resolvedTarget.leaderEmail && resolvedTarget.leaderEmail.trim().length > 0
      ? resolvedTarget.leaderEmail
      : profileT("fallbacks.leader");

  const isLightAppearance = appearance === "light";
  const isMapacheAppearance = appearance === "mapache";
  const isDirectAppearance = appearance === "direct";

  const panelClassName = [
    "max-w-full",
    isLightAppearance
      ? "bg-white text-[#0f406d] border border-[#cce8ff] shadow-[0_40px_120px_rgba(15,23,42,0.18)]"
      : isMapacheAppearance
        ? "bg-[rgb(var(--mapache-surface-strong))]/95 text-white border border-white/10 shadow-[0_45px_130px_rgba(2,6,23,0.8)]"
        : isDirectAppearance
          ? "bg-white text-slate-900 border border-[#ede9fe] shadow-[0_35px_110px_rgba(76,29,149,0.2)]"
          : "bg-slate-950/90 text-white border border-white/10 shadow-[0_35px_110px_rgba(2,6,23,0.65)]",
  ].join(" ");

  const headerClassName = isLightAppearance
    ? "bg-white border-b border-[#cce8ff] text-[#0f406d]"
    : isMapacheAppearance
      ? "bg-slate-950/70 border-b border-white/10 text-white"
      : isDirectAppearance
        ? "bg-white border-b border-[#ede9fe] text-[#4c1d95]"
        : "bg-slate-950/70 border-b border-white/10 text-white";

  const titleClassName = isLightAppearance
    ? "text-lg font-semibold text-[#0f406d]"
    : isDirectAppearance
      ? "text-lg font-semibold text-[#4c1d95]"
      : "text-lg font-semibold text-white";
  const bodyTextClass = isLightAppearance
    ? "text-[#0f406d]"
    : isDirectAppearance
      ? "text-slate-900"
      : "text-white";
  const subtleTextClass = isLightAppearance
    ? "text-slate-600"
    : isDirectAppearance
      ? "text-slate-600"
      : "text-white/90";
  const labelTextClass = isLightAppearance
    ? "text-[#4b81b8]"
    : isDirectAppearance
      ? "text-[#4c1d95]"
      : "text-white/80";

  const secondaryButtonClass = isLightAppearance
    ? "rounded-full border border-[#cce8ff] bg-white px-6 py-2.5 text-sm font-semibold text-[#0f406d] transition hover:bg-[#ecf5ff]"
    : isDirectAppearance
      ? "rounded-full border border-[#c4b5fd] bg-white px-6 py-2.5 text-sm font-semibold text-[#4c1d95] transition hover:bg-[#ede9fe]"
      : "rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15";

  const statCardClass = isLightAppearance
    ? "rounded-2xl border border-[#cce8ff] bg-gradient-to-br from-white to-[#f5fbff] p-6 shadow-sm"
    : isDirectAppearance
      ? "rounded-2xl border border-[#ede9fe] bg-white p-6 shadow-sm"
      : "rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-xl";

  const infoCardClass = isLightAppearance
    ? "rounded-xl border border-[#cce8ff] bg-[#f5fbff] p-4"
    : isDirectAppearance
      ? "rounded-xl border border-[#ede9fe] bg-[#faf5ff] p-4"
      : "rounded-xl border border-white/20 bg-white/10 p-4";

  const backdropClassName = isLightAppearance
    ? "bg-[#0f172a]/30"
    : isMapacheAppearance
      ? "bg-slate-950/75"
      : isDirectAppearance
        ? "bg-black/50"
        : "bg-black/60";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={profileT("title")}
      variant={isLightAppearance || isDirectAppearance ? "default" : "inverted"}
      headerClassName={headerClassName}
      titleClassName={titleClassName}
      panelClassName={panelClassName}
      panelStyle={{ maxWidth: "min(100vw - 32px, 680px)" }}
      backdropClassName={backdropClassName}
      footer={
        <div className="flex justify-end items-center w-full">
          <button className={secondaryButtonClass} onClick={onClose}>
            {profileT("buttons.close")}
          </button>
        </div>
      }
    >
      <div className={`space-y-6 ${bodyTextClass}`}>
        {/* Profile Header - Más grande y elegante */}
        <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-current/10">
          <UserAvatar
            name={name}
            email={resolvedTarget.email ?? undefined}
            image={profileImage}
            size={88}
            className={`shadow-xl ${isLightAppearance ? "ring-4 ring-[#b8dcff]" : "ring-4 ring-white/20"}`}
          />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{name}</h2>
            <div className={`flex items-center justify-center gap-2 ${subtleTextClass}`}>
              <Mail className="h-4 w-4" />
              <span className="text-sm">{email}</span>
            </div>
          </div>
        </div>

        {/* Role, Team & Extra Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={infoCardClass}>
            <div className={`flex items-center gap-2 ${labelTextClass} text-xs font-medium uppercase tracking-wide mb-2`}>
              <Shield className="h-4 w-4" />
              {profileT("labels.role")}
            </div>
            <div className="text-lg font-semibold">{role}</div>
          </div>
          <div className={infoCardClass}>
            <div className={`flex items-center gap-2 ${labelTextClass} text-xs font-medium uppercase tracking-wide mb-2`}>
              <Users2 className="h-4 w-4" />
              {profileT("labels.team")}
            </div>
            <div className="text-lg font-semibold">{team}</div>
          </div>
          <div className={infoCardClass}>
            <div className={`flex items-center gap-2 ${labelTextClass} text-xs font-medium uppercase tracking-wide mb-2`}>
              <Briefcase className="h-4 w-4" />
              {profileT("labels.position")}
            </div>
            <div className="text-lg font-semibold">{position}</div>
          </div>
          <div className={infoCardClass}>
            <div className={`flex items-center gap-2 ${labelTextClass} text-xs font-medium uppercase tracking-wide mb-2`}>
              <UserCircle2 className="h-4 w-4" />
              {profileT("labels.leader")}
            </div>
            <div className="text-lg font-semibold break-words">{leader}</div>
          </div>
        </div>

        {/* Current Quarter Performance - Destaca el desempeño actual */}
        <div className={statCardClass}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${pct >= 100 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-orange-500'}`} />
              <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">
                Desempeño Q{quarter} {year}
              </h3>
            </div>
            {pct >= 100 && (
              <Award className="h-6 w-6 text-yellow-500" />
            )}
          </div>
          
          {/* Progress Bar - Más prominente */}
          <div className="mb-6">
            <div className={`flex justify-between items-baseline mb-2`}>
              <span className="text-3xl font-bold">{pct.toFixed(1)}%</span>
              <span className={`text-sm ${labelTextClass}`}>
                {formatUSD(wonAmount)} / {formatUSD(goalAmount)}
              </span>
            </div>
            <div className={`h-4 w-full rounded-full overflow-hidden ${
              isLightAppearance ? "bg-[#dbeeff]" : isDirectAppearance ? "bg-[#ede9fe]" : "bg-white/20"
            }`}>
              <div 
                className={`h-full transition-all duration-500 ${
                  isLightAppearance 
                    ? 'bg-gradient-to-r from-[#1d6ee3] via-[#5ba5f6] to-[#9dd7ff]'
                    : isDirectAppearance
                      ? 'bg-gradient-to-r from-[#4c1d95] via-[#6d28d9] to-[#7c3aed]'
                      : 'bg-gradient-to-r from-white to-white/80'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} 
              />
            </div>
          </div>

          {/* Stats Grid - Más compacto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={`text-xs ${labelTextClass} mb-1`}>{metricsT("progress")}</div>
              <div className="text-xl font-bold">{formatUSD(wonAmount)}</div>
            </div>
            <div>
              <div className={`text-xs ${labelTextClass} mb-1`}>{metricsT("remaining")}</div>
              <div className="text-xl font-bold">{formatUSD(Math.max(0, goalAmount - wonAmount))}</div>
            </div>
          </div>
        </div>

        {/* Period & Goal Overview */}
        <div className={`space-y-4 p-5 rounded-2xl border ${
          isLightAppearance
            ? 'border-[#cce8ff] bg-[#f5fbff]'
            : isDirectAppearance
              ? 'border-[#ede9fe] bg-[#faf5ff]'
              : 'border-white/10 bg-white/5'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className={`h-4 w-4 ${labelTextClass}`} />
            <span className={`text-sm font-semibold ${labelTextClass} uppercase tracking-wide`}>
              {profileT("labels.period")}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className={`text-xs ${labelTextClass} mb-1`}>{profileT("labels.year")}</div>
              <div className="text-lg font-semibold">{year}</div>
            </div>
            <div>
              <div className={`text-xs ${labelTextClass} mb-1`}>{profileT("labels.quarter")}</div>
              <div className="text-lg font-semibold">Q{quarter}</div>
            </div>
            <div>
              <div className={`text-xs ${labelTextClass} mb-1`}>{profileT("labels.goal")} (USD)</div>
              <div className="text-lg font-bold">{formatUSD(goalAmount)}</div>
            </div>
          </div>
          <div className={`text-xs ${subtleTextClass} text-center pt-2`}>
            {profileT("periodSummary", { year, quarter, from: range.from, to: range.to })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
