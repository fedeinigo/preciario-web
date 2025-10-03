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
