// src/app/configuraciones/team-management/page.tsx
import { redirect } from "next/navigation";

import AuthLoginCard from "@/app/components/AuthLoginCard";
import { auth } from "@/lib/auth";
import { buildDirectPortalViewer } from "@/app/direct-portal/viewer";
import { TeamManagementPageClient } from "@/app/direct-portal/configuraciones/ConfigurationsPageClient";

export default async function TeamManagementPage() {
  const session = await auth();
  const viewer = buildDirectPortalViewer(session);

  if (!viewer) {
    return <AuthLoginCard />;
  }

  const isAdmin = viewer.role === "admin";

  if (!isAdmin) {
    redirect("/portal/directo/generator");
  }

  return <TeamManagementPageClient isAdmin={isAdmin} />;
}
