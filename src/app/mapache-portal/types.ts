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

export const MAPACHE_SIGNAL_ORIGINS = [
  "GOOGLE_FORM",
  "GENERATOR",
  "API",
  "MANUAL",
  "OTHER",
] as const;

export const MAPACHE_INTEGRATION_TYPES = [
  "REST",
  "GRAPHQL",
  "SDK",
  "OTHER",
] as const;

export const MAPACHE_INTEGRATION_OWNERS = ["OWN", "THIRD_PARTY"] as const;

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
export type MapacheSignalOrigin = (typeof MAPACHE_SIGNAL_ORIGINS)[number];
export type MapacheIntegrationType = (typeof MAPACHE_INTEGRATION_TYPES)[number];
export type MapacheIntegrationOwner = (typeof MAPACHE_INTEGRATION_OWNERS)[number];
export type MapacheDeliverableType = (typeof MAPACHE_DELIVERABLE_TYPES)[number];

export type MapacheTaskUser = {
  id: string;
  name: string | null;
  email: string | null;
};

export type MapacheTaskDeliverable = {
  id: string;
  type: MapacheDeliverableType;
  title: string;
  url: string;
  addedById: string | null;
  addedBy?: MapacheTaskUser | null;
  createdAt?: string;
};

export type MapacheTask = {
  id: string;
  title: string;
  description: string | null;
  status: MapacheTaskStatus;
  substatus: MapacheTaskSubstatus;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  assigneeId: string | null;
  assignee?: MapacheTaskUser | null;
  requesterEmail?: string;
  clientName?: string;
  presentationDate: string | null;
  interlocutorRole: string | null;
  clientWebsiteUrls: string[];
  directness?: MapacheDirectness;
  pipedriveDealUrl: string | null;
  needFromTeam?: MapacheNeedFromTeam;
  clientPain: string | null;
  productKey?: string;
  managementType: string | null;
  docsCountApprox: number | null;
  docsLengthApprox: string | null;
  integrationType: MapacheIntegrationType | null;
  integrationOwner: MapacheIntegrationOwner | null;
  integrationName: string | null;
  integrationDocsUrl: string | null;
  avgMonthlyConversations: number | null;
  origin: MapacheSignalOrigin;
  deliverables: MapacheTaskDeliverable[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseEnumValue<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number] | null {
  if (typeof value !== "string") return null;
  return allowed.includes(value as T[number]) ? (value as T[number]) : null;
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
  const type = parseEnumValue(value.type, MAPACHE_DELIVERABLE_TYPES);
  const title = value.title;
  const url = value.url;

  if (typeof id !== "string" && typeof id !== "number") return null;
  if (!type) return null;
  if (typeof title !== "string" || typeof url !== "string") return null;

  return {
    id: String(id),
    type,
    title,
    url,
    addedById:
      typeof value.addedById === "string"
        ? value.addedById
        : null,
    addedBy: normalizeUser(value.addedBy),
    createdAt:
      typeof value.createdAt === "string" ? (value.createdAt as string) : undefined,
  };
}

export function normalizeMapacheTask(task: unknown): MapacheTask | null {
  if (!isRecord(task)) return null;

  const id = task.id;
  const title = task.title;
  const status = parseEnumValue(task.status, MAPACHE_TASK_STATUSES);
  const substatus = parseEnumValue(task.substatus, MAPACHE_TASK_SUBSTATUSES);

  if (typeof id !== "string" && typeof id !== "number") return null;
  if (typeof title !== "string" || !status || !substatus) return null;

  const description =
    typeof task.description === "string" ? task.description : null;

  const assigneeId =
    typeof task.assigneeId === "string"
      ? task.assigneeId
      : null;

  const presentationDate =
    typeof task.presentationDate === "string"
      ? task.presentationDate
      : null;

  const interlocutorRole =
    typeof task.interlocutorRole === "string"
      ? task.interlocutorRole
      : null;

  const pipedriveDealUrl =
    typeof task.pipedriveDealUrl === "string"
      ? task.pipedriveDealUrl
      : null;

  const clientPain =
    typeof task.clientPain === "string"
      ? task.clientPain
      : null;

  const managementType =
    typeof task.managementType === "string"
      ? task.managementType
      : null;

  const docsCountApprox =
    typeof task.docsCountApprox === "number" ? task.docsCountApprox : null;

  const docsLengthApprox =
    typeof task.docsLengthApprox === "string"
      ? task.docsLengthApprox
      : null;

  const integrationType = parseEnumValue(
    task.integrationType,
    MAPACHE_INTEGRATION_TYPES,
  );
  const integrationOwner = parseEnumValue(
    task.integrationOwner,
    MAPACHE_INTEGRATION_OWNERS,
  );

  const integrationName =
    typeof task.integrationName === "string"
      ? task.integrationName
      : null;

  const integrationDocsUrl =
    typeof task.integrationDocsUrl === "string"
      ? task.integrationDocsUrl
      : null;

  const avgMonthlyConversations =
    typeof task.avgMonthlyConversations === "number"
      ? task.avgMonthlyConversations
      : null;

  const origin = parseEnumValue(task.origin, MAPACHE_SIGNAL_ORIGINS);
  if (!origin) return null;

  const needFromTeam = parseEnumValue(task.needFromTeam, MAPACHE_NEEDS_FROM_TEAM);
  const directness = parseEnumValue(task.directness, MAPACHE_DIRECTNESS);

  const clientWebsiteUrls = Array.isArray(task.clientWebsiteUrls)
    ? task.clientWebsiteUrls.filter((item): item is string => typeof item === "string")
    : [];

  const deliverables = Array.isArray(task.deliverables)
    ? task.deliverables
        .map(normalizeDeliverable)
        .filter((deliverable): deliverable is MapacheTaskDeliverable => deliverable !== null)
    : [];

  return {
    id: String(id),
    title,
    description,
    status,
    substatus,
    createdAt:
      typeof task.createdAt === "string" ? (task.createdAt as string) : undefined,
    updatedAt:
      typeof task.updatedAt === "string" ? (task.updatedAt as string) : undefined,
    createdById:
      typeof task.createdById === "string" ? (task.createdById as string) : undefined,
    assigneeId,
    assignee: normalizeUser(task.assignee),
    requesterEmail:
      typeof task.requesterEmail === "string" ? (task.requesterEmail as string) : undefined,
    clientName: typeof task.clientName === "string" ? (task.clientName as string) : undefined,
    presentationDate,
    interlocutorRole,
    clientWebsiteUrls,
    directness: directness ?? undefined,
    pipedriveDealUrl,
    needFromTeam: needFromTeam ?? undefined,
    clientPain,
    productKey: typeof task.productKey === "string" ? (task.productKey as string) : undefined,
    managementType,
    docsCountApprox,
    docsLengthApprox,
    integrationType: integrationType ?? null,
    integrationOwner: integrationOwner ?? null,
    integrationName,
    integrationDocsUrl,
    avgMonthlyConversations,
    origin,
    deliverables,
  };
}
