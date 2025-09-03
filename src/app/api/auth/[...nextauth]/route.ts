import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Asegura que se ejecute en runtime Node (no Edge) y sin caché
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
