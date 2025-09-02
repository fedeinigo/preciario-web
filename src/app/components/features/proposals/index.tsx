"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AuthLoginCard from "@/app/components/AuthLoginCard";
import Generator from "./Generator";
import History from "./History";
import Stats from "./Stats";
import Users from "./Users";

type Tab = "generator" | "history" | "stats" | "users";
type AppRole = "superadmin" | "lider" | "comercial";

export default function ProposalApp() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const role = ((session?.user?.role as AppRole) ?? "comercial");
  const team = (session?.user?.team as string | null) ?? null;
  const isSuperAdmin = role === "superadmin";
  const isLeader = role === "lider";
  const userId = (session?.user?.id as string) || "";
  const userEmail = session?.user?.email || "";

  const initialTab = ((): Tab => {
    const h = (globalThis?.location?.hash || "").replace("#", "");
    const ok: Tab[] = ["generator", "history", "stats", "users"];
    return ok.includes(h as Tab) ? (h as Tab) : "generator";
  })();

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const handler = (e: Event) => {
      const t = (e as CustomEvent).detail as Tab;
      setActiveTab(t);
    };
    window.addEventListener("app:setTab", handler as EventListener);
    return () => window.removeEventListener("app:setTab", handler as EventListener);
  }, []);

  if (loading) return <div className="p-8 text-center">Cargando…</div>;
  if (!session) return <AuthLoginCard />;

  return (
    <div className="w-full min-h-[calc(100vh-var(--nav-h)-var(--footer-h))] bg-gray-100 px-6 pb-8">
      {activeTab === "generator" && (
        <Generator isAdmin={isSuperAdmin} userId={userId} userEmail={userEmail} onSaved={() => {}} />
      )}

      {activeTab === "history" && (
        <History
          currentEmail={userEmail}
          role={role}
          leaderTeam={isLeader ? team : null}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {activeTab === "stats" && (
        <Stats
          currentEmail={userEmail}
          role={role}
          leaderTeam={isLeader ? team : null}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {activeTab === "users" && isSuperAdmin && <Users />}
    </div>
  );
}
