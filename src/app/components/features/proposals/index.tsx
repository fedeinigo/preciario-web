"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AuthLoginCard from "@/app/components/AuthLoginCard";
import Generator from "./Generator";
import History from "./History";
import Stats from "./Stats";
import Users from "./Users";
import { saveUser } from "./lib/storage";

type Tab = "generator" | "history" | "stats" | "users";

export default function ProposalApp() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const role = (session?.user?.role as "admin" | "comercial" | undefined) ?? "comercial";
  const isAdmin = role === "admin";
  const userId = (session?.user?.id as string) || "";
  const userEmail = session?.user?.email || "";

  // tab desde hash (para sincronizar con el navbar)
  const initialTab = ((): Tab => {
    const h = (globalThis?.location?.hash || "").replace("#", "");
    return (["generator", "history", "stats", "users"].includes(h) ? (h as Tab) : "generator");
  })();

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    if (userEmail && userId) saveUser({ email: userEmail, userId });
  }, [userEmail, userId]);

  // escuchar eventos del navbar
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
        <Generator isAdmin={isAdmin} userId={userId} userEmail={userEmail} onSaved={() => {}} />
      )}
      {activeTab === "history" && <History isAdmin={isAdmin} currentEmail={userEmail} />}
      {activeTab === "stats" && <Stats isAdmin={isAdmin} currentEmail={userEmail} />}
      {activeTab === "users" && isAdmin && <Users />}
    </div>
  );
}
