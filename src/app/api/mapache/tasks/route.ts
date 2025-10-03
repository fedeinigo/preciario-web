// src/app/api/mapache/tasks/route.ts
import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  Directness,
  IntegrationOwner,
  IntegrationType,
  MapacheNeedFromTeam,
  MapacheSignalOrigin,
  MapacheTaskSubstatus,
} from "@prisma/client";

import {
  ensureMapacheAccess,
  parseDeliverableType,
  parseDirectness,
  parseIntegrationOwner,
  parseIntegrationType,
  parseNeedFromTeam,
  parseOrigin,
  parseStatus,
  parseSubstatus,
  taskSelect,
} from "./access";
import type { MapacheDeliverableType } from "./access";

type DeliverableInput = {
  title: string;
  url: string;
  type: MapacheDeliverableType;
  addedById: string | null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStringWithDefault(
  value: unknown,
  field: string,
  defaultValue = "",
): string | NextResponse {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value !== "string") {
    return NextResponse.json(
      { error: `${field} must be a string` },
      { status: 400 },
    );
  }
  return value.trim();
}

function parseOptionalString(
  value: unknown,
  field: string,
): string | null | NextResponse {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    return NextResponse.json(
      { error: `${field} must be a string` },
      { status: 400 },
    );
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function parseOptionalId(
  value: unknown,
  field: string,
): string | null | NextResponse {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    return NextResponse.json(
      { error: `${field} must be a string` },
      { status: 400 },
    );
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function parseEmail(value: unknown, field: string): string | NextResponse {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    return NextResponse.json(
      { error: `${field} must be a string` },
      { status: 400 },
    );
  }
  const email = value.trim();
  if (!email) return "";
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: `${field} must be a valid email` },
      { status: 400 },
    );
  }
  return email;
}

function parseUrl(value: unknown, field: string): string | null | NextResponse {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    return NextResponse.json(
      { error: `${field} must be a string` },
      { status: 400 },
    );
  }
  const raw = value.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.toString();
  } catch {
    return NextResponse.json(
      { error: `${field} must be a valid URL` },
      { status: 400 },
    );
  }
}

function parseUrlArray(
  value: unknown,
  field: string,
): string[] | NextResponse {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    return NextResponse.json(
      { error: `${field} must be an array of URLs` },
      { status: 400 },
    );
  }

  const urls: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (typeof entry !== "string") {
      return NextResponse.json(
        { error: `${field}[${index}] must be a string` },
        { status: 400 },
      );
    }
    const trimmed = entry.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: `${field}[${index}] cannot be empty` },
        { status: 400 },
      );
    }
    try {
      const url = new URL(trimmed);
      urls.push(url.toString());
    } catch {
      return NextResponse.json(
        { error: `${field}[${index}] must be a valid URL` },
        { status: 400 },
      );
    }
  }
  return urls;
}

function parseInteger(
  value: unknown,
  field: string,
): number | null | NextResponse {
  if (value === undefined || value === null) return null;
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    return NextResponse.json(
      { error: `${field} must be an integer greater or equal to 0` },
      { status: 400 },
    );
  }
  return parsed;
}

function parsePresentationDate(
  value: unknown,
): Date | null | undefined | NextResponse {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return NextResponse.json(
        { error: "presentationDate must be a valid date" },
        { status: 400 },
      );
    }
    return value;
  }
  if (typeof value !== "string") {
    return NextResponse.json(
      { error: "presentationDate must be a string" },
      { status: 400 },
    );
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json(
      { error: "presentationDate must be a valid date" },
      { status: 400 },
    );
  }
  return date;
}

