import "next-auth";

declare module "next-auth" {
  type AppRole = "superadmin" | "lider" | "comercial";

  interface User {
    id?: string;
    role?: AppRole;
    team?: string | null;
  }

  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: AppRole;
      team?: string | null;
    };
  }

  interface JWT {
    role?: AppRole;
    team?: string | null;
    sub?: string;
  }
}
