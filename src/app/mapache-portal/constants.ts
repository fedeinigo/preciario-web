import type {
  MapacheDeliverableType,
  MapacheDirectness,
  MapacheIntegrationOwner,
  MapacheIntegrationType,
  MapacheNeedFromTeam,
  MapacheSignalOrigin,
  MapacheTaskSubstatus,
} from "./types";
import {
  MAPACHE_DELIVERABLE_TYPES,
  MAPACHE_DIRECTNESS,
  MAPACHE_INTEGRATION_OWNERS,
  MAPACHE_INTEGRATION_TYPES,
  MAPACHE_NEEDS_FROM_TEAM,
  MAPACHE_SIGNAL_ORIGINS,
  MAPACHE_TASK_SUBSTATUSES,
} from "./types";
import type { NeedMetricKey } from "./MapachePortalInsights";

export const NEED_OPTIONS: MapacheNeedFromTeam[] = [...MAPACHE_NEEDS_FROM_TEAM];
export const DIRECTNESS_OPTIONS: MapacheDirectness[] = [...MAPACHE_DIRECTNESS];
export const INTEGRATION_TYPE_OPTIONS: MapacheIntegrationType[] = [
  ...MAPACHE_INTEGRATION_TYPES,
];
export const INTEGRATION_TYPES: (MapacheIntegrationType | "")[] = [
  "",
  ...MAPACHE_INTEGRATION_TYPES,
];
export const INTEGRATION_OWNERS: (MapacheIntegrationOwner | "")[] = [
  "",
  ...MAPACHE_INTEGRATION_OWNERS,
];
export const DELIVERABLE_TYPES: MapacheDeliverableType[] = [
  ...MAPACHE_DELIVERABLE_TYPES,
];
export const ORIGIN_OPTIONS: MapacheSignalOrigin[] = [...MAPACHE_SIGNAL_ORIGINS];
export const NEED_METRIC_KEYS: NeedMetricKey[] = [...NEED_OPTIONS, "NONE"];
export const SUBSTATUS_OPTIONS: MapacheTaskSubstatus[] = [
  ...MAPACHE_TASK_SUBSTATUSES,
];

export const MS_IN_DAY = 86_400_000;
export const TASKS_PAGE_SIZE = 100;
