// src/app/page.tsx
"use client";

import { useSession } from "next-auth/react";
import AuthLoginCard from "@/app/components/AuthLoginCard";
import ProposalApp from "@/app/components/features/proposals";

export default function HomePage() {
  const { status } = useSession();

  if (status === "loading") return null;            // evita parpadeo
  if (status !== "authenticated") return <AuthLoginCard />; // sin sesión -> login

  return <ProposalApp />; // con sesión -> app completa
}
