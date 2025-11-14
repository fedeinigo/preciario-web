// src/app/components/ui/UserProfileModal.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Modal from "@/app/components/ui/Modal";
import { Mail, Shield, Users2 } from "lucide-react";
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
  // Objetivo base: si vino targetUser lo tomo, sino el viewer
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

  // Estado con target resuelto (id / team / role) desde /api/admin/users si faltan
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
    viewer.role === "admin" ||
    (viewer.role === "lider" && !!viewer.team && !!resolvedTarget.team && viewer.team === resolvedTarget.team);

  const canAddManual =
    isSelf ||
    viewer.role === "admin" ||
    viewer.role === "admin" ||
    (viewer.role === "lider" && !!viewer.team && !!resolvedTarget.team && viewer.team === resolvedTarget.team);

  // AÃ±o/quarter
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(() => {
    const m = now.getMonth();
    if (m <= 2) return 1;
    if (m <= 5) return 2;
    if (m <= 8) return 3;
    return 4;
  });

  // Objetivo
  const [goalAmount, setGoalAmount] = useState<number>(0);
  const [loadingGoal, setLoadingGoal] = useState<boolean>(false);
  const [inputAmount, setInputAmount] = useState<number>(0);

  const range = useMemo(() => {
    return [q1Range, q2Range, q3Range, q4Range][quarter - 1](year);
  }, [year, quarter]);

  // Avance (WON del usuario en el trimestre)
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
        // tambiÃ©n puede ir con id/email, el backend lo permite sin problema
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

  // % de cumplimiento: **sin** clamp (puede superar 100%)
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
      // Si edito a otro, envÃ­o siempre userId resuelto
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
  const viewerRoleLabel = resolveRole(viewer.role as AppRole | string | null);

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
  const badgeClass = isLightAppearance
    ? "text-xs px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600"
    : "text-xs px-2 py-1 rounded bg-white/10 border border-white/20 text-white/80";
  const selectClassName = isLightAppearance
    ? "mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/30 focus:border-[rgb(var(--primary))]"
    : isDirectAppearance
      ? "mt-1 w-full rounded-2xl border border-white/25 bg-white/10 px-3 py-2 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus:ring-2 focus:ring-white/30"
      : "select-on-dark mt-1 w-full";
  const inputClassName = isLightAppearance
    ? "input mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/30 focus:border-[rgb(var(--primary))]"
    : isDirectAppearance
      ? "input mt-1 w-full rounded-2xl border border-white/25 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus:ring-2 focus:ring-white/35"
      : "input mt-1 w-full";
  const cardClass = isLightAppearance
    ? "rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
    : isDirectAppearance
      ? "rounded-md border border-white/20 bg-white/10 px-3 py-2"
      : "rounded-md border border-white/20 bg-white/10 px-3 py-2";
  const kpiCardClass = isLightAppearance
    ? "rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
    : isDirectAppearance
      ? "rounded-md border border-white/15 bg-white/5 px-3 py-3"
      : "rounded-md border border-white/20 bg-white/10 px-3 py-3";
  const manualButtonClass = isLightAppearance
    ? "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    : isDirectAppearance
      ? "rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
      : "rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15";
  const footerSummaryClass = isLightAppearance ? "text-[12px] text-slate-500" : "text-[12px] text-white/80";
  const footerPrimaryButtonClass = isLightAppearance
    ? "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    : isDirectAppearance
      ? "rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
      : "btn-bar mapache-modal-btn";
  const footerSecondaryButtonClass = isLightAppearance
    ? "rounded-full border border-transparent bg-[rgb(var(--primary))] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[rgb(var(--primary))]/90"
    : isDirectAppearance
      ? "rounded-full border border-transparent bg-white px-3 py-1.5 text-sm font-semibold text-[#3b0a69] hover:bg-white/90"
      : "btn-bar mapache-modal-btn";
  const progressTrackClass = isLightAppearance ? "h-3 w-full rounded bg-slate-200 overflow-hidden" : "h-3 w-full rounded bg-white/20 overflow-hidden";
  const progressValueClass = isLightAppearance
    ? "h-full bg-[rgb(var(--primary))]"
    : isDirectAppearance
      ? "h-full bg-gradient-to-r from-[#f6d3ff] via-[#d8b4fe] to-[#b794f4]"
      : "h-full bg-white";
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
      panelStyle={{ maxWidth: "min(100vw - 32px, 1200px)" }}
      backdropClassName={backdropClassName}
      footer={
        <div className="flex justify-between items-center w-full">
          <div className={footerSummaryClass}>
            {profileT("periodSummary", { year, quarter, from: range.from, to: range.to })}
          </div>
          <div className="flex gap-2">
            <button className={footerPrimaryButtonClass} onClick={onClose}>
              {profileT("buttons.close")}
            </button>
            {canEdit && (
              <button className={footerSecondaryButtonClass} onClick={save}>
                {profileT("buttons.save")}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className={`space-y-4 ${bodyTextClass}`}>
        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full flex items-center justify-center font-bold bg-white text-[rgb(var(--primary))]">
            {initials(name)}
          </div>
          <div>
            <div className="text-base font-semibold">{name}</div>
            <div className={`text-sm ${subtleTextClass} inline-flex items-center gap-1`}>
              <Mail className="h-4 w-4" />
              {email}
            </div>
          </div>
          {!isSelf && (viewer.role === "admin" || viewer.role === "lider") && (
            <span className={`ml-auto ${badgeClass}`}>
              {profileT("viewerBadge", { role: viewerRoleLabel })}
            </span>
          )}
        </div>

        {/* Rol / Equipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={cardClass}>
            <div className={`text-[12px] ${labelTextClass} flex items-center gap-1 mb-0.5`}>
              <Shield className="h-3.5 w-3.5" />
              {profileT("labels.role")}
            </div>
            <div className="font-medium">{role}</div>
          </div>
          <div className={cardClass}>
            <div className={`text-[12px] ${labelTextClass} flex items-center gap-1 mb-0.5`}>
              <Users2 className="h-3.5 w-3.5" />
              {profileT("labels.team")}
            </div>
            <div className="font-medium">{team}</div>
          </div>
        </div>

        {/* Selectores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-sm">
            {profileT("labels.year")}
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
            {profileT("labels.quarter")}
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
          <label className="text-sm">
            {profileT("labels.goal")}
            <div className="flex items-center gap-2 mt-1">
              <input
                className={inputClassName}
                type="number"
                min={0}
                value={inputAmount}
                disabled={!canEdit || loadingGoal}
                onChange={(e) => setInputAmount(Number(e.target.value))}
              />
            </div>
          </label>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className={kpiCardClass}>
            <div className={`text-xs ${labelTextClass}`}>{metricsT("goal")}</div>
            <div className="text-xl font-semibold">{formatUSD(goalAmount)}</div>
          </div>
          <div className={kpiCardClass}>
            <div className={`text-xs ${labelTextClass}`}>{metricsT("progress")}</div>
            <div className="text-xl font-semibold">{formatUSD(wonAmount)}</div>
          </div>
          <div className={kpiCardClass}>
            <div className={`text-xs ${labelTextClass}`}>{metricsT("remaining")}</div>
            <div className="text-xl font-semibold">
              {formatUSD(Math.max(0, goalAmount - wonAmount))}
            </div>
          </div>
          <div className={kpiCardClass}>
            <div className={`text-xs ${labelTextClass}`}>{metricsT("pct")}</div>
            <div className="text-xl font-semibold">{pct.toFixed(1)}%</div>
          </div>
        </div>

        {canAddManual && (
          <div className="flex justify-end">
            <button
              className={manualButtonClass}
              onClick={() => setManualOpen(true)}
              type="button"
            >
              {billingT("manualCta")}
            </button>
          </div>
        )}

        {/* Barra de progreso */}
        <div className={kpiCardClass}>
          <div className={progressTrackClass} title={`${pct.toFixed(1)}%`}>
            <div className={progressValueClass} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
          </div>
        </div>
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


