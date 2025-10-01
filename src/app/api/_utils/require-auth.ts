// src/app/api/_utils/require-auth.ts
import { NextResponse } from "next/server";

import { isFeatureEnabled } from "@/lib/feature-flags";
import { auth } from "@/lib/auth";

type ApiSession = Awaited<ReturnType<typeof auth>>;

type RequireSessionResult = {
  session: ApiSession;
  response?: NextResponse;
};

export async function requireApiSession(): Promise<RequireSessionResult> {
  const session = await auth();

  if (!isFeatureEnabled("secureApiRoutes")) {
    return { session };
  }

  if (!session || !session.user?.id) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session };
}

export function ensureSessionRole(
  session: ApiSession,
  allowedRoles: string[],
  status = 403
): NextResponse | null {
  if (!isFeatureEnabled("secureApiRoutes")) {
    return null;
  }

  const role = (session?.user?.role ?? "") as string;
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  return null;
}
