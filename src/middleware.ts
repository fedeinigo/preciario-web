import { NextRequest, NextResponse } from "next/server";

const redirectTarget = "https://portalgrowth.wcxpro.com/";

export function middleware(_request: NextRequest) {
  return NextResponse.redirect(redirectTarget);
}

export const config = {
  matcher: "/:path*",
};
