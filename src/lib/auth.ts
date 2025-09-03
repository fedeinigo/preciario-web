// src/lib/auth.ts
import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { AppRole } from "@/constants/teams";
import { toDbRole, fromDbRole } from "@/lib/roles";

// Asegura que el usuario exista con rol/equipo por defecto
async function ensureUser(email: string, defaultRole: AppRole) {
  const now = new Date();
  const up = await prisma.user.upsert({
    where: { email },
    create: { email, role: toDbRole(defaultRole), createdAt: now, updatedAt: now },
    update: { updatedAt: now }, // no tocar role/team en updates automáticos
    select: { id: true, role: true, team: true },
  });
  return { id: up.id, role: fromDbRole(up.role), team: up.team as string | null };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          include_granted_scopes: "true",
          prompt: "select_account",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/documents",
            "https://www.googleapis.com/auth/spreadsheets.readonly",
          ].join(" "),
        },
      },
      allowDangerousEmailAccountLinking: true,
      profile(p: GoogleProfile) {
        return {
          id: p.sub,
          name: p.name ?? p.email?.split("@")[0],
          email: p.email,
          image: p.picture,
        };
      },
    }),
  ],
  pages: { signIn: "/auth/signin" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = String(profile?.email || "").toLowerCase();
        const domain = email.split("@")[1];
        if (domain !== "wisecx.com") return false;

        const defaultRole: AppRole =
          email === "federico.i@wisecx.com" ? "superadmin" : "comercial";
        await ensureUser(email, defaultRole);
      }
      return true;
    },

    async jwt({ token, user }) {
      const au = user as AdapterUser | undefined | null;
      if (au?.id && !token.sub) token.sub = String(au.id);

      const t = token as JWT & { role?: AppRole; team?: string | null };
      if ((!t.role || !("team" in t)) && token.email) {
        const db = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true, team: true },
        });
        if (db) {
          token.sub = db.id;
          t.role = fromDbRole(db.role);
          t.team = (db.team as string | null) ?? null;
        }
      }
      return token;
    },

    async session({ session, token }) {
      const t = token as JWT & { role?: AppRole; team?: string | null };
      if (session.user) {
        (session.user as { id?: string }).id = (token.sub as string) ?? "";
        (session.user as { role?: AppRole }).role = t.role ?? "comercial";
        (session.user as { team?: string | null }).team = t.team ?? null;
      }
      return session;
    },
  },
};

// Helper para rutas/acciones del lado servidor
export function auth() {
  return getServerSession(authOptions);
}

// Tipos extendidos opcionales
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
