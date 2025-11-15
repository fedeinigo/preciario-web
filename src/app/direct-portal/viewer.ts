// src/app/direct-portal/viewer.ts
import type { Session } from "next-auth";

import type { AppRole } from "@/constants/teams";

export type DirectPortalViewer = {
  id: string;
  email: string;
  role: AppRole;
  team: string | null;
  image: string | null;
};

function normalizeRole(role: unknown): AppRole {
  if (role === "admin" || role === "lider" || role === "usuario") {
    return role;
  }
  if (role === "superadmin") {
    return "admin";
  }
  return "usuario";
}

export function buildDirectPortalViewer(
  session: Session | null,
): DirectPortalViewer | null {
  if (!session?.user) {
    return null;
  }

  return {
    id: (session.user.id as string | undefined) ?? "",
    email: session.user.email ?? "",
    role: normalizeRole(session.user.role),
    team: (session.user.team as string | null | undefined) ?? null,
    image: (session.user.image as string | null | undefined) ?? null,
  };
}
