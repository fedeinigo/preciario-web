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
import { fetchAllProposals } from "@/app/components/features/proposals/lib/proposals-response";
import { useAdminUsers } from "@/app/components/features/proposals/hooks/useAdminUsers";

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
}: {
  open: boolean;
  onClose: () => void;
  viewer: Viewer;
  targetUser?: TargetUser;
}) {
  const profileT = useTranslations("common.profileModal");
  const rolesT = useTranslations("common.roles");
  const toastT = useTranslations("goals.toast");
  const metricsT = useTranslations("goals.individual.metrics");
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
    isSuperAdmin: viewer.role === "superadmin",
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
    viewer.role === "superadmin" ||
    (viewer.role === "lider" && !!viewer.team && !!resolvedTarget.team && viewer.team === resolvedTarget.team);

  // Año/quarter
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
    if (!resolvedTarget.email) {
      setWonAmount(0);
      return;
    }
    try {
      const { proposals } = await fetchAllProposals();
      const from = new Date(range.from).getTime();
      const to = new Date(range.to).getTime();
      const sum = proposals
        .filter((p) => {
          if (p.userEmail !== resolvedTarget.email) return false;
          if ((p.status ?? "").toUpperCase() !== "WON") return false;
          const ts = new Date(p.createdAt as string).getTime();
          return ts >= from && ts <= to;
        })
        .reduce((acc, p) => acc + Number(p.totalAmount ?? 0), 0);
      setWonAmount(sum);
    } catch {
      setWonAmount(0);
    }
  }, [resolvedTarget.email, range.from, range.to]);

  const loadGoal = useCallback(async () => {
    setLoadingGoal(true);
    try {
      const qs: string[] = [`year=${year}`, `quarter=${quarter}`];
      if (!isSelf) {
        if (resolvedTarget.id) qs.push(`userId=${encodeURIComponent(resolvedTarget.id)}`);
        else if (resolvedTarget.email) qs.push(`email=${encodeURIComponent(resolvedTarget.email)}`);
      } else {
        // también puede ir con id/email, el backend lo permite sin problema
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
      // Si edito a otro, envío siempre userId resuelto
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
      superadmin: rolesT("superadmin"),
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={profileT("title")}
      variant="inverted"
      panelClassName="max-w-2xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-[12px] text-white/80">{profileT("periodSummary", { year, quarter, from: range.from, to: range.to })}</div>
          <div className="flex gap-2">
            <button
              className="rounded-md bg-white text-[rgb(var(--primary))] px-3 py-2 text-sm font-medium hover:bg-white/90"
              onClick={onClose}
            >
              {profileT("buttons.close")}
            </button>
            {canEdit && (
              <button
                className="rounded-md bg-white/10 border border-white/30 text-white px-3 py-2 text-sm font-semibold hover:bg-white/15"
                onClick={save}
              >
                {profileT("buttons.save")}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-white">
        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full flex items-center justify-center font-bold bg-white text-[rgb(var(--primary))]">
            {initials(name)}
          </div>
          <div>
            <div className="text-base font-semibold">{name}</div>
            <div className="text-sm text-white/90 inline-flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {email}
            </div>
          </div>
          {!isSelf && (viewer.role === "superadmin" || viewer.role === "lider") && (
            <span className="ml-auto text-xs px-2 py-1 rounded bg-white/10 border border-white/20">
              {profileT("viewerBadge", { role: viewerRoleLabel })}
            </span>
          )}
        </div>

        {/* Rol / Equipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2">
            <div className="text-[12px] text-white/80 flex items-center gap-1 mb-0.5">
              <Shield className="h-3.5 w-3.5" />
              {profileT("labels.role")}
            </div>
            <div className="font-medium">{role}</div>
          </div>
          <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2">
            <div className="text-[12px] text-white/80 flex items-center gap-1 mb-0.5">
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
              className="select mt-1"
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
              className="select mt-1"
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
                className="input w-full"
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
          <div className="rounded-md border border-white/20 bg-white/10 px-3 py-3">
            <div className="text-xs text-white/80">{metricsT("goal")}</div>
            <div className="text-xl font-semibold">{formatUSD(goalAmount)}</div>
          </div>
          <div className="rounded-md border border-white/20 bg-white/10 px-3 py-3">
            <div className="text-xs text-white/80">{metricsT("progress")}</div>
            <div className="text-xl font-semibold">{formatUSD(wonAmount)}</div>
          </div>
          <div className="rounded-md border border-white/20 bg-white/10 px-3 py-3">
            <div className="text-xs text-white/80">{metricsT("remaining")}</div>
            <div className="text-xl font-semibold">
              {formatUSD(Math.max(0, goalAmount - wonAmount))}
            </div>
          </div>
          <div className="rounded-md border border-white/20 bg-white/10 px-3 py-3">
            <div className="text-xs text-white/80">{metricsT("pct")}</div>
            <div className="text-xl font-semibold">{pct.toFixed(1)}%</div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="rounded-md border border-white/20 bg-white/10 px-3 py-3">
          <div className="h-3 w-full rounded bg-white/20 overflow-hidden" title={`${pct.toFixed(1)}%`}>
            <div
              className="h-full bg-white"
              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
