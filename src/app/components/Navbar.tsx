"use client";

import * as React from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { LayoutGrid, Clock, BarChart2, Users } from "lucide-react";

type Tab = "generator" | "history" | "stats" | "users";

// 👇 roles que podrías manejar en UI
type AnyRole = "superadmin" | "admin" | "lider" | "comercial" | string | undefined;

// Amigable para mostrar en el badge
function labelForRole(r?: AnyRole) {
  if (!r) return "USUARIO";
  const map: Record<string, string> = {
    superadmin: "SUPERADMIN",
    admin: "ADMIN",
    lider: "LÍDER",
    comercial: "USUARIO",
  };
  const key = String(r).toLowerCase();
  return map[key] ?? String(r).toUpperCase();
}

// Estilo del badge por rol
function RoleBadge({ role }: { role?: AnyRole }) {
  const key = String(role ?? "").toLowerCase();

  let classes =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-semibold border";
  if (key === "superadmin") {
    classes += " border-amber-300 bg-amber-50 text-amber-700";
  } else if (key === "admin") {
    classes += " border-indigo-300 bg-indigo-50 text-indigo-700";
  } else if (key === "lider") {
    classes += " border-emerald-300 bg-emerald-50 text-emerald-700";
  } else {
    classes += " border-slate-300 bg-white text-slate-700";
  }

  return <span className={classes}>{labelForRole(role)}</span>;
}

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

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  // ✅ sin `any`: casteamos solo el campo role a nuestro union local
  const role = session?.user?.role as AnyRole;

  // tratamos superadmin como admin para visibilidad del tab "Usuarios"
  const canSeeUsers = role === "admin" || role === "superadmin";

  const readHash = (): Tab => {
    const h = (globalThis?.location?.hash || "").replace("#", "");
    return (["generator", "history", "stats", "users"].includes(h)
      ? (h as Tab)
      : "generator");
  };

  const [activeTab, setActiveTab] = React.useState<Tab>(readHash());

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

  return (
    <nav
      role="navigation"
      aria-label="Principal"
      className="navbar fixed top-0 inset-x-0 z-50 border-b border-white/15 backdrop-blur supports-[backdrop-filter]:bg-opacity-80"
      style={{ height: "var(--nav-h)" }}
    >
      <div className="navbar-inner mx-auto max-w-7xl px-3">
        {/* IZQUIERDA: logo */}
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

        {/* CENTRO: tabs sólo con sesión */}
        {isAuthed ? (
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

        {/* DERECHA: rol + cerrar sesión */}
        <div className="flex items-center gap-2">
          {isAuthed && <RoleBadge role={role} />}
          {isAuthed && (
            <button
              onClick={() => signOut()}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-[13.5px] font-medium bg-white text-[#3b0a69] hover:bg-white/90"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
