// src/app/api/mapache/tasks/route.ts
import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

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
import type {
  MapacheDeliverableType,
  MapacheIntegrationOwner,
  MapacheIntegrationType,
} from "./access";

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

const mapacheTask = (
  prisma as unknown as { mapacheTask: MapacheTaskDelegate }
).mapacheTask;

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

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const titleResult = parseStringWithDefault(body.title, "title");
  if (titleResult instanceof NextResponse) return titleResult;
  const title = titleResult;
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const status = parseStatus(body.status) ?? "PENDING";
  const substatus = parseSubstatus(body.substatus) ?? "BACKLOG";
  const origin = parseOrigin(body.origin) ?? "MANUAL";

  const descriptionResult = parseOptionalString(body.description, "description");
  if (descriptionResult instanceof NextResponse) return descriptionResult;
  const description = descriptionResult;

  const requesterEmailResult = parseEmail(body.requesterEmail, "requesterEmail");
  if (requesterEmailResult instanceof NextResponse) return requesterEmailResult;
  const requesterEmail = requesterEmailResult;
  if (!requesterEmail) {
    return NextResponse.json(
      { error: "requesterEmail is required" },
      { status: 400 },
    );
  }

  const clientNameResult = parseStringWithDefault(body.clientName, "clientName");
  if (clientNameResult instanceof NextResponse) return clientNameResult;
  const clientName = clientNameResult;
  if (!clientName) {
    return NextResponse.json(
      { error: "clientName is required" },
      { status: 400 },
    );
  }

  const productKeyResult = parseStringWithDefault(body.productKey, "productKey");
  if (productKeyResult instanceof NextResponse) return productKeyResult;
  const productKey = productKeyResult;
  if (!productKey) {
    return NextResponse.json(
      { error: "productKey is required" },
      { status: 400 },
    );
  }

  const needFromTeam = parseNeedFromTeam(body.needFromTeam);
  if (!needFromTeam) {
    return NextResponse.json({ error: "Invalid needFromTeam" }, { status: 400 });
  }

  const directness = parseDirectness(body.directness);
  if (!directness) {
    return NextResponse.json({ error: "Invalid directness" }, { status: 400 });
  }

  const assigneeIdResult = parseOptionalId(body.assigneeId, "assigneeId");
  if (assigneeIdResult instanceof NextResponse) return assigneeIdResult;
  const assigneeId = assigneeIdResult;

  const presentationDateResult = parsePresentationDate(body.presentationDate);
  if (presentationDateResult instanceof NextResponse) return presentationDateResult;
  const presentationDate = presentationDateResult;

  const interlocutorRoleResult = parseOptionalString(
    body.interlocutorRole,
    "interlocutorRole",
  );
  if (interlocutorRoleResult instanceof NextResponse) return interlocutorRoleResult;
  const interlocutorRole = interlocutorRoleResult;

  const clientWebsiteUrlsResult = parseUrlArray(
    body.clientWebsiteUrls,
    "clientWebsiteUrls",
  );
  if (clientWebsiteUrlsResult instanceof NextResponse) return clientWebsiteUrlsResult;
  const clientWebsiteUrls = clientWebsiteUrlsResult;

  const pipedriveDealUrlResult = parseUrl(body.pipedriveDealUrl, "pipedriveDealUrl");
  if (pipedriveDealUrlResult instanceof NextResponse) return pipedriveDealUrlResult;
  const pipedriveDealUrl = pipedriveDealUrlResult;

  const clientPainResult = parseOptionalString(body.clientPain, "clientPain");
  if (clientPainResult instanceof NextResponse) return clientPainResult;
  const clientPain = clientPainResult;

  const managementTypeResult = parseOptionalString(
    body.managementType,
    "managementType",
  );
  if (managementTypeResult instanceof NextResponse) return managementTypeResult;
  const managementType = managementTypeResult;

  const docsCountApproxResult = parseInteger(body.docsCountApprox, "docsCountApprox");
  if (docsCountApproxResult instanceof NextResponse) return docsCountApproxResult;
  const docsCountApprox = docsCountApproxResult;

  const docsLengthApproxResult = parseOptionalString(
    body.docsLengthApprox,
    "docsLengthApprox",
  );
  if (docsLengthApproxResult instanceof NextResponse) return docsLengthApproxResult;
  const docsLengthApprox = docsLengthApproxResult;

  let integrationType: MapacheIntegrationType | null | undefined = undefined;
  if (body.integrationType === null) {
    integrationType = null;
  } else if (body.integrationType !== undefined) {
    const parsed = parseIntegrationType(body.integrationType);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid integrationType" }, { status: 400 });
    }
    integrationType = parsed;
  }

  let integrationOwner: MapacheIntegrationOwner | null | undefined = undefined;
  if (body.integrationOwner === null) {
    integrationOwner = null;
  } else if (body.integrationOwner !== undefined) {
    const parsed = parseIntegrationOwner(body.integrationOwner);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid integrationOwner" }, { status: 400 });
    }
    integrationOwner = parsed;
  }

  const integrationNameResult = parseOptionalString(
    body.integrationName,
    "integrationName",
  );
  if (integrationNameResult instanceof NextResponse) return integrationNameResult;
  const integrationName = integrationNameResult;

  const integrationDocsUrlResult = parseUrl(
    body.integrationDocsUrl,
    "integrationDocsUrl",
  );
  if (integrationDocsUrlResult instanceof NextResponse) return integrationDocsUrlResult;
  const integrationDocsUrl = integrationDocsUrlResult;

  const avgMonthlyConversationsResult = parseInteger(
    body.avgMonthlyConversations,
    "avgMonthlyConversations",
  );
  if (avgMonthlyConversationsResult instanceof NextResponse) {
    return avgMonthlyConversationsResult;
  }
  const avgMonthlyConversations = avgMonthlyConversationsResult;

  const deliverablesResult = parseDeliverables(body.deliverables);
  if (deliverablesResult instanceof NextResponse) return deliverablesResult;
  const deliverables = deliverablesResult;

  const taskData: Record<string, unknown> = {
    title,
    status,
    substatus,
    origin,
    requesterEmail,
    clientName,
    productKey,
    needFromTeam,
    directness,
    clientWebsiteUrls,
    description,
    clientPain,
    managementType,
    docsCountApprox,
    docsLengthApprox,
    integrationName,
    integrationDocsUrl,
    avgMonthlyConversations,
    pipedriveDealUrl,
    createdBy: { connect: { id: userId } },
  };

  if (assigneeId) {
    taskData.assignee = { connect: { id: assigneeId } };
  }
  if (presentationDate !== undefined) {
    taskData.presentationDate = presentationDate;
  }
  if (interlocutorRole !== null) {
    taskData.interlocutorRole = interlocutorRole;
  }
  if (integrationType !== undefined) {
    taskData.integrationType = integrationType;
  }
  if (integrationOwner !== undefined) {
    taskData.integrationOwner = integrationOwner;
  }

  if (deliverables.length > 0) {
    taskData.deliverables = {
      create: deliverables.map((deliverable) => {
        const payload: Record<string, unknown> = {
          title: deliverable.title,
          url: deliverable.url,
          type: deliverable.type,
        };

        const ownerId = deliverable.addedById ?? userId;
        if (ownerId) {
          payload.addedBy = { connect: { id: ownerId } };
        }

        return payload;
      }),
    };
  }

  const created = await mapacheTask.create({
    data: taskData,
    select: taskSelect,
  });

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

