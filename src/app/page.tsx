// src/app/page.tsx
import AuthLoginCard from "@/app/components/AuthLoginCard";
import ProposalApp from "@/app/components/features/proposals";
import ClientSessionBoundary from "@/app/ClientSessionBoundary";
import LegacyHomePage from "@/app/page.legacy";
import { auth } from "@/lib/auth";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function HomePage() {
  if (!isFeatureEnabled("appShellRsc")) {
    return <LegacyHomePage />;
  }

  const session = await auth();
  if (!session) {
    return <AuthLoginCard />;
  }

  return (
    <ClientSessionBoundary session={session}>
      <ProposalApp session={session} />
    </ClientSessionBoundary>
  );
}
