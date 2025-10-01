// src/app/ClientSessionBoundary.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export default function ClientSessionBoundary({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return <SessionProvider session={session ?? undefined}>{children}</SessionProvider>;
}
