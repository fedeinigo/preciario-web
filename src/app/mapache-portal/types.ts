export const MAPACHE_TASK_STATUSES = ["PENDING", "IN_PROGRESS", "DONE"] as const;
export const MAPACHE_TASK_SUBSTATUSES = [
  "BACKLOG",
  "WAITING_CLIENT",
  "BLOCKED",
] as const;

export const MAPACHE_NEEDS_FROM_TEAM = [
  "QUOTE_SCOPE",
  "QUOTE",
  "SCOPE",
  "PRESENTATION",
  "OTHER",
] as const;

export const MAPACHE_DIRECTNESS = ["DIRECT", "PARTNER"] as const;

export const MAPACHE_INTEGRATION_TYPES = [
  "REST",
  "GRAPHQL",
  "SDK",
  "OTHER",
] as const;

export const MAPACHE_INTEGRATION_OWNERS = [
  "OWN",
  "THIRD_PARTY",
] as const;

export const MAPACHE_SIGNAL_ORIGINS = [
  "GOOGLE_FORM",
  "GENERATOR",
  "API",
  "MANUAL",
  "OTHER",
] as const;

export const MAPACHE_DELIVERABLE_TYPES = [
  "SCOPE",
  "QUOTE",
  "SCOPE_AND_QUOTE",
  "OTHER",
] as const;

export type MapacheTaskStatus = (typeof MAPACHE_TASK_STATUSES)[number];
export type MapacheTaskSubstatus = (typeof MAPACHE_TASK_SUBSTATUSES)[number];
export type MapacheNeedFromTeam = (typeof MAPACHE_NEEDS_FROM_TEAM)[number];
export type MapacheDirectness = (typeof MAPACHE_DIRECTNESS)[number];
export type MapacheIntegrationType = (typeof MAPACHE_INTEGRATION_TYPES)[number];
export type MapacheIntegrationOwner =
  (typeof MAPACHE_INTEGRATION_OWNERS)[number];
export type MapacheSignalOrigin = (typeof MAPACHE_SIGNAL_ORIGINS)[number];
export type MapacheDeliverableType =
  (typeof MAPACHE_DELIVERABLE_TYPES)[number];

export type MapacheTaskDeliverable = {
  id: string;
  type: MapacheDeliverableType;
  title: string;
  url: string;
  addedById?: string | null;
  createdAt?: string;
};

export type MapacheTask = {
  id: string;
  title: string;
  description?: string | null;
  status: MapacheTaskStatus;
  substatus?: MapacheTaskSubstatus;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  assigneeId?: string | null;
  requesterEmail?: string;
  clientName?: string;
  presentationDate?: string | null;
  interlocutorRole?: string | null;
  clientWebsiteUrls?: string[];
  directness?: MapacheDirectness;
  pipedriveDealUrl?: string | null;
  needFromTeam?: MapacheNeedFromTeam;
  clientPain?: string | null;
  productKey?: string;
  managementType?: string | null;
  docsCountApprox?: number | null;
  docsLengthApprox?: string | null;
  integrationType?: MapacheIntegrationType | null;
  integrationOwner?: MapacheIntegrationOwner | null;
  integrationName?: string | null;
  integrationDocsUrl?: string | null;
  avgMonthlyConversations?: number | null;
  origin?: MapacheSignalOrigin;
  deliverables?: MapacheTaskDeliverable[];
};
