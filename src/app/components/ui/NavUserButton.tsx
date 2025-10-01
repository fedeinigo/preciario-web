// src/app/components/ui/NavUserButton.tsx
"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import type { AppRole } from "@/constants/teams";
import UserProfileModal from "@/app/components/ui/UserProfileModal";
import { useTranslations } from "@/app/LanguageProvider";

export default function NavUserButton() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  const profileT = useTranslations("navbar.profile");
  const fallbacksT = useTranslations("navbar.fallbacks");

  const [open, setOpen] = React.useState(false);

  const viewer = React.useMemo(
    () => ({
      role: (session?.user?.role as AppRole | undefined) ?? "usuario",
      team: (session?.user?.team as string | null | undefined) ?? null,
      email: session?.user?.email ?? "",
    }),
    [session?.user?.role, session?.user?.team, session?.user?.email]
  );

  const myTarget = React.useMemo(
    () => ({
      id: (session?.user?.id as string | undefined) ?? undefined,
      email: session?.user?.email ?? null,
      name: session?.user?.name ?? null,
      role: (session?.user?.role as AppRole | undefined) ?? "usuario",
      team: (session?.user?.team as string | null | undefined) ?? null,
    }),
    [session?.user?.id, session?.user?.email, session?.user?.name, session?.user?.role, session?.user?.team]
  );

  if (!isAuthed) return null;

  const name = session?.user?.name ?? fallbacksT("name");
  const team = (session?.user?.team as string | null) ?? fallbacksT("team");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] text-white border border-white/25 bg-white/10 hover:bg-white/15 transition"
        title={profileT("open")}
      >
        {name} — {team}
      </button>
      <button
        onClick={() => signOut()}
        className="ml-2 inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-[13.5px] font-medium bg-white text-[#3b0a69] hover:bg-white/90"
      >
        {profileT("signOut")}
      </button>

      <UserProfileModal open={open} onClose={() => setOpen(false)} viewer={viewer} targetUser={myTarget} />
    </>
  );
}
