import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  // Misma unión que usa la app
  type AppRole = "superadmin" | "lider" | "comercial";

  interface User {
    id?: string;
    role?: AppRole;
    team?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
      team?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  type AppRole = "superadmin" | "lider" | "comercial";

  interface JWT {
    sub?: string;
    role?: AppRole;
    team?: string | null;
  }
}
