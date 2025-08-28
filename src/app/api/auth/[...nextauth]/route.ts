import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createHash } from "crypto";
import { UserRole } from "@/lib/auth";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ID estable por email (solo para comerciales)
function idFromEmail(email: string) {
  const h = createHash("sha256").update(email).digest("hex").slice(0, 8);
  return "USR-" + parseInt(h, 16).toString(36).toUpperCase();
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;
        if (password !== "1234") return null;

        // Admin estricto
        if (email === "admin@wisecx.com") {
          return { id: "USR-ADMIN-0001", name: "Admin", email, role: "admin" };
        }

        // Comercial: cualquier email
        return {
          id: idFromEmail(email),
          name: email.split("@")[0],
          email,
          role: "comercial",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as AuthUser).role;
        token.sub = (user as AuthUser).id; // id del usuario
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole | undefined;
        session.user.id = (token.sub as string) || session.user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
