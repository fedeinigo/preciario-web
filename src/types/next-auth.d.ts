import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: "admin" | "comercial";
  }

  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: "admin" | "comercial";
    };
  }

  interface JWT {
    role?: "admin" | "comercial";
    sub?: string; // id del usuario
  }
}
