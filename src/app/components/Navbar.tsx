// src/app/components/Navbar.tsx
import type { Session } from "next-auth";

import NavbarLegacy from "@/app/components/NavbarLegacy";
import NavbarClient from "@/app/components/navbar/NavbarClient";
import { isFeatureEnabled } from "@/lib/feature-flags";

export type NavbarSession = Session | null | undefined;

export default function Navbar({ session }: { session?: NavbarSession }) {
  if (!isFeatureEnabled("proposalsClientRefactor")) {
    return <NavbarLegacy />;
  }

  return <NavbarClient session={session ?? null} />;
}
