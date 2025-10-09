"use client";

import * as React from "react";

import type { MapacheUser } from "../user-types";
import type { AssignmentRatios } from "../assignment-types";

const ASSIGNMENT_STORAGE_KEY = "mapache_assignment_ratios";

export type UseAssignmentRatiosOptions = {
  mapacheUsers: MapacheUser[];
};

export type UseAssignmentRatiosResult = {
  assignmentRatios: AssignmentRatios;
  setAssignmentRatios: React.Dispatch<React.SetStateAction<AssignmentRatios>>;
};

export function useAssignmentRatios({
  mapacheUsers,
}: UseAssignmentRatiosOptions): UseAssignmentRatiosResult {
  const [assignmentRatios, setAssignmentRatios] = React.useState<AssignmentRatios>({});
  const [ratiosLoaded, setRatiosLoaded] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(ASSIGNMENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const entries = Object.entries(parsed).filter(
            (entry): entry is [string, number] => {
              const value = entry[1];
              return typeof value === "number" && Number.isFinite(value) && value > 0;
            },
          );
          if (entries.length > 0) {
            const total = entries.reduce((sum, [, value]) => sum + value, 0);
            if (total > 0) {
              setAssignmentRatios(
                Object.fromEntries(
                  entries.map(([id, value]) => [id, value / total] as const),
                ),
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRatiosLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    if (!ratiosLoaded) return;
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        ASSIGNMENT_STORAGE_KEY,
        JSON.stringify(assignmentRatios),
      );
    } catch (error) {
      console.error(error);
    }
  }, [assignmentRatios, ratiosLoaded]);

  React.useEffect(() => {
    setAssignmentRatios((prev) => {
      if (mapacheUsers.length === 0) return prev;
      const allowed = new Set(mapacheUsers.map((user) => user.id));
      const entries = Object.entries(prev).filter(([id, value]) => {
        return (
          allowed.has(id) && typeof value === "number" && Number.isFinite(value)
        );
      });
      if (entries.length === Object.keys(prev).length) {
        return prev;
      }
      if (entries.length === 0) {
        return {};
      }
      const total = entries.reduce((sum, [, value]) => sum + value, 0);
      if (total <= 0) {
        return {};
      }
      return Object.fromEntries(
        entries.map(([id, value]) => [id, value / total] as const),
      );
    });
  }, [mapacheUsers]);

  return { assignmentRatios, setAssignmentRatios };
}
