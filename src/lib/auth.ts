// src/lib/auth.ts
import { getServerSession, type NextAuthOptions } from "next-auth";
import { authOptions as routeAuthOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Session } from "next-auth";

/** Re-export de la config para poder usarla en otros módulos (api/pricing, etc.) */
export const authOptions: NextAuthOptions = routeAuthOptions;

/** Helper para obtener la sesión del servidor */
export async function getAuthSession() {
  return getServerSession(authOptions);
}

/** ====== Tipos de roles y sesión extendida ====== */
export type UserRole = "admin" | "comercial";

export interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
}

export interface ExtendedSession extends Session {
  user: ExtendedUser;
}
