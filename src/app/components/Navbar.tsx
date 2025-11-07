// src/app/components/Navbar.tsx
import type { Session } from "next-auth";

import NavbarClient from "@/app/components/navbar/NavbarClient";

export type NavbarSession = Session | null | undefined;

export default function Navbar({ session }: { session?: NavbarSession }) {
  return <NavbarClient session={session ?? null} />;
}
