// src/types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

type AppRole = "superadmin" | "admin" | "lider" | "usuario";

declare module "next-auth" {
  interface User {
    id: string;
    role?: AppRole;
    team?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: AppRole;
      team: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
    team?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    accessTokenExpires?: number | null; // epoch ms
  }
}
