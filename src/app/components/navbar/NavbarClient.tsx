// src/app/components/navbar/NavbarClient.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import {
  LayoutGrid,
  Clock,
  BarChart2,
  Users,
  Users2,
  Mail,
  Shield,
  Target,
} from "lucide-react";

import Modal from "@/app/components/ui/Modal";
import { toast } from "@/app/components/ui/toast";
import { formatUSD } from "@/app/components/features/proposals/lib/format";
import {
  q1Range,
  q2Range,
  q3Range,
  q4Range,
} from "@/app/components/features/proposals/lib/dateRanges";
export type NavbarClientProps = {
  session: Session | null;
};

type Tab = "generator" | "history" | "stats" | "users" | "teams" | "goals";

type AnyRole =
  | "superadmin"
  | "admin"
  | "lider"
  | "comercial"
  | "usuario"
  | string
  | undefined;

function TabBtn({
  id,
  label,
  active,
  onClick,
  Icon,
}: {
  id: Tab;
  label: string;
  active: boolean;
  onClick: (t: Tab) => void;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] border transition
        ${
          active
            ? "bg-white text-[#1f2937] border-transparent"
            : "bg-transparent text-white/90 border-white/20 hover:bg-white/10"
        }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function initials(fullName: string) {
  const parts = fullName.split(" ").filter(Boolean);
  const i1 = parts[0]?.[0] ?? "";
  const i2 = parts[1]?.[0] ?? "";
  return (i1 + i2).toUpperCase();
}

function readHash(): Tab {
  const h = (globalThis?.location?.hash || "").replace("#", "");
  return (["generator", "history", "stats", "users", "teams", "goals"].includes(h)
    ? (h as Tab)
    : "generator");
}

export default function NavbarClient({ session }: NavbarClientProps) {
  const status = session ? "authenticated" : "unauthenticated";
  const showTabs = status === "authenticated";
  const showAuthActions = status === "authenticated";

  const role = (session?.user?.role as AnyRole) ?? "usuario";
  const team = (session?.user?.team as string | null) ?? "—";
  const name = session?.user?.name ?? "Usuario";
  const email = session?.user?.email ?? "—";
  const currentEmail = session?.user?.email ?? "";
  const canSeeUsers = role === "admin" || role === "superadmin";

  const [activeTab, setActiveTab] = React.useState<Tab>(readHash());
  const [userModal, setUserModal] = React.useState(false);

  React.useEffect(() => {
    const onHash = () => setActiveTab(readHash());
    const onCustom = (e: Event) =>
      setActiveTab((e as CustomEvent).detail as Tab);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("app:setTab", onCustom as EventListener);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("app:setTab", onCustom as EventListener);
    };
  }, []);

  function setTab(t: Tab) {
    setActiveTab(t);
    try {
      location.hash = t;
    } catch {}
    window.dispatchEvent(new CustomEvent("app:setTab", { detail: t }));
  }

  const now = new Date();
  const initialQuarter: 1 | 2 | 3 | 4 = (() => {
    const m = now.getMonth();
    if (m <= 2) return 1;
    if (m <= 5) return 2;
    if (m <= 8) return 3;
    return 4;
  })();

  const [yearSel, setYearSel] = React.useState<number>(now.getFullYear());
  const [quarterSel, setQuarterSel] = React.useState<1 | 2 | 3 | 4>(initialQuarter);
  const range = React.useMemo(
    () => [q1Range, q2Range, q3Range, q4Range][quarterSel - 1](yearSel),
    [yearSel, quarterSel]
  );

  const [goal, setGoal] = React.useState<number>(0);
  const [progress, setProgress] = React.useState<number>(0);
  const [inputAmount, setInputAmount] = React.useState<number>(0);
  const [loadingGoal, setLoadingGoal] = React.useState<boolean>(false);

  const loadMyGoal = React.useCallback(async () => {
    setLoadingGoal(true);
    try {
      const r = await fetch(`/api/goals/user?year=${yearSel}&quarter=${quarterSel}`);
      const j = await r.json();
      const amt = Number(j.amount || 0);
      setGoal(amt);
      setInputAmount(amt);
    } catch {
      setGoal(0);
      setInputAmount(0);
    } finally {
      setLoadingGoal(false);
    }
  }, [yearSel, quarterSel]);

  const loadMyProgress = React.useCallback(async () => {
    try {
      const r = await fetch("/api/proposals", { cache: "no-store" });
      if (!r.ok) return setProgress(0);
      const all = (await r.json()) as Array<{
        userEmail: string | null;
        status?: "OPEN" | "LOST" | "WON" | null;
        totalAmount: number;
        createdAt: string;
      }>;
      const from = new Date(range.from).getTime();
      const to = new Date(range.to).getTime();
      const sum = all
        .filter(
          (p) =>
            p.userEmail === currentEmail &&
            p.status === "WON" &&
            new Date(p.createdAt).getTime() >= from &&
            new Date(p.createdAt).getTime() <= to
        )
        .reduce((acc, p) => acc + Number(p.totalAmount || 0), 0);
      setProgress(sum);
    } catch {
      setProgress(0);
    }
  }, [currentEmail, range]);

  React.useEffect(() => {
    if (!userModal || !currentEmail) return;
    loadMyGoal();
    loadMyProgress();
  }, [userModal, currentEmail, loadMyGoal, loadMyProgress]);

  const saveMyGoal = async () => {
    try {
      const r = await fetch("/api/goals/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: inputAmount, year: yearSel, quarter: quarterSel }),
      });
      if (!r.ok) throw new Error();
      setGoal(inputAmount);
      toast.success("Objetivo actualizado");
    } catch {
      toast.error("No se pudo guardar el objetivo");
    }
  };

  const pct = goal > 0 ? (progress / goal) * 100 : 0;

  return (
    <nav
      role="navigation"
      aria-label="Principal"
      className="navbar fixed top-0 inset-x-0 z-50 border-b border-white/15 backdrop-blur supports-[backdrop-filter]:bg-opacity-80"
      style={{ height: "var(--nav-h)" }}
    >
      <div className="navbar-inner mx-auto max-w-[2000px] px-3">
        <div className="flex items-center">
          <Image
            src="/logo.png"
            alt="Wise CX"
            width={140}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>

        {showTabs ? (
          <div className="hidden md:flex items-center gap-2">
            <TabBtn
              id="generator"
              label="Generador"
              Icon={LayoutGrid}
              active={activeTab === "generator"}
              onClick={setTab}
            />
            <TabBtn
              id="history"
              label="Histórico"
              Icon={Clock}
              active={activeTab === "history"}
              onClick={setTab}
            />
            <TabBtn
              id="stats"
              label="Estadísticas"
              Icon={BarChart2}
              active={activeTab === "stats"}
              onClick={setTab}
            />
            <TabBtn
              id="goals"
              label="Objetivos"
              Icon={Target}
              active={activeTab === "goals"}
              onClick={setTab}
            />
            <TabBtn
              id="teams"
              label="Equipos"
              Icon={Users2}
              active={activeTab === "teams"}
              onClick={setTab}
            />
            {canSeeUsers && (
              <TabBtn
                id="users"
                label="Usuarios"
                Icon={Users}
                active={activeTab === "users"}
                onClick={setTab}
              />
            )}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {showAuthActions && (
            <button
              onClick={() => setUserModal(true)}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] text-white border border-white/25 bg-white/10 hover:bg-white/15 transition"
              title="Ver perfil"
            >
              {name} — {team}
            </button>
          )}
          {showAuthActions && (
            <button
              onClick={() => signOut()}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-[13.5px] font-medium bg-white text-[#3b0a69] hover:bg-white/90"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </div>

      <Modal
        open={showAuthActions && userModal}
        onClose={() => setUserModal(false)}
        title="Mi perfil y objetivo"
        variant="inverted"
        panelClassName="max-w-2xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <div className="text-[12px] text-white/80">
              Periodo: {yearSel} - Q{quarterSel} ({range.from} — {range.to})
            </div>
            <div className="flex gap-2">
              <button className="btn-bar" onClick={() => setUserModal(false)}>
                Cerrar
              </button>
              <button className="btn-bar" onClick={saveMyGoal}>
                Guardar objetivo
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 text-white">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2">
              <div className="text-[12px] text-white/80 flex items-center gap-1 mb-0.5">
                <Shield className="h-3.5 w-3.5" />
                Rol
              </div>
              <div className="font-medium">{(role ?? "usuario").toString()}</div>
            </div>
            <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2">
              <div className="text-[12px] text-white/80 flex items-center gap-1 mb-0.5">
                <Users2 className="h-3.5 w-3.5" />
                Equipo
              </div>
              <div className="font-medium">{team}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-sm">
              Año
              <select
                className="select-on-dark mt-1 w-full"
                value={yearSel}
                onChange={(e) => setYearSel(Number(e.target.value))}
              >
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={y} value={y} className="text-black">
                      {y}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="text-sm">
              Trimestre
              <select
                className="select-on-dark mt-1 w-full"
                value={quarterSel}
                onChange={(e) => setQuarterSel(Number(e.target.value) as 1 | 2 | 3 | 4)}
              >
                <option value={1} className="text-black">
                  Q1
                </option>
                <option value={2} className="text-black">
                  Q2
                </option>
                <option value={3} className="text-black">
                  Q3
                </option>
                <option value={4} className="text-black">
                  Q4
                </option>
              </select>
            </label>
            <label className="text-sm">
              Objetivo (USD)
              <input
                className="input-pill mt-1 w-full"
                type="number"
                min={0}
                value={inputAmount}
                onChange={(e) => setInputAmount(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2">
              <div className="text-[12px] text-white/80 mb-1">Objetivo actual</div>
              <div className="text-lg font-semibold">{formatUSD(goal)}</div>
            </div>
            <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2">
              <div className="text-[12px] text-white/80 mb-1">Ventas WON en periodo</div>
              <div className="text-lg font-semibold">{formatUSD(progress)}</div>
              <div className="text-[12px] text-white/70">{pct.toFixed(1)}% del objetivo</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[12px] text-white/80">Log</div>
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[13px]">
              {loadingGoal ? "Cargando…" : "Última actualización mostrada en pantalla."}
            </div>
          </div>
        </div>
      </Modal>
    </nav>
  );
}
