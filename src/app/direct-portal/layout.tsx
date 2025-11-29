// src/app/direct-portal/layout.tsx
import React from "react";

import AuthLoginCard from "@/app/components/AuthLoginCard";
import PortalThemeProvider from "@/app/components/theme/PortalThemeProvider";
import { auth } from "@/lib/auth";

export default async function DirectPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    return (
      <div className="px-3 pt-6 w-full">
        <AuthLoginCard />
      </div>
    );
  }

  return (
    <PortalThemeProvider portal="directo">
      <div className="px-3 pt-6 w-full">{children}</div>
    </PortalThemeProvider>
  );
}
