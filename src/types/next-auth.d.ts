// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare global {
  type AppRole = "superadmin" | "lider" | "usuario";
}

declare module "next-auth" {
  interface User {
    id: string;
    role: AppRole;
    team?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
      team?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    team?: string | null;
  }
}
