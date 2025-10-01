// src/app/api/_utils/require-auth.ts
import { NextResponse } from "next/server";

import { isFeatureEnabled } from "@/lib/feature-flags";
import { auth } from "@/lib/auth";

export type ApiSession = Awaited<ReturnType<typeof auth>>;

type RequireSessionResult = {
  session: ApiSession;
  response?: NextResponse;
};

type Dependencies = {
  authFn: typeof auth;
  isFeatureEnabledFn: typeof isFeatureEnabled;
};

export function createAuthGuards({
  authFn,
  isFeatureEnabledFn,
}: Dependencies) {
  async function requireApiSessionInternal(): Promise<RequireSessionResult> {
    const session = await authFn();

    if (!isFeatureEnabledFn("secureApiRoutes")) {
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

  function ensureSessionRoleInternal(
    session: ApiSession,
    allowedRoles: string[],
    status = 403
  ): NextResponse | null {
    if (!isFeatureEnabledFn("secureApiRoutes")) {
      return null;
    }

    const role = (session?.user?.role ?? "") as string;
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status });
    }

    return null;
  }

  return {
    requireApiSession: requireApiSessionInternal,
    ensureSessionRole: ensureSessionRoleInternal,
  } as const;
}

const defaultGuards = createAuthGuards({
  authFn: auth,
  isFeatureEnabledFn: isFeatureEnabled,
});

export const requireApiSession = defaultGuards.requireApiSession;
export const ensureSessionRole = defaultGuards.ensureSessionRole;
