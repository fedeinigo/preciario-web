import type {
  MapacheDirectness,
  MapacheIntegrationType,
  MapacheNeedFromTeam,
  MapacheSignalOrigin,
  MapacheTaskStatus,
} from "./types";

export type StatusFilterValue = "all" | MapacheTaskStatus;
export type OwnershipFilterValue = "all" | "mine" | "unassigned";

export type TaskFilterState = {
  status: StatusFilterValue;
  ownership: OwnershipFilterValue;
};

export type PresentationDateFilter = {
  from: string | null;
  to: string | null;
};

export type AdvancedFiltersState = {
  needFromTeam: MapacheNeedFromTeam[];
  directness: MapacheDirectness[];
  integrationTypes: MapacheIntegrationType[];
  origins: MapacheSignalOrigin[];
  assignees: string[];
  presentationDate: PresentationDateFilter;
};

export const DATE_INPUT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function createDefaultTaskFilterState(): TaskFilterState {
  return { status: "all", ownership: "all" };
}

export function createDefaultFiltersState(): AdvancedFiltersState {
  return {
    needFromTeam: [],
    directness: [],
    integrationTypes: [],
    origins: [],
    assignees: [],
    presentationDate: { from: null, to: null },
  };
}

export function areTaskFiltersEqual(
  a: TaskFilterState,
  b: TaskFilterState,
): boolean {
  return a.status === b.status && a.ownership === b.ownership;
}

function areStringArraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }
  return true;
}

export function areAdvancedFiltersEqual(
  a: AdvancedFiltersState,
  b: AdvancedFiltersState,
): boolean {
  if (!areStringArraysEqual(a.needFromTeam, b.needFromTeam)) return false;
  if (!areStringArraysEqual(a.directness, b.directness)) return false;
  if (!areStringArraysEqual(a.integrationTypes, b.integrationTypes)) return false;
  if (!areStringArraysEqual(a.origins, b.origins)) return false;
  if (!areStringArraysEqual(a.assignees, b.assignees)) return false;
  if (a.presentationDate.from !== b.presentationDate.from) return false;
  if (a.presentationDate.to !== b.presentationDate.to) return false;
  return true;
}
