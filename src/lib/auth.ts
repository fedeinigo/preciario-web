// src/lib/auth.ts
import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/feature-flags";
// Mantén este alias si no lo traes de otro lado
type AppRole = "superadmin" | "lider" | "usuario";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },

  // GOOGLE con scopes necesarios:
  // - drive.file: crear/editar archivos que crea la app
  // - drive.readonly: leer/copy de plantillas existentes (por ID), incl. Shared Drives
  // - documents, spreadsheets: para Docs/Sheets APIs
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: !isFeatureEnabled("strictOauthLinking"), // evita OAuthAccountNotLinked si ya existe un User con ese email
      authorization: {
        params: {
          access_type: "offline",
          include_granted_scopes: "true",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/documents",
            "https://www.googleapis.com/auth/spreadsheets",
          ].join(" "),
          // NO ponemos prompt=consent -> solo pedirá permisos cuando agregamos scopes nuevos
        },
      },
    }),
  ],

  // Solo emails @wisecx.com pasan
  callbacks: {
    async signIn({ user }) {
      const email = user?.email ?? "";
      return email.endsWith("@wisecx.com");
    },

    async jwt({ token, user }) {
      // Resolver id de usuario a la primera
      let dbUserId: string | undefined;

      if (user && "id" in user && typeof user.id === "string") {
        dbUserId = user.id;
      } else if (token?.email) {
        const found = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true },
        });
        dbUserId = found?.id;
      }

      if (dbUserId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: dbUserId },
          select: { id: true, role: true, team: true, email: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email ?? token.email;
          token.role = (dbUser.role ?? "usuario") as AppRole;
          token.team = dbUser.team ?? null;
        }
        return token as JWT;
      }

      // Requests siguientes: refrescamos por email si hace falta
      if (token?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true, team: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = (dbUser.role ?? "usuario") as AppRole;
          token.team = dbUser.team ?? null;
        }
      }

      return token as JWT;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as AppRole) ?? "usuario";
        session.user.team = (token.team as string | null) ?? null;
      }
      return session;
    },
  },

  // Guarda/actualiza tokens de Google en Account (refresh_token la 1ª vez)
  events: {
    async signIn({ user, account }) {
      if (!account || account.provider !== "google" || !user?.id) return;

      const updates: {
        refresh_token?: string;
        access_token?: string;
        expires_at?: number;
        token_type?: string;
        scope?: string;
        id_token?: string;
        session_state?: string;
      } = {};

      if (typeof account.refresh_token === "string") updates.refresh_token = account.refresh_token;
      if (typeof account.access_token === "string") updates.access_token = account.access_token;
      if (typeof account.expires_at === "number") updates.expires_at = account.expires_at;
      if (typeof account.token_type === "string") updates.token_type = account.token_type;
      if (typeof account.scope === "string") updates.scope = account.scope;
      if (typeof account.id_token === "string") updates.id_token = account.id_token;
      if (typeof account.session_state === "string") updates.session_state = account.session_state;

      if (Object.keys(updates).length === 0) return;

      const key = {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: account.providerAccountId!,
        },
      } as const;

      try {
        await prisma.account.update({ where: key, data: updates });
      } catch {
        await prisma.account.create({
          data: {
            userId: user.id as string,
            type: "oauth",
            provider: "google",
            providerAccountId: account.providerAccountId!,
            ...updates,
          },
        });
      }
    },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}
