// src/app/direct-portal/history/page.tsx
import History from "@/app/components/features/proposals/History";
import { buildDirectPortalViewer } from "@/app/direct-portal/viewer";
import AuthLoginCard from "@/app/components/AuthLoginCard";
import { auth } from "@/lib/auth";

export default async function DirectPortalHistoryPage() {
  const session = await auth();
  const viewer = buildDirectPortalViewer(session);

  if (!viewer) {
    return <AuthLoginCard />;
  }

  const isSuperAdmin = viewer.role === "admin";

  return (
    <History
      role={viewer.role}
      currentEmail={viewer.email}
      leaderTeam={viewer.team}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