function parseDeliverables(
  value: unknown,
): DeliverableInput[] | NextResponse {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    return NextResponse.json(
      { error: "deliverables must be an array" },
      { status: 400 },
    );
  }

  const parsed: DeliverableInput[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (!isRecord(item)) {
      return NextResponse.json(
        { error: `deliverables[${index}] must be an object` },
        { status: 400 },
      );
    }
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (!title) {
      return NextResponse.json(
        { error: `deliverables[${index}].title is required` },
        { status: 400 },
      );
    }
    const urlResult = parseUrl(item.url, `deliverables[${index}].url`);
    if (urlResult instanceof NextResponse) {
      return urlResult;
    }
    if (!urlResult) {
      return NextResponse.json(
        { error: `deliverables[${index}].url is required` },
        { status: 400 },
      );
    }
    let type: MapacheDeliverableType;
    if (item.type === undefined || item.type === null) {
      type = "SCOPE_AND_QUOTE";
    } else {
      const parsedType = parseDeliverableType(item.type);
      if (!parsedType) {
        return NextResponse.json(
          { error: `deliverables[${index}].type is invalid` },
          { status: 400 },
        );
      }
      type = parsedType;
    }
    let addedById: string | null = null;
    if (item.addedById !== undefined && item.addedById !== null) {
      if (typeof item.addedById !== "string") {
        return NextResponse.json(
          { error: `deliverables[${index}].addedById must be a string` },
          { status: 400 },
        );
      }
      const trimmed = item.addedById.trim();
      addedById = trimmed || null;
    }

    parsed.push({
      title,
      url: urlResult,
      type,
      addedById,
    });
  }

  return parsed;
}


