// src/app/direct-portal/goals/page.tsx
import GoalsPage from "@/app/components/features/goals/GoalsPage";
import { buildDirectPortalViewer } from "@/app/direct-portal/viewer";
import AuthLoginCard from "@/app/components/AuthLoginCard";
import { auth } from "@/lib/auth";

export default async function DirectPortalGoalsPage() {
  const session = await auth();
  const viewer = buildDirectPortalViewer(session);

  if (!viewer) {
    return <AuthLoginCard />;
  }

  const isSuperAdmin = viewer.role === "admin";

  return (
    <GoalsPage
      role={viewer.role}
      currentEmail={viewer.email}
      leaderTeam={viewer.team}
      isSuperAdmin={isSuperAdmin}
      viewerImage={viewer.image}
      viewerId={viewer.id}
      winsSource="pipedrive"
      pipedriveMode="owner"
      disableManualWins
    />
  );
}
