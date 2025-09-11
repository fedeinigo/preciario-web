// src/app/components/Navbar.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutGrid,
  Clock,
  BarChart2,
  Users,
  Users2,
  Mail,
  Shield,
} from "lucide-react";
import Modal from "@/app/components/ui/Modal";

type Tab = "generator" | "history" | "stats" | "users" | "teams";
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

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  const role = (session?.user?.role as AnyRole) ?? "usuario";
  const team = (session?.user?.team as string | null) ?? "—";
  const name = session?.user?.name ?? "Usuario";
  const email = session?.user?.email ?? "—";

  const canSeeUsers = role === "admin" || role === "superadmin";

  const readHash = (): Tab => {
    const h = (globalThis?.location?.hash || "").replace("#", "");
    return (["generator", "history", "stats", "users", "teams"].includes(h)
      ? (h as Tab)
      : "generator");
  };

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

        {/* CENTRO: tabs */}
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

        {/* DERECHA: chip con Nombre — Equipo + Cerrar sesión */}
        <div className="flex items-center gap-2">
          {isAuthed && (
            <button
              onClick={() => setUserModal(true)}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px]
                         text-white border border-white/25 bg-white/10 hover:bg-white/15 transition"
              title="Ver perfil"
            >
              {name} — {team}
            </button>
          )}
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

      {/* Modal de perfil — morado, centrado y fondo borroso */}
      <Modal
        open={isAuthed && userModal}
        onClose={() => setUserModal(false)}
        title="Tu perfil"
        variant="inverted"
        panelClassName="max-w-xl"
        // (el backdrop ya aplica blur y oscurecimiento desde el propio Modal)
        footer={
          <div className="flex justify-end">
            <button
              className="rounded-md bg-white text-[rgb(var(--primary))] px-3 py-2 text-sm font-medium hover:bg-white/90"
              onClick={() => setUserModal(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-white">
          {/* Encabezado: avatar + nombre + email */}
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center font-bold
                         bg-white text-[rgb(var(--primary))]"
            >
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

          {/* Tarjetas: rol y equipo */}
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
        </div>
      </Modal>
    </nav>
  );
}
