// src/app/configuraciones/page.tsx
import ConfigurationsPageClient from "@/app/direct-portal/configuraciones/ConfigurationsPageClient";
import AuthLoginCard from "@/app/components/AuthLoginCard";
import { auth } from "@/lib/auth";
import { buildDirectPortalViewer } from "@/app/direct-portal/viewer";
import { redirect } from "next/navigation";

export default async function ConfigurationsLandingPage() {
  const session = await auth();
  const viewer = buildDirectPortalViewer(session);

  if (!viewer) {
    return <AuthLoginCard />;
  }

  const isAdmin = viewer.role === "admin";

  if (!isAdmin) {
    redirect("/portal/directo/generator");
  }

  return <ConfigurationsPageClient isAdmin={isAdmin} />;
}
