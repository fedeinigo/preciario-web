import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Primer paso: si llega "user" (sign in), intentamos resolver por id o email
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

      // Requests siguientes: refrescar por email si no tenemos id
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
};

export async function auth() {
  return getServerSession(authOptions);
}
