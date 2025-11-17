// src/app/components/features/proposals/LegacyClientApp.tsx
"use client";

import React from "react";
import { useSession } from "next-auth/react";
import type { AppRole } from "@/constants/teams";

import GoalsPage from "@/app/components/features/goals/GoalsPage";
import LoadingScreen from "@/app/components/ui/LoadingScreen";
import { isClientFeatureEnabled } from "@/lib/client-feature-flags";

import Generator from "./Generator";
import History from "./History";
import Stats from "./Stats";
import Users from "./Users";
import Teams from "./Teams";

type Tab = "generator" | "history" | "stats" | "goals" | "users" | "teams";

function readHash(): Tab {
  const h = (globalThis?.location?.hash || "").replace("#", "");
  return (["generator", "history", "stats", "goals", "users", "teams"].includes(h)
    ? (h as Tab)
    : "generator");
}

export default function ProposalsIndex() {
  // Este componente SOLO usa este hook
  const { data: session, status } = useSession();

  // Gateo temprano SIN otros hooks para cumplir reglas de hooks
  if (status === "loading") {
    if (isClientFeatureEnabled("accessibilitySkeletons")) {
      return <LoadingScreen />;
    }
    return null;
  }
  if (status !== "authenticated") return null;

  const role = (session?.user?.role as AppRole | undefined) ?? "usuario";
  const currentEmail = session?.user?.email ?? "";
  const leaderTeam = (session?.user?.team as string | null) ?? null;
  const isSuperAdmin = role === "admin";
  const userId = (session?.user?.id as string | undefined) ?? "";
  const userEmail = currentEmail;
  const viewerImage = (session?.user?.image as string | null | undefined) ?? null;

  // Paso el resto a un hijo autenticado para no llamar hooks condicionalmente
  return (
    <AuthedTabs
      role={role}
      currentEmail={currentEmail}
      leaderTeam={leaderTeam}
      isSuperAdmin={isSuperAdmin}
      userId={userId}
      userEmail={userEmail}
      viewerImage={viewerImage}
    />
  );
}

/** Subcomponente: aquí sí se usan otros hooks, pero NUNCA condicionalmente */
function AuthedTabs(props: {
  role: AppRole | "usuario";
  currentEmail: string;
  leaderTeam: string | null;
  isSuperAdmin: boolean;
  userId: string;
  userEmail: string;
  viewerImage: string | null;
}) {
  const { role, currentEmail, leaderTeam, isSuperAdmin, userId, userEmail, viewerImage } = props;

  const [tab, setTab] = React.useState<Tab>(readHash());

  React.useEffect(() => {
    const onHash = () => setTab(readHash());
    const onCustom = (e: Event) => setTab((e as CustomEvent).detail as Tab);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("app:setTab", onCustom as EventListener);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("app:setTab", onCustom as EventListener);
    };
  }, []);

  const handleSaved = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent("proposals:refresh"));
  }, []);

  const canViewSku = isSuperAdmin || role === "lider";

  return (
    <div className="px-3 pt-6 w-full">
      {tab === "generator" && (
        <Generator
          isAdmin={isSuperAdmin}
          canViewSku={canViewSku}
          userId={userId}
          userEmail={userEmail}
          onSaved={handleSaved}
        />
      )}

      {tab === "history" && (
        <History
          role={role}
          currentEmail={currentEmail}
          leaderTeam={leaderTeam}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {tab === "stats" && (
        <Stats
          role={role}
          currentEmail={currentEmail}
          leaderTeam={leaderTeam}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {tab === "goals" && (
        <GoalsPage
          role={role}
          currentEmail={currentEmail}
          leaderTeam={leaderTeam}
          isSuperAdmin={isSuperAdmin}
          viewerImage={viewerImage}
          viewerId={userId}
        />
      )}

      {tab === "users" && isSuperAdmin && <Users />}

      {tab === "teams" && <Teams isSuperAdmin={isSuperAdmin} />}
    </div>
  );
}