type MapacheTaskDelegate = {
  findMany: (args: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
};

const mapacheTask = (prisma as unknown as { mapacheTask: MapacheTaskDelegate }).mapacheTask;

const EMAIL_REGEX = /.+@.+\..+/i;

function parseEnumValue<T extends Record<string, string>>(
  value: unknown,
  enumObject: T,
): T[keyof T] | null {
  if (typeof value !== "string") return null;
  const allowed = new Set<string>(Object.values(enumObject));
  return allowed.has(value) ? (value as T[keyof T]) : null;
}

export async function GET() {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;

  const tasks = (await mapacheTask.findMany({
    orderBy: { createdAt: "desc" },
    select: taskSelect,
  })) as unknown[];

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse, userId } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: unknown;
    description?: unknown;
    status?: unknown;
    substatus?: unknown;
    origin?: unknown;
    requesterEmail?: unknown;
    clientName?: unknown;
    productKey?: unknown;
    needFromTeam?: unknown;
    directness?: unknown;
    assigneeId?: unknown;
    presentationDate?: unknown;
    interlocutorRole?: unknown;
    clientWebsiteUrls?: unknown;
    pipedriveDealUrl?: unknown;
    clientPain?: unknown;
    managementType?: unknown;
    docsCountApprox?: unknown;
    docsLengthApprox?: unknown;
    integrationType?: unknown;
    integrationOwner?: unknown;
    integrationName?: unknown;
    integrationDocsUrl?: unknown;
    avgMonthlyConversations?: unknown;
  };

  const title = typeof rawBody.title === "string" ? rawBody.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const status =
    rawBody.status === undefined || rawBody.status === null
      ? "PENDING"
      : parseStatus(rawBody.status);
  if (!status) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const substatus =
    parseEnumValue(body.substatus, MapacheTaskSubstatus) ??
    MapacheTaskSubstatus.BACKLOG;

  const origin =
    parseEnumValue(body.origin, MapacheSignalOrigin) ??
    MapacheSignalOrigin.MANUAL;

  const description =
    typeof body.description === "string"
      ? body.description.trim() || null
      : body.description == null
        ? null
        : undefined;

  const requesterEmail =
    typeof body.requesterEmail === "string"
      ? body.requesterEmail.trim()
      : "";
  if (!requesterEmail || !EMAIL_REGEX.test(requesterEmail)) {
    return NextResponse.json({ error: "Requester email is invalid" }, { status: 400 });
  }

  const clientName =
    typeof body.clientName === "string" ? body.clientName.trim() : "";
  if (!clientName) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  const productKey =
    typeof body.productKey === "string" ? body.productKey.trim() : "";
  if (!productKey) {
    return NextResponse.json({ error: "Product key is required" }, { status: 400 });
  }

  const needFromTeam = parseEnumValue(body.needFromTeam, MapacheNeedFromTeam);
  if (!needFromTeam) {
    return NextResponse.json({ error: "Invalid needFromTeam" }, { status: 400 });
  }

  const directness = parseEnumValue(body.directness, Directness);
  if (!directness) {
    return NextResponse.json({ error: "Invalid directness" }, { status: 400 });
  }

  const assigneeId =
    typeof body.assigneeId === "string" && body.assigneeId.trim()
      ? body.assigneeId.trim()
      : null;

  let presentationDate: Date | null | undefined;
  if (typeof body.presentationDate === "string" && body.presentationDate.trim()) {
    const parsed = new Date(body.presentationDate);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid presentation date" }, { status: 400 });
    }
    presentationDate = parsed;
  } else if (body.presentationDate == null) {
    presentationDate = null;
  }

  const interlocutorRole =
    typeof body.interlocutorRole === "string"
      ? body.interlocutorRole.trim() || null
      : body.interlocutorRole == null
        ? null
        : undefined;

  const clientWebsiteUrls = Array.isArray(body.clientWebsiteUrls)
    ? body.clientWebsiteUrls
        .filter((item): item is string => typeof item === "string" && item.trim())
        .map((item) => item.trim())
    : [];

  const pipedriveDealUrl =
    typeof body.pipedriveDealUrl === "string"
      ? body.pipedriveDealUrl.trim() || null
      : body.pipedriveDealUrl == null
        ? null
        : undefined;

  const clientPain =
    typeof body.clientPain === "string"
      ? body.clientPain.trim() || null
      : body.clientPain == null
        ? null
        : undefined;

  const managementType =
    typeof body.managementType === "string"
      ? body.managementType.trim() || null
      : body.managementType == null
        ? null
        : undefined;

  const docsCountApprox =
    typeof body.docsCountApprox === "number" && Number.isFinite(body.docsCountApprox)
      ? Math.floor(body.docsCountApprox)
      : body.docsCountApprox == null
        ? null
        : undefined;

  const docsLengthApprox =
    typeof body.docsLengthApprox === "string"
      ? body.docsLengthApprox.trim() || null
      : body.docsLengthApprox == null
        ? null
        : undefined;

  let integrationType: IntegrationType | null | undefined = undefined;
  if (body.integrationType === null) {
    integrationType = null;
  } else if (body.integrationType !== undefined) {
    const parsed = parseEnumValue(body.integrationType, IntegrationType);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid integrationType" }, { status: 400 });
    }
    integrationType = parsed;
  }

  let integrationOwner: IntegrationOwner | null | undefined = undefined;
  if (body.integrationOwner === null) {
    integrationOwner = null;
  } else if (body.integrationOwner !== undefined) {
    const parsed = parseEnumValue(body.integrationOwner, IntegrationOwner);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid integrationOwner" }, { status: 400 });
    }
    integrationOwner = parsed;
  }

  const integrationName =
    typeof body.integrationName === "string"
      ? body.integrationName.trim() || null
      : body.integrationName == null
        ? null
        : undefined;

  const integrationDocsUrl =
    typeof body.integrationDocsUrl === "string"
      ? body.integrationDocsUrl.trim() || null
      : body.integrationDocsUrl == null
        ? null
        : undefined;

  const avgMonthlyConversations =
    typeof body.avgMonthlyConversations === "number" &&
    Number.isFinite(body.avgMonthlyConversations)
      ? Math.floor(body.avgMonthlyConversations)
      : body.avgMonthlyConversations == null
        ? null
        : undefined;

  const created = await prisma.mapacheTask.create({
    data: {
      title,
      status,
      substatus,
      origin,
      description,
      requesterEmail,
      clientName,
      productKey,
      needFromTeam,
      directness,
      createdById: userId,
      assigneeId,
      presentationDate: presentationDate ?? undefined,
      interlocutorRole,
      clientWebsiteUrls,
      pipedriveDealUrl,
      clientPain,
      managementType,
      docsCountApprox,
      docsLengthApprox,
      integrationType: integrationType ?? undefined,
      integrationOwner: integrationOwner ?? undefined,
      integrationName,
      integrationDocsUrl,
      avgMonthlyConversations,
    },
    select: taskSelect,
  });
    rawBody.substatus === undefined || rawBody.substatus === null
      ? "BACKLOG"
      : parseSubstatus(rawBody.substatus);
  if (!substatus) {
    return NextResponse.json({ error: "Invalid substatus" }, { status: 400 });
  }

  const origin =
    rawBody.origin === undefined || rawBody.origin === null
      ? "MANUAL"
      : parseOrigin(rawBody.origin);
  if (!origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 400 });
  }

  let description: string | null | undefined;
  if ("description" in rawBody) {
    if (rawBody.description === null) {
      description = null;
    } else if (typeof rawBody.description === "string") {
      description = rawBody.description;
    } else {
      return NextResponse.json(
        { error: "Description must be a string or null" },
        { status: 400 },
      );
    }
  }

  const assigneeIdResult = parseOptionalId(rawBody.assigneeId, "assigneeId");
  if (assigneeIdResult instanceof NextResponse) return assigneeIdResult;
  const assigneeId = assigneeIdResult;

  const requesterEmailResult = parseEmail(rawBody.requesterEmail, "requesterEmail");
  if (requesterEmailResult instanceof NextResponse) return requesterEmailResult;
  const requesterEmail = requesterEmailResult;

  const clientNameResult = parseStringWithDefault(
    rawBody.clientName,
    "clientName",
  );
  if (clientNameResult instanceof NextResponse) return clientNameResult;
  const clientName = clientNameResult;

  const productKeyResult = parseStringWithDefault(
    rawBody.productKey,
    "productKey",
  );
  if (productKeyResult instanceof NextResponse) return productKeyResult;
  const productKey = productKeyResult;

  const needFromTeam =
    rawBody.needFromTeam === undefined || rawBody.needFromTeam === null
      ? null
      : parseNeedFromTeam(rawBody.needFromTeam);
  if (rawBody.needFromTeam !== undefined && rawBody.needFromTeam !== null && !needFromTeam) {
    return NextResponse.json({ error: "Invalid needFromTeam" }, { status: 400 });
  }

  const directness =
    rawBody.directness === undefined || rawBody.directness === null
      ? null
      : parseDirectness(rawBody.directness);
  if (rawBody.directness !== undefined && rawBody.directness !== null && !directness) {
    return NextResponse.json({ error: "Invalid directness" }, { status: 400 });
  }

  const integrationType =
    rawBody.integrationType === undefined || rawBody.integrationType === null
      ? null
      : parseIntegrationType(rawBody.integrationType);
  if (
    rawBody.integrationType !== undefined &&
    rawBody.integrationType !== null &&
    !integrationType
  ) {
    return NextResponse.json({ error: "Invalid integrationType" }, { status: 400 });
  }

  const integrationOwner =
    rawBody.integrationOwner === undefined || rawBody.integrationOwner === null
      ? null
      : parseIntegrationOwner(rawBody.integrationOwner);
  if (
    rawBody.integrationOwner !== undefined &&
    rawBody.integrationOwner !== null &&
    !integrationOwner
  ) {
    return NextResponse.json({ error: "Invalid integrationOwner" }, { status: 400 });
  }

  const clientWebsiteUrlsResult = parseUrlArray(
    rawBody.clientWebsiteUrls,
    "clientWebsiteUrls",
  );
  if (clientWebsiteUrlsResult instanceof NextResponse) return clientWebsiteUrlsResult;
  const clientWebsiteUrls = clientWebsiteUrlsResult;

  const pipedriveDealUrlResult = parseUrl(
    rawBody.pipedriveDealUrl,
    "pipedriveDealUrl",
  );
  if (pipedriveDealUrlResult instanceof NextResponse) return pipedriveDealUrlResult;
  const pipedriveDealUrl = pipedriveDealUrlResult;

  const integrationDocsUrlResult = parseUrl(
    rawBody.integrationDocsUrl,
    "integrationDocsUrl",
  );
  if (integrationDocsUrlResult instanceof NextResponse) return integrationDocsUrlResult;
  const integrationDocsUrl = integrationDocsUrlResult;

  const docsCountApproxResult = parseInteger(
    rawBody.docsCountApprox,
    "docsCountApprox",
  );
  if (docsCountApproxResult instanceof NextResponse) return docsCountApproxResult;
  const docsCountApprox = docsCountApproxResult;

  const avgMonthlyConversationsResult = parseInteger(
    rawBody.avgMonthlyConversations,
    "avgMonthlyConversations",
  );
  if (avgMonthlyConversationsResult instanceof NextResponse) {
    return avgMonthlyConversationsResult;
  }
  const avgMonthlyConversations = avgMonthlyConversationsResult;

  const presentationDateResult = parsePresentationDate(rawBody.presentationDate);
  if (presentationDateResult instanceof NextResponse) return presentationDateResult;
  const presentationDate = presentationDateResult;

  const interlocutorRoleResult = parseOptionalString(
    rawBody.interlocutorRole,
    "interlocutorRole",
  );
  if (interlocutorRoleResult instanceof NextResponse) return interlocutorRoleResult;
  const interlocutorRole = interlocutorRoleResult;

  const clientPainResult = parseOptionalString(rawBody.clientPain, "clientPain");
  if (clientPainResult instanceof NextResponse) return clientPainResult;
  const clientPain = clientPainResult;

  const managementTypeResult = parseOptionalString(
    rawBody.managementType,
    "managementType",
  );
  if (managementTypeResult instanceof NextResponse) return managementTypeResult;
  const managementType = managementTypeResult;

  const docsLengthApproxResult = parseOptionalString(
    rawBody.docsLengthApprox,
    "docsLengthApprox",
  );
  if (docsLengthApproxResult instanceof NextResponse) return docsLengthApproxResult;
  const docsLengthApprox = docsLengthApproxResult;

  const integrationNameResult = parseOptionalString(
    rawBody.integrationName,
    "integrationName",
  );
  if (integrationNameResult instanceof NextResponse) return integrationNameResult;
  const integrationName = integrationNameResult;

  const deliverablesResult = parseDeliverables(rawBody.deliverables);
  if (deliverablesResult instanceof NextResponse) return deliverablesResult;
  const deliverables = deliverablesResult;

  const createData: Prisma.MapacheTaskCreateInput = {
    title,
    status,
    substatus,
    origin,
    createdBy: { connect: { id: userId } },
    requesterEmail,
    clientName,
    productKey,
    clientWebsiteUrls,
  };

  if (description !== undefined) {
    createData.description = description;
  }
  if (assigneeId) {
    createData.assignee = { connect: { id: assigneeId } };
  }

  if (needFromTeam) createData.needFromTeam = needFromTeam;
  if (directness) createData.directness = directness;
  if (integrationType) createData.integrationType = integrationType;
  if (integrationOwner) createData.integrationOwner = integrationOwner;
  if (pipedriveDealUrl) createData.pipedriveDealUrl = pipedriveDealUrl;
  if (integrationDocsUrl) createData.integrationDocsUrl = integrationDocsUrl;
  if (interlocutorRole) createData.interlocutorRole = interlocutorRole;
  if (clientPain) createData.clientPain = clientPain;
  if (managementType) createData.managementType = managementType;
  if (docsLengthApprox) createData.docsLengthApprox = docsLengthApprox;
  if (integrationName) createData.integrationName = integrationName;
  if (docsCountApprox !== null) createData.docsCountApprox = docsCountApprox;
  if (avgMonthlyConversations !== null) {
    createData.avgMonthlyConversations = avgMonthlyConversations;
  }
  if (presentationDate !== undefined) {
    createData.presentationDate = presentationDate;
  }

  if (deliverables.length > 0) {
    createData.deliverables = {
      create: deliverables.map((deliverable) => {
        const payload: Prisma.MapacheTaskDeliverableCreateWithoutTaskInput = {
          title: deliverable.title,
          url: deliverable.url,
          type: deliverable.type,
        };
        if (deliverable.addedById) {
          payload.addedBy = { connect: { id: deliverable.addedById } };
        }
        return payload;
      }),
    };
  }

  const created = await prisma.$transaction((tx) =>
    tx.mapacheTask.create({
      data: createData,
      select: taskSelect,
    }),
  );


  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;

  const body = (await req.json()) as {
    id?: unknown;
    title?: unknown;
    description?: unknown;
    status?: unknown;
  };

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Task id is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    data.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description === "string") {
      data.description = body.description;
    } else if (body.description == null) {
      data.description = null;
    } else {
      return NextResponse.json({ error: "Description must be a string" }, { status: 400 });
    }
  }

  if (body.status !== undefined) {
    const status = parseStatus(body.status);
    if (!status) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const updated = await mapacheTask.update({
    where: { id },
    data,
    select: taskSelect,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;

  const body = (await req.json()) as { id?: unknown };
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Task id is required" }, { status: 400 });
  }

  await mapacheTask.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

