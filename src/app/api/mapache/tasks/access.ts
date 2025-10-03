// src/app/api/mapache/tasks/access.ts
import { NextResponse } from "next/server";

import type { ApiSession } from "@/app/api/_utils/require-auth";
import type { Prisma } from "@prisma/client";

export const MAPACHE_TEAM = "Mapaches" as const;
export const VALID_STATUSES = ["PENDING", "IN_PROGRESS", "DONE"] as const;
export type MapacheStatus = (typeof VALID_STATUSES)[number];

export const VALID_SUBSTATUSES = [
  "BACKLOG",
  "WAITING_CLIENT",
  "BLOCKED",
] as const;
export type MapacheSubstatus = (typeof VALID_SUBSTATUSES)[number];

export const VALID_DIRECTNESS = ["DIRECT", "PARTNER"] as const;
export type MapacheDirectness = (typeof VALID_DIRECTNESS)[number];

export const VALID_NEED_FROM_TEAM = [
  "QUOTE_SCOPE",
  "QUOTE",
  "SCOPE",
  "PRESENTATION",
  "OTHER",
] as const;
export type MapacheNeedFromTeam = (typeof VALID_NEED_FROM_TEAM)[number];

export const VALID_ORIGINS = [
  "GOOGLE_FORM",
  "GENERATOR",
  "API",
  "MANUAL",
  "OTHER",
] as const;
export type MapacheOrigin = (typeof VALID_ORIGINS)[number];

export const VALID_DELIVERABLE_TYPES = [
  "SCOPE",
  "QUOTE",
  "SCOPE_AND_QUOTE",
  "OTHER",
] as const;
export type MapacheDeliverableType = (typeof VALID_DELIVERABLE_TYPES)[number];

export const VALID_INTEGRATION_TYPES = [
  "REST",
  "GRAPHQL",
  "SDK",
  "OTHER",
] as const;
export type MapacheIntegrationType = (typeof VALID_INTEGRATION_TYPES)[number];

export const VALID_INTEGRATION_OWNERS = ["OWN", "THIRD_PARTY"] as const;
export type MapacheIntegrationOwner = (typeof VALID_INTEGRATION_OWNERS)[number];

export function parseStatus(status: unknown): MapacheStatus | null {
  if (typeof status !== "string") return null;
  return VALID_STATUSES.includes(status as MapacheStatus)
    ? (status as MapacheStatus)
    : null;
}

export function parseSubstatus(substatus: unknown): MapacheSubstatus | null {
  if (typeof substatus !== "string") return null;
  return VALID_SUBSTATUSES.includes(substatus as MapacheSubstatus)
    ? (substatus as MapacheSubstatus)
    : null;
}

export function parseDirectness(directness: unknown): MapacheDirectness | null {
  if (typeof directness !== "string") return null;
  return VALID_DIRECTNESS.includes(directness as MapacheDirectness)
    ? (directness as MapacheDirectness)
    : null;
}

export function parseNeedFromTeam(
  needFromTeam: unknown,
): MapacheNeedFromTeam | null {
  if (typeof needFromTeam !== "string") return null;
  return VALID_NEED_FROM_TEAM.includes(needFromTeam as MapacheNeedFromTeam)
    ? (needFromTeam as MapacheNeedFromTeam)
    : null;
}

export function parseOrigin(origin: unknown): MapacheOrigin | null {
  if (typeof origin !== "string") return null;
  return VALID_ORIGINS.includes(origin as MapacheOrigin)
    ? (origin as MapacheOrigin)
    : null;
}

export function parseDeliverableType(
  type: unknown,
): MapacheDeliverableType | null {
  if (typeof type !== "string") return null;
  return VALID_DELIVERABLE_TYPES.includes(type as MapacheDeliverableType)
    ? (type as MapacheDeliverableType)
    : null;
}

export function parseIntegrationType(
  type: unknown,
): MapacheIntegrationType | null {
  if (typeof type !== "string") return null;
  return VALID_INTEGRATION_TYPES.includes(type as MapacheIntegrationType)
    ? (type as MapacheIntegrationType)
    : null;
}

export function parseIntegrationOwner(
  owner: unknown,
): MapacheIntegrationOwner | null {
  if (typeof owner !== "string") return null;
  return VALID_INTEGRATION_OWNERS.includes(owner as MapacheIntegrationOwner)
    ? (owner as MapacheIntegrationOwner)
    : null;
}

export type AccessResult = { response: NextResponse | null; userId?: string };

export function ensureMapacheAccess(session: ApiSession | null): AccessResult {
  const user = session?.user;
  if (!user?.id) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const isAdmin = user.role === "superadmin";
  const isMapache = user.team === MAPACHE_TEAM;

  if (!isAdmin && !isMapache) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { response: null, userId: user.id };
}

export const deliverableSelect = {
  id: true,
  type: true,
  title: true,
  url: true,
  addedById: true,
  createdAt: true,
  addedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.MapacheTaskDeliverableSelect;

export const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  substatus: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  assigneeId: true,
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  requesterEmail: true,
  clientName: true,
  presentationDate: true,
  interlocutorRole: true,
  clientWebsiteUrls: true,
  directness: true,
  pipedriveDealUrl: true,
  needFromTeam: true,
  clientPain: true,
  productKey: true,
  managementType: true,
  docsCountApprox: true,
  docsLengthApprox: true,
  integrationType: true,
  integrationOwner: true,
  integrationName: true,
  integrationDocsUrl: true,
  avgMonthlyConversations: true,
  origin: true,
  deliverables: {
    select: deliverableSelect,
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.MapacheTaskSelect;
