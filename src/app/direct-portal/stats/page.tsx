// src/app/direct-portal/stats/page.tsx
import Stats from "@/app/components/features/proposals/Stats";
import { buildDirectPortalViewer } from "@/app/direct-portal/viewer";
import AuthLoginCard from "@/app/components/AuthLoginCard";
import { auth } from "@/lib/auth";

export default async function DirectPortalStatsPage() {
  const session = await auth();
  const viewer = buildDirectPortalViewer(session);

  if (!viewer) {
    return <AuthLoginCard />;
  }

  const isSuperAdmin = viewer.role === "admin";

  return (
    <Stats
      role={viewer.role}
      currentEmail={viewer.email}
      leaderTeam={viewer.team}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
