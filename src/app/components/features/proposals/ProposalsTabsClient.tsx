// src/app/components/features/proposals/ProposalsTabsClient.tsx
"use client";

import React from "react";

import GoalsPage from "@/app/components/features/goals/GoalsPage";
import Generator from "@/app/components/features/proposals/Generator";
import History from "@/app/components/features/proposals/History";
import Stats from "@/app/components/features/proposals/Stats";
import Teams from "@/app/components/features/proposals/Teams";
import Users from "@/app/components/features/proposals/Users";
import type { ProposalViewer } from "@/app/components/features/proposals";

export type ProposalTab =
  | "generator"
  | "history"
  | "stats"
  | "goals"
  | "users"
  | "teams";

function readHash(): ProposalTab {
  const h = (globalThis?.location?.hash || "").replace("#", "");
  return (["generator", "history", "stats", "goals", "users", "teams"].includes(h)
    ? (h as ProposalTab)
    : "generator");
}

export default function ProposalsTabsClient({
  viewer,
}: {
  viewer: ProposalViewer;
}) {
  const [tab, setTab] = React.useState<ProposalTab>(readHash());

  React.useEffect(() => {
    const onHash = () => setTab(readHash());
    const onCustom = (e: Event) => setTab((e as CustomEvent).detail as ProposalTab);
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

  const isSuperAdmin = viewer.role === "admin";
  const canViewSku = isSuperAdmin || viewer.role === "lider";

  return (
    <div className="px-3 pt-6 w-full">
      {tab === "generator" && (
        <Generator
          isAdmin={isSuperAdmin}
          canViewSku={canViewSku}
          userId={viewer.id}
          userEmail={viewer.email}
          onSaved={handleSaved}
        />
      )}

      {tab === "history" && (
        <History
          role={viewer.role}
          currentEmail={viewer.email}
          leaderTeam={viewer.team}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {tab === "stats" && (
        <Stats
          role={viewer.role}
          currentEmail={viewer.email}
          leaderTeam={viewer.team}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {tab === "goals" && (
        <GoalsPage
          role={viewer.role}
          currentEmail={viewer.email}
          leaderTeam={viewer.team}
          isSuperAdmin={isSuperAdmin}
          viewerImage={viewer.image}
          viewerId={viewer.id}
        />
      )}

      {tab === "users" && isSuperAdmin && <Users />}

      {tab === "teams" && <Teams isSuperAdmin={isSuperAdmin} />}
    </div>
  );
}
