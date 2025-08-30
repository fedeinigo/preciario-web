// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, {
  type NextAuthOptions,
  getServerSession,
  type Account,
  type Profile,
  type Session,
  type User,
} from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";

import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

type Role = "admin" | "comercial";

// DEMO credentials
const DEMO_PASSWORD = "1234";
const DEMO_USERS: Record<string, Role> = {
  "admin@wisecx.com": "admin",
  "comercial1@wisecx.com": "comercial",
  "comercial2@wisecx.com": "comercial",
  "comercial3@wisecx.com": "comercial",
};

// Crea si no existe; si existe, NO cambia el rol (para respetar cambios de admin)
async function ensureUser(email: string, defaultRole: Role) {
  const now = new Date();
  const up = await prisma.user.upsert({
    where: { email },
    create: { email, role: defaultRole, createdAt: now, updatedAt: now },
    update: { updatedAt: now }, // NO tocar role en updates
    select: { id: true, role: true },
  });
  return { id: up.id, role: up.role as Role };
}

// Para extender con "role" sin usar `any`
interface UserWithRole extends AdapterUser {
  role?: Role;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // ✅ Forzamos refresh_token y pedimos scopes (Drive+Docs+Sheets readonly)
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
          scope: [
            "openid",
            "email",
            "profile",
            // Drive completo para copiar en Mi unidad / unidades compartidas
            "https://www.googleapis.com/auth/drive",
            // BatchUpdate de Google Docs
            "https://www.googleapis.com/auth/documents",
            // Lectura de Google Sheets (condiciones/whatsapp)
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

    CredentialsProvider({
      id: "credentials",
      name: "Demo (admin / comerciales)",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = (creds?.email || "").trim().toLowerCase();
        const pass = creds?.password || "";
        const defaultRole = DEMO_USERS[email];
        if (!defaultRole || pass !== DEMO_PASSWORD) return null;

        const { id, role } = await ensureUser(email, defaultRole);
        return { id, name: email.split("@")[0], email, role };
      },
    }),
  ],

  callbacks: {
    async signIn({
      account,
      profile,
    }: {
      account: Account | null;
      profile?: Profile | undefined;
    }) {
      if (account?.provider === "google") {
        const email = (profile?.email || "").toLowerCase();
        const domain = email.split("@")[1];
        if (domain !== "wisecx.com") return false;

        // Solo rol por defecto en alta inicial (si ya existe, NO se modifica)
        const defaultRole: Role =
          email === "federico.i@wisecx.com" ? "admin" : "comercial";
        await ensureUser(email, defaultRole);
      }
      return true;
    },

    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: User | AdapterUser | null;
    }) {
      const u = user as UserWithRole | null | undefined;

      if (u?.id) token.sub = u.id as string;
      if (u?.role) {
        (token as JWT & { role?: Role }).role = u.role;
      }

      // Si falta role o id, completarlo desde la BD
      const t = token as JWT & { role?: Role };
      if ((!t.role || !token.sub) && token.email) {
        const db = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true },
        });
        if (db) {
          token.sub = db.id;
          t.role = (db.role as Role) ?? "comercial";
        }
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      const t = token as JWT & { role?: Role };
      if (session.user) {
        (session.user as { id?: string }).id = (token.sub as string) ?? "";
        (session.user as { role?: Role }).role = (t.role as Role) ?? "comercial";
      }
      return session;
    },
  },

  pages: { signIn: "/auth/signin" },
};

// Handler App Router
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Envoltura para poder usar `auth()` en otros endpoints
export const auth = () => getServerSession(authOptions);
