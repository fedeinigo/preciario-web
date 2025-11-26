import GoalsPage from "@/app/components/features/goals/GoalsPage";
import type { AppRole } from "@/constants/teams";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MapachePortalGoalsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/");
  }

  const role = (user.role ?? "user") as AppRole;
  const team = user.team ?? null;

  return (
    <GoalsPage
      role={role}
      currentEmail={user.email ?? ""}
      leaderTeam={team}
      isSuperAdmin={role === "admin"}
      viewerImage={user.image}
      viewerId={user.id}
      theme="mapache"
      winsSource="pipedrive"
      disableManualWins
    />
  );
}
