import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const redirectTarget = "https://portalgrowth.wcxpro.com/";
const ALLOWED_EMAIL = "federico.i@wisecx.com";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const email = token?.email?.toString().trim().toLowerCase() ?? "";
  if (email === ALLOWED_EMAIL) {
    return NextResponse.next();
  }

  return NextResponse.redirect(redirectTarget);
}

export const config = {
  matcher: "/:path*",
};
