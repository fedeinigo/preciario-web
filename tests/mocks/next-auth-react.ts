import * as React from "react";

export type MockSessionUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  team?: string | null;
  [key: string]: unknown;
};

export type MockSession = {
  user?: MockSessionUser | null;
  expires?: string | null;
  [key: string]: unknown;
};

type SessionStatus = "authenticated" | "unauthenticated" | "loading";

type SessionState = {
  data: MockSession | null;
  status: SessionStatus;
};

let currentSession: SessionState = { data: null, status: "unauthenticated" };

export function __setSession(next: SessionState) {
  currentSession = next;
}

export function __resetSession() {
  currentSession = { data: null, status: "unauthenticated" };
}

const SessionContext = React.createContext<SessionState>(currentSession);

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: unknown;
}) {
  const value = React.useMemo<SessionState>(() => {
    if (session === undefined) {
      return currentSession;
    }
    const typedSession = (session ?? null) as MockSession | null;
    if (typedSession) {
      return { data: typedSession, status: "authenticated" };
    }
    if (session === null) {
      return { data: null, status: "unauthenticated" };
    }
    return { data: null, status: "unauthenticated" };
  }, [session]);

  React.useEffect(() => {
    currentSession = value;
  }, [value]);

  return React.createElement(SessionContext.Provider, { value }, children);
}

export function useSession(): SessionState {
  return React.useContext(SessionContext);
}

export async function signIn(_provider?: string, _options?: Record<string, unknown>): Promise<void> {
  currentSession = { data: currentSession.data, status: "loading" };
}

export async function signOut(_options?: Record<string, unknown>): Promise<void> {
  currentSession = { data: null, status: "unauthenticated" };
}
