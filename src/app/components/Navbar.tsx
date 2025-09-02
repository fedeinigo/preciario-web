"use client";

import * as React from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { LayoutGrid, Clock, BarChart2, Users } from "lucide-react";

type Tab = "generator" | "history" | "stats" | "users";

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
  const isAdmin =
    (session?.user as { role?: "admin" | "comercial" })?.role === "admin";

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
    setActiveTab(t); // feedback instantáneo
    try {
      location.hash = t;
    } catch {}
    window.dispatchEvent(new CustomEvent("app:setTab", { detail: t }));
  }

  return (
    <nav className="navbar" style={{ height: "var(--nav-h)" }}>
      <div className="navbar-inner">
        {/* IZQUIERDA: logo pegado con padding corto */}
        <div className="pl-3">
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
            {isAdmin && (
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

        {/* DERECHA: cerrar sesión pegado con padding corto */}
        <div className="pr-3">
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
