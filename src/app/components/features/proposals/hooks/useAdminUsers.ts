"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppRole } from "@/constants/teams";
import type { PortalAccessId } from "@/constants/portals";

export type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: AppRole;
  team: string | null;
  positionName: string | null;
  leaderEmail: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  portals: PortalAccessId[];
};

export type UseAdminUsersOptions = {
  isSuperAdmin?: boolean;
  isLeader?: boolean;
  enabled?: boolean; // Explicit flag to control fetching
};

let cache: AdminUser[] | null = null;
let lastError: Error | null = null;
let inflight: Promise<AdminUser[]> | null = null;

async function requestAdminUsers(): Promise<AdminUser[]> {
  const response = await fetch("/api/admin/users", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load admin users (${response.status})`);
  }
  const data = (await response.json()) as AdminUser[];
  return data;
}

function startRequest(): Promise<AdminUser[]> {
  const promise = requestAdminUsers()
    .then((data) => {
      cache = data;
      lastError = null;
      return data;
    })
    .catch((err) => {
      const error =
        err instanceof Error ? err : new Error("Failed to load admin users");
      cache = null;
      lastError = error;
      throw error;
    })
    .finally(() => {
      if (inflight === promise) {
        inflight = null;
      }
    });
  inflight = promise;
  return promise;
}

async function ensureAdminUsers(force = false): Promise<AdminUser[]> {
  if (force) {
    return startRequest();
  }
  if (cache) {
    return cache;
  }
  if (inflight) {
    return inflight;
  }
  return startRequest();
}

export function useAdminUsers(options: UseAdminUsersOptions = {}) {
  const { isSuperAdmin = false, isLeader = false, enabled: enabledOverride } = options;
  // Allow explicit enabled flag to override role-based enablement
  const enabled = enabledOverride !== undefined ? enabledOverride : (isSuperAdmin || isLeader);

  const [users, setUsers] = useState<AdminUser[]>(() => (cache ? [...cache] : []));
  const [loading, setLoading] = useState<boolean>(enabled && !cache && !lastError);
  const [error, setError] = useState<Error | null>(() =>
    enabled ? lastError : null
  );

  useEffect(() => {
    if (!enabled) {
      setUsers([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (cache) {
      setUsers(cache);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    ensureAdminUsers()
      .then((data) => {
        if (!active) return;
        setUsers(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        const error =
          err instanceof Error ? err : new Error("Failed to load admin users");
        setUsers([]);
        setError(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  const reload = useCallback(async () => {
    if (!enabled) {
      return [] as AdminUser[];
    }
    setLoading(true);
    try {
      const data = await ensureAdminUsers(true);
      setUsers(data);
      setError(null);
      return data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to load admin users");
      setUsers([]);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  return { users, loading, error, reload };
}

export const __testUtils = {
  reset() {
    cache = null;
    inflight = null;
    lastError = null;
  },
  ensure: ensureAdminUsers,
};
