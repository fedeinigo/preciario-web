// src/app/page.legacy.tsx
"use client";

import { useSession } from "next-auth/react";

import AuthLoginCard from "@/app/components/AuthLoginCard";
import ProposalApp from "@/app/components/features/proposals";
import LoadingScreen from "@/app/components/ui/LoadingScreen";
import { isClientFeatureEnabled } from "@/lib/client-feature-flags";

export default function LegacyHomePage() {
  const { status } = useSession();

  if (status === "loading") {
    if (isClientFeatureEnabled("accessibilitySkeletons")) {
      return <LoadingScreen />;
    }
    return null;
  }
  if (status !== "authenticated") return <AuthLoginCard />;

  return <ProposalApp />;
}
