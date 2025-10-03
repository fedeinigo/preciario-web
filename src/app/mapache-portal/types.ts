export const MAPACHE_TASK_STATUSES = ["PENDING", "IN_PROGRESS", "DONE"] as const;
export const MAPACHE_TASK_SUBSTATUSES = [
  "BACKLOG",
  "WAITING_CLIENT",
  "BLOCKED",
] as const;
export const MAPACHE_DIRECTNESS = ["DIRECT", "PARTNER"] as const;
export const MAPACHE_NEED_FROM_TEAM = [
  "QUOTE_SCOPE",
  "QUOTE",
  "SCOPE",
  "PRESENTATION",
  "OTHER",
] as const;
export const MAPACHE_TASK_ORIGINS = [
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
export const MAPACHE_INTEGRATION_OWNERS = ["OWN", "THIRD_PARTY"] as const;

export const MAPACHE_TASK_SUBSTATUSES = [
  "BACKLOG",
  "WAITING_CLIENT",
  "BLOCKED",
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
export type MapacheTaskDirectness = (typeof MAPACHE_DIRECTNESS)[number];
export type MapacheTaskNeedFromTeam = (typeof MAPACHE_NEED_FROM_TEAM)[number];
export type MapacheTaskOrigin = (typeof MAPACHE_TASK_ORIGINS)[number];
export type MapacheDeliverableType = (typeof MAPACHE_DELIVERABLE_TYPES)[number];
export type MapacheIntegrationType = (typeof MAPACHE_INTEGRATION_TYPES)[number];
export type MapacheIntegrationOwner =
  (typeof MAPACHE_INTEGRATION_OWNERS)[number];

export type MapacheTaskUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export type MapacheTaskDeliverable = {
  id: string;
  type: MapacheDeliverableType;
  title: string;
  url: string;
  addedById?: string | null;
  addedBy?: MapacheTaskUser | null;
  createdAt?: string;
};

export type MapacheTaskSubstatus = (typeof MAPACHE_TASK_SUBSTATUSES)[number];

export type MapacheDeliverableType = (typeof MAPACHE_DELIVERABLE_TYPES)[number];

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
  substatus: MapacheTaskSubstatus;
  assigneeId?: string | null;
  deliverables: MapacheTaskDeliverable[];
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  assigneeId?: string | null;
  assignee?: MapacheTaskUser | null;
  requesterEmail?: string;
  clientName?: string;
  presentationDate?: string | null;
  interlocutorRole?: string | null;
  clientWebsiteUrls: string[];
  directness?: MapacheTaskDirectness;
  pipedriveDealUrl?: string | null;
  needFromTeam?: MapacheTaskNeedFromTeam;
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
  origin: MapacheTaskOrigin;
  deliverables: MapacheTaskDeliverable[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeUser(value: unknown): MapacheTaskUser | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  if (typeof id !== "string" && typeof id !== "number") return null;
  return {
    id: String(id),
    name: typeof value.name === "string" ? value.name : null,
    email: typeof value.email === "string" ? value.email : null,
  };
}

function normalizeDeliverable(value: unknown): MapacheTaskDeliverable | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  const title = value.title;
  const url = value.url;
  const type = value.type;

  if (typeof id !== "string" && typeof id !== "number") return null;
  if (typeof title !== "string") return null;
  if (typeof url !== "string") return null;
  if (!MAPACHE_DELIVERABLE_TYPES.includes(type as MapacheDeliverableType)) {
    return null;
  }

  return {
    id: String(id),
    title,
    url,
    type: type as MapacheDeliverableType,
    addedById:
      typeof value.addedById === "string" ? value.addedById : value.addedById == null ? null : undefined,
    addedBy: normalizeUser(value.addedBy),
    createdAt:
      typeof value.createdAt === "string"
        ? (value.createdAt as string)
        : undefined,
  };
}

export function normalizeMapacheTask(task: unknown): MapacheTask | null {
  if (!isRecord(task)) return null;
  const id = task.id;
  const title = task.title;
  const status = task.status;
  const substatus = task.substatus;

  if (typeof id !== "string" && typeof id !== "number") return null;
  if (typeof title !== "string") return null;
  if (!MAPACHE_TASK_STATUSES.includes(status as MapacheTaskStatus)) return null;
  if (!MAPACHE_TASK_SUBSTATUSES.includes(substatus as MapacheTaskSubstatus)) {
    return null;
  }

  const createdAt =
    typeof task.createdAt === "string" ? (task.createdAt as string) : undefined;
  const updatedAt =
    typeof task.updatedAt === "string" ? (task.updatedAt as string) : undefined;
  const presentationDate =
    typeof task.presentationDate === "string"
      ? (task.presentationDate as string)
      : task.presentationDate == null
        ? null
        : undefined;

  const origin = task.origin;
  if (!MAPACHE_TASK_ORIGINS.includes(origin as MapacheTaskOrigin)) {
    return null;
  }

  const needFromTeam = task.needFromTeam;
  const directness = task.directness;
  const integrationType = task.integrationType;
  const integrationOwner = task.integrationOwner;

  return {
    id: String(id),
    title,
    description:
      typeof task.description === "string"
        ? (task.description as string)
        : task.description == null
          ? null
          : undefined,
    status: status as MapacheTaskStatus,
    substatus: substatus as MapacheTaskSubstatus,
    createdAt,
    updatedAt,
    createdById:
      typeof task.createdById === "string" ? (task.createdById as string) : undefined,
    assigneeId:
      typeof task.assigneeId === "string"
        ? (task.assigneeId as string)
        : task.assigneeId == null
          ? null
          : undefined,
    assignee: normalizeUser(task.assignee),
    requesterEmail:
      typeof task.requesterEmail === "string" ? task.requesterEmail : undefined,
    clientName: typeof task.clientName === "string" ? task.clientName : undefined,
    presentationDate,
    interlocutorRole:
      typeof task.interlocutorRole === "string"
        ? task.interlocutorRole
        : task.interlocutorRole == null
          ? null
          : undefined,
    clientWebsiteUrls: Array.isArray(task.clientWebsiteUrls)
      ? task.clientWebsiteUrls.filter((item): item is string => typeof item === "string")
      : [],
    directness: MAPACHE_DIRECTNESS.includes(directness as MapacheTaskDirectness)
      ? (directness as MapacheTaskDirectness)
      : undefined,
    pipedriveDealUrl:
      typeof task.pipedriveDealUrl === "string"
        ? task.pipedriveDealUrl
        : task.pipedriveDealUrl == null
          ? null
          : undefined,
    needFromTeam: MAPACHE_NEED_FROM_TEAM.includes(needFromTeam as MapacheTaskNeedFromTeam)
      ? (needFromTeam as MapacheTaskNeedFromTeam)
      : undefined,
    clientPain:
      typeof task.clientPain === "string"
        ? task.clientPain
        : task.clientPain == null
          ? null
          : undefined,
    productKey: typeof task.productKey === "string" ? task.productKey : undefined,
    managementType:
      typeof task.managementType === "string"
        ? task.managementType
        : task.managementType == null
          ? null
          : undefined,
    docsCountApprox:
      typeof task.docsCountApprox === "number"
        ? task.docsCountApprox
        : task.docsCountApprox == null
          ? null
          : undefined,
    docsLengthApprox:
      typeof task.docsLengthApprox === "string"
        ? task.docsLengthApprox
        : task.docsLengthApprox == null
          ? null
          : undefined,
    integrationType: MAPACHE_INTEGRATION_TYPES.includes(
      integrationType as MapacheIntegrationType,
    )
      ? (integrationType as MapacheIntegrationType)
      : integrationType == null
        ? null
        : undefined,
    integrationOwner: MAPACHE_INTEGRATION_OWNERS.includes(
      integrationOwner as MapacheIntegrationOwner,
    )
      ? (integrationOwner as MapacheIntegrationOwner)
      : integrationOwner == null
        ? null
        : undefined,
    integrationName:
      typeof task.integrationName === "string"
        ? task.integrationName
        : task.integrationName == null
          ? null
          : undefined,
    integrationDocsUrl:
      typeof task.integrationDocsUrl === "string"
        ? task.integrationDocsUrl
        : task.integrationDocsUrl == null
          ? null
          : undefined,
    avgMonthlyConversations:
      typeof task.avgMonthlyConversations === "number"
        ? task.avgMonthlyConversations
        : task.avgMonthlyConversations == null
          ? null
          : undefined,
    origin: origin as MapacheTaskOrigin,
    deliverables: Array.isArray(task.deliverables)
      ? task.deliverables
          .map(normalizeDeliverable)
          .filter((deliverable): deliverable is MapacheTaskDeliverable => deliverable !== null)
      : [],
  };
}
