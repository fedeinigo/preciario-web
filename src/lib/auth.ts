import { getServerSession, type NextAuthOptions } from "next-auth";
import { authOptions as routeAuthOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Session } from "next-auth";

export const authOptions: NextAuthOptions = routeAuthOptions;

export async function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export type AppRole = "superadmin" | "lider" | "comercial";

export interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: AppRole;
  team?: string | null;
}

export interface ExtendedSession extends Session {
  user: ExtendedUser;
}
