// src/app/components/ui/UserProfileModal.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Modal from "@/app/components/ui/Modal";
import { Mail, Shield, Users2, TrendingUp, Calendar, Award } from "lucide-react";
import { toast } from "@/app/components/ui/toast";
import { formatUSD } from "@/app/components/features/proposals/lib/format";
import { q1Range, q2Range, q3Range, q4Range } from "@/app/components/features/proposals/lib/dateRanges";
import type { AppRole } from "@/constants/teams";
import { useTranslations } from "@/app/LanguageProvider";
import { useAdminUsers } from "@/app/components/features/proposals/hooks/useAdminUsers";
import ManualWonDialog from "@/app/components/features/goals/components/ManualWonDialog";

type Viewer = {
  id?: string | null;
  email?: string | null;
  role: AppRole | string;
  team?: string | null;
  name?: string | null;
};

type TargetUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: AppRole | string | null;
  team?: string | null;
};

type ProfileAppearance = "dark" | "light" | "mapache" | "direct";

function initials(fullName: string) {
  const parts = fullName.split(" ").filter(Boolean);
  const i1 = parts[0]?.[0] ?? "";
  const i2 = parts[1]?.[0] ?? "";
  return (i1 + i2).toUpperCase();
}

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
  const toastT = useTranslations("goals.toast");
  const metricsT = useTranslations("goals.individual.metrics");
  const billingT = useTranslations("goals.billing");

  const baseTarget = useMemo<TargetUser>(() => {
    if (targetUser?.email || targetUser?.id) return targetUser;
    return {
      id: viewer.id ?? null,
      email: viewer.email ?? null,
      name: viewer.name ?? null,
      role: (viewer.role as AppRole) ?? "usuario",
      team: viewer.team ?? null,
    };
  }, [targetUser, viewer]);

  const [resolvedTarget, setResolvedTarget] = useState<TargetUser>(baseTarget);

  const { users: adminUsers } = useAdminUsers({
    isSuperAdmin: viewer.role === "admin",
    isLeader: viewer.role === "lider",
  });

  useEffect(() => {
    setResolvedTarget(baseTarget);
  }, [baseTarget]);

  useEffect(() => {
    if (!open) return;

    const needsEnrichment = !resolvedTarget.team || !resolvedTarget.id || !resolvedTarget.role || !resolvedTarget.name;
    if (!needsEnrichment) return;
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
  ]);

  const isSelf =
    (!!viewer.id && !!resolvedTarget.id && viewer.id === resolvedTarget.id) ||
    (!!viewer.email && !!resolvedTarget.email && viewer.email === resolvedTarget.email);

  const canEdit =
    isSelf ||
    viewer.role === "admin" ||
    (viewer.role === "lider" && !!viewer.team && !!resolvedTarget.team && viewer.team === resolvedTarget.team);

  const canAddManual =
    isSelf ||
    viewer.role === "admin" ||
    (viewer.role === "lider" && !!viewer.team && !!resolvedTarget.team && viewer.team === resolvedTarget.team);

  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(() => {
    const m = now.getMonth();
    if (m <= 2) return 1;
    if (m <= 5) return 2;
    if (m <= 8) return 3;
    return 4;
  });

  const [goalAmount, setGoalAmount] = useState<number>(0);
  const [loadingGoal, setLoadingGoal] = useState<boolean>(false);
  const [inputAmount, setInputAmount] = useState<number>(0);

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

  const submitManualWon = useCallback(
    async (payload: { companyName: string; monthlyFee: number; proposalUrl?: string | null; userId?: string }) => {
      const body: Record<string, unknown> = {
        companyName: payload.companyName,
        monthlyFee: payload.monthlyFee,
        proposalUrl: payload.proposalUrl ?? undefined,
        year,
        quarter,
      };
      const targetId = payload.userId ?? resolvedTarget.id;
      if (targetId) body.userId = targetId;
      const res = await fetch("/api/goals/wins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("failed");
      toast.success(toastT("manualWonSaved"));
      await loadProgress();
    },
    [year, quarter, resolvedTarget.id, loadProgress, toastT]
  );

  const [manualOpen, setManualOpen] = useState(false);

  const loadGoal = useCallback(async () => {
    setLoadingGoal(true);
    try {
      const qs: string[] = [`year=${year}`, `quarter=${quarter}`];
      if (!isSelf) {
        if (resolvedTarget.id) qs.push(`userId=${encodeURIComponent(resolvedTarget.id)}`);
        else if (resolvedTarget.email) qs.push(`email=${encodeURIComponent(resolvedTarget.email)}`);
      } else {
        if (resolvedTarget.id) qs.push(`userId=${encodeURIComponent(resolvedTarget.id)}`);
      }
      const r = await fetch(`/api/goals/user?${qs.join("&")}`);
      const j = (await r.json()) as { amount?: number };
      const amt = Number(j.amount ?? 0);
      setGoalAmount(amt);
      setInputAmount(amt);
    } catch {
      setGoalAmount(0);
      setInputAmount(0);
    } finally {
      setLoadingGoal(false);
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

  const save = async () => {
    if (!canEdit) return;
    try {
      const body: Record<string, unknown> = {
        amount: Number(inputAmount) || 0,
        year,
        quarter,
      };
      if (!isSelf && resolvedTarget.id) body.userId = resolvedTarget.id;
      const r = await fetch("/api/goals/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      toast.success(toastT("myGoalSaved"));
      await loadGoal();
      await loadProgress();
    } catch {
      toast.error(toastT("myGoalError"));
    }
  };

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

  const isLightAppearance = appearance === "light";
  const isMapacheAppearance = appearance === "mapache";
  const isDirectAppearance = appearance === "direct";

  const panelClassName = [
    "max-w-full",
    isLightAppearance
      ? "bg-white text-slate-900 border border-slate-200 shadow-[0_35px_110px_rgba(15,23,42,0.15)]"
      : isMapacheAppearance
        ? "bg-[rgb(var(--mapache-surface-strong))]/95 text-white border border-white/10 shadow-[0_45px_130px_rgba(2,6,23,0.8)]"
        : isDirectAppearance
          ? "bg-[#3b0a69] text-white border border-[#f3e8ff]/30 shadow-[0_45px_120px_rgba(27,2,54,0.55)]"
          : "bg-slate-950/90 text-white border border-white/10 shadow-[0_35px_110px_rgba(2,6,23,0.65)]",
  ].join(" ");

  const headerClassName = isLightAppearance
    ? "bg-white border-b border-slate-100 text-slate-900"
    : isMapacheAppearance
      ? "bg-slate-950/70 border-b border-white/10 text-white"
      : isDirectAppearance
        ? "bg-[#3b0a69] border-b border-white/15 text-white"
        : "bg-slate-950/70 border-b border-white/10 text-white";

  const titleClassName = isLightAppearance ? "text-lg font-semibold text-slate-900" : "text-lg font-semibold text-white";
  const bodyTextClass = isLightAppearance ? "text-slate-900" : "text-white";
  const subtleTextClass = isLightAppearance ? "text-slate-600" : isDirectAppearance ? "text-white/85" : "text-white/90";
  const labelTextClass = isLightAppearance ? "text-slate-500" : isDirectAppearance ? "text-white/70" : "text-white/80";
  
  const primaryButtonClass = isLightAppearance
    ? "rounded-full bg-[rgb(var(--primary))] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[rgb(var(--primary))]/90 shadow-lg shadow-[rgb(var(--primary))]/20"
    : isDirectAppearance
      ? "rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#3b0a69] hover:bg-white/90 shadow-lg shadow-white/20"
      : "rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white/90 shadow-lg shadow-white/20";

  const secondaryButtonClass = isLightAppearance
    ? "rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    : isDirectAppearance
      ? "rounded-full border border-white/25 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
      : "rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15";

  const statCardClass = isLightAppearance
    ? "rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm"
    : isDirectAppearance
      ? "rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-xl backdrop-blur-sm"
      : "rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-xl";

  const infoCardClass = isLightAppearance
    ? "rounded-xl border border-slate-200 bg-white p-4"
    : isDirectAppearance
      ? "rounded-xl border border-white/15 bg-white/5 p-4"
      : "rounded-xl border border-white/20 bg-white/10 p-4";

  const selectClassName = isLightAppearance
    ? "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/30 focus:border-[rgb(var(--primary))]"
    : isDirectAppearance
      ? "mt-1.5 w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus:ring-2 focus:ring-white/30"
      : "select-on-dark mt-1.5 w-full";

  const inputClassName = isLightAppearance
    ? "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/30 focus:border-[rgb(var(--primary))]"
    : isDirectAppearance
      ? "mt-1.5 w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus:ring-2 focus:ring-white/35"
      : "input mt-1.5 w-full";

  const backdropClassName = isLightAppearance
    ? "bg-black/30"
    : isMapacheAppearance
      ? "bg-slate-950/75"
      : isDirectAppearance
        ? "bg-[rgba(59,10,105,0.65)]"
        : "bg-black/60";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={profileT("title")}
      variant={isLightAppearance ? "default" : "inverted"}
      headerClassName={headerClassName}
      titleClassName={titleClassName}
      panelClassName={panelClassName}
      panelStyle={{ maxWidth: "min(100vw - 32px, 680px)" }}
      backdropClassName={backdropClassName}
      footer={
        <div className="flex justify-end items-center w-full gap-3">
          <button className={secondaryButtonClass} onClick={onClose}>
            {profileT("buttons.close")}
          </button>
          {canEdit && (
            <button className={primaryButtonClass} onClick={save}>
              {profileT("buttons.save")}
            </button>
          )}
        </div>
      }
    >
      <div className={`space-y-6 ${bodyTextClass}`}>
        {/* Profile Header - Más grande y elegante */}
        <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-current/10">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center font-bold text-2xl shadow-xl ${
            isLightAppearance 
              ? "bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--primary))]/70 text-white"
              : "bg-gradient-to-br from-white to-white/80 text-[rgb(var(--primary))]"
          }`}>
            {initials(name)}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{name}</h2>
            <div className={`flex items-center justify-center gap-2 ${subtleTextClass}`}>
              <Mail className="h-4 w-4" />
              <span className="text-sm">{email}</span>
            </div>
          </div>
        </div>

        {/* Role & Team Info - Cards más elegantes */}
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
              isLightAppearance ? 'bg-slate-200' : 'bg-white/20'
            }`}>
              <div 
                className={`h-full transition-all duration-500 ${
                  isLightAppearance 
                    ? 'bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--primary))]/70'
                    : isDirectAppearance
                      ? 'bg-gradient-to-r from-[#f6d3ff] via-[#d8b4fe] to-[#b794f4]'
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

        {/* Period & Goal Controls - Always visible for context */}
        <div className={`space-y-4 p-5 rounded-2xl border ${
          isLightAppearance 
            ? 'border-slate-200 bg-slate-50/50' 
            : 'border-white/10 bg-white/5'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className={`h-4 w-4 ${labelTextClass}`} />
            <span className={`text-sm font-semibold ${labelTextClass} uppercase tracking-wide`}>
              Periodo y Objetivo
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="text-sm">
              <span className={labelTextClass}>{profileT("labels.year")}</span>
              <select
                className={selectClassName}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="text-sm">
              <span className={labelTextClass}>{profileT("labels.quarter")}</span>
              <select
                className={selectClassName}
                value={quarter}
                onChange={(e) => setQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)}
              >
                <option value={1}>Q1</option>
                <option value={2}>Q2</option>
                <option value={3}>Q3</option>
                <option value={4}>Q4</option>
              </select>
            </label>
            {canEdit && (
              <label className="text-sm">
                <span className={labelTextClass}>{profileT("labels.goal")} (USD)</span>
                <input
                  className={inputClassName}
                  type="number"
                  min={0}
                  value={inputAmount}
                  disabled={loadingGoal}
                  onChange={(e) => setInputAmount(Number(e.target.value))}
                />
              </label>
            )}
          </div>
          <div className={`text-xs ${labelTextClass} text-center pt-2`}>
            {profileT("periodSummary", { year, quarter, from: range.from, to: range.to })}
          </div>
        </div>

        {/* Action Button */}
        {canAddManual && (
          <button
            className={primaryButtonClass + " w-full"}
            onClick={() => setManualOpen(true)}
            type="button"
          >
            {billingT("manualCta")}
          </button>
        )}
      </div>
      
      {manualOpen && (
        <ManualWonDialog
          open={manualOpen}
          onClose={() => setManualOpen(false)}
          target={{
            userId: resolvedTarget.id ?? undefined,
            email: resolvedTarget.email ?? null,
            name: resolvedTarget.name ?? null,
          }}
          onSubmit={async (values) => {
            try {
              await submitManualWon(values);
              setManualOpen(false);
            } catch (err) {
              toast.error(toastT("manualWonError"));
              throw err;
            }
          }}
        />
      )}
    </Modal>
  );
}
