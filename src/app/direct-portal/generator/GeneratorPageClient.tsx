// src/app/direct-portal/generator/GeneratorPageClient.tsx
"use client";

import * as React from "react";

import Generator from "@/app/components/features/proposals/Generator";

type GeneratorPageClientProps = {
  isAdmin: boolean;
  canViewSku: boolean;
  userId: string;
  userEmail: string;
};

export default function GeneratorPageClient({
  isAdmin,
  canViewSku,
  userId,
  userEmail,
}: GeneratorPageClientProps) {
  const handleSaved = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent("proposals:refresh"));
  }, []);

  return (
    <Generator
      isAdmin={isAdmin}
      canViewSku={canViewSku}
      userId={userId}
      userEmail={userEmail}
      onSaved={handleSaved}
    />
  );
}
