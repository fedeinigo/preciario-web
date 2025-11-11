// src/app/direct-portal/generator/page.tsx
import GeneratorPageClient from "@/app/direct-portal/generator/GeneratorPageClient";
import { buildDirectPortalViewer } from "@/app/direct-portal/viewer";
import AuthLoginCard from "@/app/components/AuthLoginCard";
import { auth } from "@/lib/auth";

export default async function DirectPortalGeneratorPage() {
  const session = await auth();
  const viewer = buildDirectPortalViewer(session);

  if (!viewer) {
    return <AuthLoginCard />;
  }

  const isAdmin = viewer.role === "admin";
  const canViewSku = isAdmin || viewer.role === "lider";

  return (
    <GeneratorPageClient
      isAdmin={isAdmin}
      canViewSku={canViewSku}
      userId={viewer.id}
      userEmail={viewer.email}
    />
  );
}
