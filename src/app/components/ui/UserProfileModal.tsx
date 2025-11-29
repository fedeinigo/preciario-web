// src/app/components/ui/UserProfileModal.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Modal from "@/app/components/ui/Modal";
import UserAvatar from "@/app/components/ui/UserAvatar";
import { Mail, Shield, Users2, TrendingUp, Calendar, Award, Briefcase, UserCircle2, RefreshCw, Clock } from "lucide-react";
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

type ProfileAppearance = "dark" | "light" | "mapache" | "direct" | "marketing";

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
  const [loadingData, setLoadingData] = useState(false);
  
  // Track the current target ID to detect changes
  const targetKey = targetUser?.id ?? targetUser?.email ?? "self";
  const prevTargetKeyRef = React.useRef(targetKey);
  
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

  const _isSelf =
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
  const [wonAmount, setWonAmount] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const range = useMemo(() => {
    return [q1Range, q2Range, q3Range, q4Range][quarter - 1](year);
  }, [year, quarter]);
  
  // Use a ref to track the current request's target to prevent race conditions
  const activeTargetKeyRef = React.useRef(targetKey);
  
  // Update the active target key when targetKey changes
  useEffect(() => {
    activeTargetKeyRef.current = targetKey;
  }, [targetKey]);
  
  const tryLoadFromCache = useCallback(() => {
    if (typeof window === "undefined") return null;
    const team = resolvedTarget.team;
    if (!team) return null;
    
    const cacheKey = `goals:pipedrive:team:${team}:${year}:Q${quarter}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const cached = JSON.parse(raw) as {
        rows?: Array<{
          userId?: string;
          email?: string | null;
          goal?: number;
          progress?: number;
          pct?: number;
        }>;
        lastSyncedAt?: string;
      };
      if (!cached.rows || !Array.isArray(cached.rows)) return null;
      
      const match = cached.rows.find((row) => 
        (resolvedTarget.id && row.userId === resolvedTarget.id) ||
        (resolvedTarget.email && row.email === resolvedTarget.email)
      );
      
      if (match) {
        return {
          goalAmount: Number(match.goal ?? 0),
          progressAmount: Number(match.progress ?? 0),
          pct: Number(match.pct ?? 0),
          lastSyncedAt: cached.lastSyncedAt ?? null,
        };
      }
    } catch {
      return null;
    }
    return null;
  }, [resolvedTarget.id, resolvedTarget.email, resolvedTarget.team, year, quarter]);

  const loadFromSnapshot = useCallback(async () => {
    const requestTargetKey = targetKey;
    if (!resolvedTarget.id) return null;
    
    try {
      const params = new URLSearchParams({
        year: String(year),
        quarter: String(quarter),
        userId: resolvedTarget.id,
      });
      const response = await fetch(`/api/goals/snapshot?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) return null;
      const payload = await response.json();
      
      if (activeTargetKeyRef.current !== requestTargetKey) return null;
      
      if (payload.found) {
        return {
          goalAmount: Number(payload.goalAmount ?? 0),
          progressAmount: Number(payload.progressAmount ?? 0),
          pct: Number(payload.pct ?? 0),
          lastSyncedAt: payload.lastSyncedAt ?? null,
        };
      }
    } catch {
      return null;
    }
    return null;
  }, [resolvedTarget.id, year, quarter, targetKey]);

  const loadGoalAndProgress = useCallback(async () => {
    const requestTargetKey = targetKey;
    
    const cached = tryLoadFromCache();
    if (cached) {
      if (activeTargetKeyRef.current === requestTargetKey) {
        setGoalAmount(cached.goalAmount);
        setWonAmount(cached.progressAmount);
        setLastSyncedAt(cached.lastSyncedAt);
      }
      return;
    }
    
    const snapshot = await loadFromSnapshot();
    if (snapshot) {
      if (activeTargetKeyRef.current === requestTargetKey) {
        setGoalAmount(snapshot.goalAmount);
        setWonAmount(snapshot.progressAmount);
        setLastSyncedAt(snapshot.lastSyncedAt);
      }
      return;
    }
    
    const qs: string[] = [`year=${year}`, `quarter=${quarter}`];
    if (resolvedTarget.id) qs.push(`userId=${encodeURIComponent(resolvedTarget.id)}`);
    else if (resolvedTarget.email) qs.push(`email=${encodeURIComponent(resolvedTarget.email)}`);
    
    try {
      const [goalRes, progressRes] = await Promise.all([
        fetch(`/api/goals/user?${qs.join("&")}`),
        fetch(`/api/goals/wins?${qs.join("&")}`, { cache: "no-store" }),
      ]);
      
      if (activeTargetKeyRef.current !== requestTargetKey) return;
      
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setGoalAmount(Number(goalData.amount ?? 0));
      }
      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setWonAmount(Number(progressData.progress ?? 0));
      }
    } catch {
      if (activeTargetKeyRef.current === requestTargetKey) {
        setGoalAmount(0);
        setWonAmount(0);
      }
    }
  }, [resolvedTarget.id, resolvedTarget.email, year, quarter, targetKey, tryLoadFromCache, loadFromSnapshot]);

  // Reset data when target changes to avoid showing stale data
  useEffect(() => {
    const targetChanged = prevTargetKeyRef.current !== targetKey;
    if (targetChanged) {
      prevTargetKeyRef.current = targetKey;
      setGoalAmount(0);
      setWonAmount(0);
      setLastSyncedAt(null);
      setLoadingData(true);
    }
  }, [targetKey]);

  // Load data when modal opens or target changes
  useEffect(() => {
    if (!open) return;
    
    setLoadingData(true);
    
    loadGoalAndProgress().finally(() => {
      setLoadingData(false);
    });
  }, [open, loadGoalAndProgress]);

  const handleSync = useCallback(async () => {
    if (syncing || !resolvedTarget.id) return;
    setSyncing(true);
    setLoadingData(true);
    
    try {
      const response = await fetch("/api/goals/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resolvedTarget.id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setGoalAmount(Number(data.goalAmount ?? 0));
          setWonAmount(Number(data.progressAmount ?? 0));
          setLastSyncedAt(data.lastSyncedAt ?? null);
        }
      }
    } catch (error) {
      console.error("sync-user-failed", error);
    } finally {
      setSyncing(false);
      setLoadingData(false);
    }
  }, [syncing, resolvedTarget.id]);

  const formatSyncDate = useCallback((isoString: string | null) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return "Hace un momento";
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours}h`;
      if (diffDays < 7) return `Hace ${diffDays} días`;
      
      return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  }, []);

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
  const isMarketingAppearance = appearance === "marketing";
  const isMapacheAppearance = appearance === "mapache";
  const isDirectAppearance = appearance === "direct";

  const panelClassName = [
    "max-w-full",
    isMarketingAppearance
      ? "bg-white text-[#0f406d] border border-[#cce8ff] shadow-[0_40px_120px_rgba(15,23,42,0.18)]"
      : isLightAppearance
        ? "bg-white text-slate-900 border border-slate-200 shadow-[0_35px_110px_rgba(15,23,42,0.12)]"
        : isMapacheAppearance
          ? "rounded-[34px] border border-cyan-500/30 shadow-[0_60px_170px_rgba(0,0,0,0.85)] backdrop-blur-[30px]"
          : isDirectAppearance
            ? "bg-white text-slate-900 border border-[#ede9fe] shadow-[0_35px_110px_rgba(76,29,149,0.2)]"
            : "bg-slate-950/90 text-white border border-white/10 shadow-[0_35px_110px_rgba(2,6,23,0.65)]",
  ].join(" ");
  
  const panelStyle = isMapacheAppearance 
    ? { 
        maxWidth: "min(100vw - 32px, 680px)",
        background: "linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.98))",
        color: "#fff"
      }
    : { maxWidth: "min(100vw - 32px, 680px)" };

  const headerClassName = isMarketingAppearance
    ? "bg-white border-b border-[#cce8ff] text-[#0f406d]"
    : isLightAppearance
      ? "bg-white border-b border-slate-100 text-slate-900"
      : isMapacheAppearance
        ? "bg-gradient-to-r from-[#8b5cf6]/22 via-[#6d28d9]/18 to-[#22d3ee]/24 border-b border-white/12 text-white px-6 py-5"
        : isDirectAppearance
          ? "bg-white border-b border-[#ede9fe] text-[#4c1d95]"
          : "bg-slate-950/70 border-b border-white/10 text-white";

  const titleClassName = isMarketingAppearance
    ? "text-lg font-semibold text-[#0f406d]"
    : isLightAppearance
      ? "text-lg font-semibold text-slate-900"
      : isDirectAppearance
        ? "text-lg font-semibold text-[#4c1d95]"
        : "text-lg font-semibold text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)]";
  const bodyTextClass = isMarketingAppearance
    ? "text-[#0f406d]"
    : isLightAppearance || isDirectAppearance
      ? "text-slate-900"
      : isMapacheAppearance
        ? "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
        : "text-white/95 drop-shadow-[0_3px_12px_rgba(0,0,0,0.35)]";
  const subtleTextClass = isMarketingAppearance
    ? "text-slate-600"
    : isLightAppearance || isDirectAppearance
      ? "text-slate-600"
      : isMapacheAppearance
        ? "text-cyan-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
        : "text-white/85";
  const labelTextClass = isMarketingAppearance
    ? "text-[#4b81b8]"
    : isLightAppearance
      ? "text-slate-500"
      : isDirectAppearance
        ? "text-[#4c1d95]"
        : isMapacheAppearance
          ? "text-cyan-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
          : "text-white/80";
  const valueTextClass = isMarketingAppearance
    ? "text-[#0f406d]"
    : isLightAppearance || isDirectAppearance
      ? "text-slate-900"
      : isMapacheAppearance
        ? "text-white font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
        : "text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.45)]";
  const strongValueClass = `${valueTextClass} text-lg font-semibold drop-shadow-[0_3px_12px_rgba(0,0,0,0.35)]`;
  const boldValueClass = `${valueTextClass} text-xl font-bold drop-shadow-[0_3px_12px_rgba(0,0,0,0.35)]`;
  const heroNumberClass = `${valueTextClass} text-3xl font-bold drop-shadow-[0_3px_12px_rgba(0,0,0,0.45)]`;

  const secondaryButtonClass = isMarketingAppearance
    ? "rounded-full border border-[#cce8ff] bg-white px-6 py-2.5 text-sm font-semibold text-[#0f406d] transition hover:bg-[#ecf5ff]"
    : isLightAppearance
      ? "rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      : isDirectAppearance
        ? "rounded-full border border-[#c4b5fd] bg-white px-6 py-2.5 text-sm font-semibold text-[#4c1d95] transition hover:bg-[#ede9fe]"
        : isMapacheAppearance
          ? "rounded-2xl border border-white/25 bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#22d3ee] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(99,102,241,0.45)] transition hover:shadow-[0_22px_55px_rgba(99,102,241,0.55)]"
          : "rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15";

  const statCardClass = isMarketingAppearance
    ? "rounded-2xl border border-[#cce8ff] bg-gradient-to-br from-white to-[#f5fbff] p-6 shadow-sm"
    : isLightAppearance
      ? "rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm"
      : isDirectAppearance
        ? "rounded-2xl border border-[#ede9fe] bg-white p-6 shadow-sm"
        : isMapacheAppearance
          ? "rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-slate-800/80 via-slate-900/70 to-indigo-950/60 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          : "rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-xl";

  const infoCardClass = isMarketingAppearance
    ? "rounded-xl border border-[#cce8ff] bg-[#f5fbff] p-4"
    : isLightAppearance
      ? "rounded-xl border border-slate-200 bg-white p-4"
      : isDirectAppearance
        ? "rounded-xl border border-[#ede9fe] bg-[#faf5ff] p-4"
        : isMapacheAppearance
          ? "rounded-xl border border-violet-400/25 bg-gradient-to-br from-slate-800/70 to-indigo-950/50 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.5)] backdrop-blur-lg"
          : "rounded-xl border border-white/20 bg-white/10 p-4";

  const backdropClassName = isMarketingAppearance
    ? "bg-[#0f172a]/30"
    : isLightAppearance
      ? "bg-black/30"
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
      variant={isMarketingAppearance || isLightAppearance || isDirectAppearance ? "default" : "inverted"}
      headerClassName={headerClassName}
      titleClassName={titleClassName}
      panelClassName={panelClassName}
      panelStyle={panelStyle}
      backdropClassName={backdropClassName}
      panelDataAttributes={isMapacheAppearance ? { "mapache-modal": "true" } : undefined}
      footer={
        <div className="flex justify-end items-center w-full">
          <button className={secondaryButtonClass} onClick={onClose}>
            {profileT("buttons.close")}
          </button>
        </div>
      }
    >
      <div className={`space-y-6 ${bodyTextClass}`} style={isMapacheAppearance ? { color: "#fff" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a" } : undefined}>
        {/* Profile Header - Más grande y elegante */}
        <div 
          className={`flex flex-col items-center text-center space-y-4 pb-6 border-b ${
            isMapacheAppearance ? "border-cyan-400/30" : isDirectAppearance ? "border-[#ede9fe]" : "border-current/10"
          }`}
          style={isMapacheAppearance ? { color: "#fff" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a" } : undefined}
        >
          <UserAvatar
            name={name}
            email={resolvedTarget.email ?? undefined}
            image={profileImage}
            size={88}
            className={`shadow-xl ${
              isMarketingAppearance 
                ? "ring-4 ring-[#b8dcff]" 
                : isLightAppearance 
                  ? "ring-4 ring-white/70" 
                  : isMapacheAppearance
                    ? "ring-4 ring-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                    : "ring-4 ring-white/20"
            }`}
          />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold" style={isMapacheAppearance ? { color: "#fff" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a" } : undefined}>{name}</h2>
            <div 
              className={`flex items-center justify-center gap-2 ${subtleTextClass}`}
              style={isMapacheAppearance ? { color: "#a5f3fc" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#475569" } : undefined}
            >
              <Mail className="h-4 w-4" style={isMapacheAppearance ? { color: "#a5f3fc" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#475569" } : undefined} />
              <span className="text-sm">{email}</span>
            </div>
          </div>
        </div>

        {/* Role, Team & Extra Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={infoCardClass}>
            <div 
              className={`flex items-center gap-2 ${labelTextClass} text-xs font-medium uppercase tracking-wide mb-2`}
              style={isMapacheAppearance ? { color: "#67e8f9" } : isDirectAppearance ? { color: "#7c3aed" } : (isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
            >
              <Shield className="h-4 w-4" />
              {profileT("labels.role")}
            </div>
            <div className={strongValueClass} style={isMapacheAppearance ? { color: "#fff" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a" } : undefined}>{role}</div>
          </div>
          <div className={infoCardClass}>
            <div 
              className={`flex items-center gap-2 ${labelTextClass} text-xs font-medium uppercase tracking-wide mb-2`}
              style={isMapacheAppearance ? { color: "#67e8f9" } : isDirectAppearance ? { color: "#7c3aed" } : (isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
            >
              <Users2 className="h-4 w-4" />
              {profileT("labels.team")}
            </div>
            <div className={strongValueClass} style={isMapacheAppearance ? { color: "#fff" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a" } : undefined}>{team}</div>
          </div>
          <div className={infoCardClass}>
            <div 
              className={`flex items-center gap-2 ${labelTextClass} text-xs font-medium uppercase tracking-wide mb-2`}
              style={isMapacheAppearance ? { color: "#67e8f9" } : isDirectAppearance ? { color: "#7c3aed" } : (isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
            >
              <Briefcase className="h-4 w-4" />
              {profileT("labels.position")}
            </div>
            <div className={strongValueClass} style={isMapacheAppearance ? { color: "#fff" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a" } : undefined}>{position}</div>
          </div>
          <div className={infoCardClass}>
            <div 
              className={`flex items-center gap-2 ${labelTextClass} text-xs font-medium uppercase tracking-wide mb-2`}
              style={isMapacheAppearance ? { color: "#67e8f9" } : isDirectAppearance ? { color: "#7c3aed" } : (isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
            >
              <UserCircle2 className="h-4 w-4" />
              {profileT("labels.leader")}
            </div>
            <div className={`${strongValueClass} break-words`} style={isMapacheAppearance ? { color: "#fff" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a" } : undefined}>{leader}</div>
          </div>
        </div>

        {/* Current Quarter Performance - Destaca el desempeño actual */}
        <div className={statCardClass}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${loadingData ? 'text-gray-400 animate-pulse' : pct >= 100 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-orange-500'}`} />
              <h3 
                className="text-sm font-semibold uppercase tracking-wide"
                style={isMapacheAppearance ? { color: "#fff", opacity: 1 } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a", opacity: 0.9 } : { opacity: 0.9 }}
              >
                Desempeño Q{quarter} {year}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {!loadingData && pct >= 100 && (
                <Award className="h-6 w-6 text-yellow-500" />
              )}
              {loadingData && (
                <div className={`h-5 w-5 animate-spin rounded-full border-2 ${
                  isMapacheAppearance ? "border-cyan-400 border-t-transparent" : 
                  isDirectAppearance ? "border-purple-600 border-t-transparent" : 
                  "border-slate-400 border-t-transparent"
                }`} />
              )}
              <button
                onClick={handleSync}
                disabled={syncing || loadingData}
                className={`p-1.5 rounded-lg transition ${
                  isMapacheAppearance 
                    ? "hover:bg-white/10 text-cyan-300 disabled:text-white/30" 
                    : isDirectAppearance 
                      ? "hover:bg-purple-100 text-purple-600 disabled:text-slate-300"
                      : "hover:bg-slate-100 text-slate-600 disabled:text-slate-300"
                }`}
                title="Sincronizar datos"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          
          {/* Last sync indicator */}
          {lastSyncedAt && (
            <div 
              className={`flex items-center gap-1.5 text-xs mb-3 ${
                isMapacheAppearance ? "text-cyan-300/70" : isDirectAppearance ? "text-purple-500/70" : "text-slate-500"
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>Última sincronización: {formatSyncDate(lastSyncedAt)}</span>
            </div>
          )}
          
          {/* Progress Bar - Más prominente */}
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-2">
              {loadingData ? (
                <>
                  <span className={`${heroNumberClass} animate-pulse`} style={isMapacheAppearance ? { color: "#fff", opacity: 0.5 } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a", opacity: 0.5 } : { opacity: 0.5 }}>
                    --%
                  </span>
                  <span className={`text-sm ${labelTextClass} animate-pulse`} style={{ opacity: 0.5 }}>
                    Cargando...
                  </span>
                </>
              ) : (
                <>
                  <span 
                    className={heroNumberClass} 
                    style={isMapacheAppearance ? { color: "#fff" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a" } : undefined}
                  >
                    {pct.toFixed(1)}%
                  </span>
                  <span 
                    className={`text-sm ${labelTextClass}`}
                    style={isMapacheAppearance ? { color: "#67e8f9" } : isDirectAppearance ? { color: "#7c3aed" } : (isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
                  >
                    {formatUSD(wonAmount)} / {formatUSD(goalAmount)}
                  </span>
                </>
              )}
            </div>
            <div className={`h-4 w-full rounded-full overflow-hidden ${
              isMarketingAppearance
                ? "bg-[#dbeeff]"
                : isLightAppearance
                  ? "bg-slate-200"
                  : isDirectAppearance
                    ? "bg-[#ede9fe]"
                    : isMapacheAppearance
                      ? "bg-white/18"
                      : "bg-white/20"
            }`}>
              <div
                className={`h-full transition-all duration-500 ${
                  loadingData ? 'animate-pulse opacity-30' : ''
                } ${
                  isMarketingAppearance
                    ? 'bg-gradient-to-r from-[#1d6ee3] via-[#5ba5f6] to-[#9dd7ff]'
                    : isLightAppearance
                      ? 'bg-gradient-to-r from-slate-900 to-slate-600'
                    : isDirectAppearance
                      ? 'bg-gradient-to-r from-[#4c1d95] via-[#6d28d9] to-[#7c3aed]'
                      : isMapacheAppearance
                        ? 'bg-gradient-to-r from-[#22d3ee] via-[#8b5cf6] to-[#c084fc]'
                        : 'bg-gradient-to-r from-white to-white/80'
                }`}
                style={{ width: loadingData ? '0%' : `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
          </div>

          {/* Stats Grid - Más compacto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div 
                className={`text-xs ${labelTextClass} mb-1`}
                style={isMapacheAppearance ? { color: "#67e8f9" } : isDirectAppearance ? { color: "#7c3aed" } : (isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
              >
                {metricsT("progress")}
              </div>
              <div 
                className={`${boldValueClass} ${loadingData ? 'animate-pulse' : ''}`}
                style={isMapacheAppearance ? { color: "#fff", opacity: loadingData ? 0.5 : 1 } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a", opacity: loadingData ? 0.5 : 1 } : { opacity: loadingData ? 0.5 : 1 }}
              >
                {loadingData ? '--' : formatUSD(wonAmount)}
              </div>
            </div>
            <div>
              <div 
                className={`text-xs ${labelTextClass} mb-1`}
                style={isMapacheAppearance ? { color: "#67e8f9" } : isDirectAppearance ? { color: "#7c3aed" } : (isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
              >
                {metricsT("remaining")}
              </div>
              <div 
                className={`${boldValueClass} ${loadingData ? 'animate-pulse' : ''}`}
                style={isMapacheAppearance ? { color: "#fff", opacity: loadingData ? 0.5 : 1 } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a", opacity: loadingData ? 0.5 : 1 } : { opacity: loadingData ? 0.5 : 1 }}
              >
                {loadingData ? '--' : formatUSD(Math.max(0, goalAmount - wonAmount))}
              </div>
            </div>
          </div>
        </div>

        {/* Period & Goal Overview */}
        <div 
          className={`space-y-4 p-5 rounded-2xl border ${
            isMarketingAppearance
              ? 'border-[#cce8ff] bg-[#f5fbff]'
              : isLightAppearance
                ? 'border-slate-200 bg-white'
                : isDirectAppearance
                  ? 'border-[#ede9fe] bg-[#faf5ff]'
                  : isMapacheAppearance
                    ? 'border-violet-400/25 bg-gradient-to-br from-slate-800/70 via-indigo-950/50 to-slate-900/60 backdrop-blur-xl'
                    : 'border-white/14 bg-gradient-to-br from-white/12 via-[#111827]/65 to-[#0b1221]/65 backdrop-blur-xl'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar 
              className={`h-4 w-4 ${labelTextClass}`} 
              style={isMapacheAppearance ? { color: "#67e8f9" } : isDirectAppearance ? { color: "#7c3aed" } : (isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
            />
            <span 
              className={`text-sm font-semibold ${labelTextClass} uppercase tracking-wide`}
              style={isMapacheAppearance ? { color: "#67e8f9" } : isDirectAppearance ? { color: "#7c3aed" } : (isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
            >
              {profileT("labels.period")}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div 
                className={`text-xs ${labelTextClass} mb-1`}
                style={isMapacheAppearance ? { color: "#67e8f9" } : isDirectAppearance ? { color: "#7c3aed" } : (isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
              >
                {profileT("labels.year")}
              </div>
              <div 
                className={strongValueClass}
                style={isMapacheAppearance ? { color: "#fff" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a" } : undefined}
              >
                {year}
              </div>
            </div>
            <div>
              <div 
                className={`text-xs ${labelTextClass} mb-1`}
                style={isMapacheAppearance ? { color: "#67e8f9" } : isDirectAppearance ? { color: "#7c3aed" } : (isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
              >
                {profileT("labels.quarter")}
              </div>
              <div 
                className={strongValueClass}
                style={isMapacheAppearance ? { color: "#fff" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a" } : undefined}
              >
                Q{quarter}
              </div>
            </div>
            <div>
              <div 
                className={`text-xs ${labelTextClass} mb-1`}
                style={isMapacheAppearance ? { color: "#67e8f9" } : isDirectAppearance ? { color: "#7c3aed" } : (isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
              >
                {profileT("labels.goal")} (USD)
              </div>
              <div 
                className={`${valueTextClass} text-lg font-bold ${loadingData ? 'animate-pulse' : ''}`}
                style={isMapacheAppearance ? { color: "#fff", opacity: loadingData ? 0.5 : 1 } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#0f172a", opacity: loadingData ? 0.5 : 1 } : { opacity: loadingData ? 0.5 : 1 }}
              >
                {loadingData ? '--' : formatUSD(goalAmount)}
              </div>
            </div>
          </div>
          <div 
            className={`text-xs ${subtleTextClass} text-center pt-2`}
            style={isMapacheAppearance ? { color: "#a5f3fc" } : (isDirectAppearance || isLightAppearance || isMarketingAppearance) ? { color: "#64748b" } : undefined}
          >
            {profileT("periodSummary", { year, quarter, from: range.from, to: range.to })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
