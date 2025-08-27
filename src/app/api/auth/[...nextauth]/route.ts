import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserRole } from "@/lib/auth";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
        if (!credentials?.email || !credentials?.password) return null;

        if (
          credentials.email === "admin@test.com" &&
          credentials.password === "1234"
        ) {
          return {
            id: "1",
            name: "Admin",
            email: "admin@test.com",
            role: "admin",
          };
        }

        if (
          credentials.email === "comercial@test.com" &&
          credentials.password === "1234"
        ) {
          return {
            id: "2",
            name: "Comercial",
            email: "comercial@test.com",
            role: "comercial",
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as AuthUser).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.role) {
        (session.user as AuthUser).role = token.role as UserRole;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
