// Extensiones de NextAuth para incluir el rol

import "next-auth";

declare module "next-auth" {
  interface User {
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
}

// Extender también el token JWT
import "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "comercial";
  }
}
