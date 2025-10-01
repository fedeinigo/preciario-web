// src/app/components/features/proposals/index.tsx
import type { Session } from "next-auth";

import ProposalsTabsClient from "@/app/components/features/proposals/ProposalsTabsClient";
import LegacyClientApp from "@/app/components/features/proposals/LegacyClientApp";
import type { AppRole } from "@/constants/teams";
import { isFeatureEnabled } from "@/lib/feature-flags";

export interface ProposalViewer {
  id: string;
  email: string;
  role: AppRole | "usuario";
  team: string | null;
}

export default function ProposalApp({
  session,
}: {
  session?: Session | null;
}) {
  if (!isFeatureEnabled("proposalsClientRefactor") || !session) {
    return <LegacyClientApp />;
  }

  const viewer: ProposalViewer = {
    id: (session.user?.id as string | undefined) ?? "",
    email: session.user?.email ?? "",
    role: (session.user?.role as AppRole | undefined) ?? "usuario",
    team: (session.user?.team as string | null | undefined) ?? null,
  };

  return <ProposalsTabsClient viewer={viewer} />;
}
