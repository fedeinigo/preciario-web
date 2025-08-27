import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Session } from "next-auth";

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

// Definimos los roles permitidos
export type UserRole = "admin" | "comercial";

// Extendemos el tipo de User en la sesión
export interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
}

// Extendemos la sesión para incluir `user.role`
export interface ExtendedSession extends Session {
  user: ExtendedUser;
}
