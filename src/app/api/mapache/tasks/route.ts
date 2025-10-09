// src/app/api/mapache/tasks/route.ts
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";

import {
  ensureMapacheAccess,
  normalizeMapacheStatusKey,
  parseDeliverableType,
  parseDirectness,
  parseIntegrationOwner,
  parseIntegrationType,
  parseNeedFromTeam,
  parseOrigin,
  parseSubstatus,
  resolveStatusFromPayload,
  taskSelect,
} from "./access";
import type {
  MapacheDeliverableType,
  MapacheIntegrationOwner,
  MapacheIntegrationType,
} from "./access";
import {
  makeTaskCursor,
  parseTaskCursor,
} from "../../../mapache-portal/task-pagination";

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

function parseQueryParamList(values: string[]): string[] {
  if (values.length === 0) return [];
  const seen = new Set<string>();
  values.forEach((value) => {
    value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .forEach((item) => {
        if (!seen.has(item)) {
          seen.add(item);
        }
      });
  });
  return Array.from(seen);
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
  findUnique: (args: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
};

type MapacheTaskDeliverableDelegate = {
  findMany: (args: unknown) => Promise<unknown>;
  deleteMany: (args: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
};

const mapacheTask = (
  prisma as unknown as { mapacheTask: MapacheTaskDelegate }
).mapacheTask;

type MapacheTaskRow = Prisma.MapacheTaskGetPayload<{
  select: typeof taskSelect;
}>;

const DEFAULT_TASK_LIMIT = 200;
const MAX_TASK_LIMIT = 500;

export async function GET(request: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const { response: accessResponse, userId } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const limitParam = searchParams.get("limit");
  let limit = DEFAULT_TASK_LIMIT;
  if (limitParam) {
    const parsed = Number.parseInt(limitParam, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_TASK_LIMIT);
    }
  }

  const cursorParam = searchParams.get("cursor");
  const parsedCursor = parseTaskCursor(cursorParam);
  let cursorDate: Date | null = null;
  let cursorId: string | null = null;
  if (parsedCursor) {
    const date = new Date(parsedCursor.createdAt);
    if (!Number.isNaN(date.getTime())) {
      cursorDate = date;
      cursorId = parsedCursor.id;
    }
  }

  const filterConditions: Prisma.MapacheTaskWhereInput[] = [];

  const statusParam = searchParams.get("status");
  if (statusParam) {
    const normalizedStatus = normalizeMapacheStatusKey(statusParam);
    if (normalizedStatus && normalizedStatus !== "ALL") {
      filterConditions.push({
        status: { is: { key: normalizedStatus } },
      });
    }
  }

  const ownerParam = searchParams.get("owner");
  if (ownerParam) {
    const normalizedOwner = ownerParam.trim().toLowerCase();
    if (normalizedOwner === "mine" && userId) {
      filterConditions.push({ assigneeId: userId });
    } else if (normalizedOwner === "unassigned") {
      filterConditions.push({ assigneeId: null });
    }
  }

  const needsParam = parseQueryParamList(searchParams.getAll("needs"));
  if (needsParam.length > 0) {
    const allowedNeeds = needsParam
      .map((value) => parseNeedFromTeam(value))
      .filter(
        (value): value is NonNullable<ReturnType<typeof parseNeedFromTeam>> =>
          value !== null,
      );
    if (allowedNeeds.length > 0) {
      filterConditions.push({ needFromTeam: { in: allowedNeeds } });
    }
  }

  const directnessParam = parseQueryParamList(searchParams.getAll("directness"));
  if (directnessParam.length > 0) {
    const allowedDirectness = directnessParam
      .map((value) => parseDirectness(value))
      .filter(
        (value): value is NonNullable<ReturnType<typeof parseDirectness>> =>
          value !== null,
      );
    if (allowedDirectness.length > 0) {
      filterConditions.push({ directness: { in: allowedDirectness } });
    }
  }

  const integrationParam = parseQueryParamList(
    searchParams.getAll("integration"),
  );
  if (integrationParam.length > 0) {
    const allowedIntegration = integrationParam
      .map((value) => parseIntegrationType(value))
      .filter(
        (value): value is NonNullable<ReturnType<typeof parseIntegrationType>> =>
          value !== null,
      );
    if (allowedIntegration.length > 0) {
      filterConditions.push({ integrationType: { in: allowedIntegration } });
    }
  }

  const originsParam = parseQueryParamList(searchParams.getAll("origins"));
  if (originsParam.length > 0) {
    const allowedOrigins = originsParam
      .map((value) => parseOrigin(value))
      .filter(
        (value): value is NonNullable<ReturnType<typeof parseOrigin>> =>
          value !== null,
      );
    if (allowedOrigins.length > 0) {
      filterConditions.push({ origin: { in: allowedOrigins } });
    }
  }

  const assigneesParam = parseQueryParamList(searchParams.getAll("assignees"));
  if (assigneesParam.length > 0) {
    filterConditions.push({ assigneeId: { in: assigneesParam } });
  }

  const presentationFrom =
    searchParams.get("presentationFrom") ??
    searchParams.get("presentation_from");
  if (presentationFrom) {
    const fromDate = new Date(presentationFrom);
    if (!Number.isNaN(fromDate.getTime())) {
      filterConditions.push({
        presentationDate: { gte: fromDate },
      });
    }
  }

  const presentationTo =
    searchParams.get("presentationTo") ?? searchParams.get("presentation_to");
  if (presentationTo) {
    const toDate = new Date(presentationTo);
    if (!Number.isNaN(toDate.getTime())) {
      filterConditions.push({
        presentationDate: { lte: toDate },
      });
    }
  }

  const cursorConditions: Prisma.MapacheTaskWhereInput[] =
    cursorDate && cursorId
      ? [
          {
            OR: [
              { createdAt: { lt: cursorDate } },
              { createdAt: cursorDate, id: { lt: cursorId } },
            ],
          },
        ]
      : [];

  const where: Prisma.MapacheTaskWhereInput =
    filterConditions.length > 0 || cursorConditions.length > 0
      ? { AND: [...filterConditions, ...cursorConditions] }
      : {};

  const [taskResults, totalTasks] = await Promise.all([
    mapacheTask.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      select: taskSelect,
    }) as Promise<MapacheTaskRow[]>,
    prisma.mapacheTask.count({ where: filterConditions.length > 0 ? { AND: filterConditions } : undefined }),
  ]);

  const tasks = taskResults as unknown[];
  const lastTask = taskResults[taskResults.length - 1] ?? null;
  const hasMore = taskResults.length === limit;
  const nextCursor =
    hasMore && lastTask
      ? makeTaskCursor(lastTask.createdAt.toISOString(), lastTask.id)
      : null;

  return NextResponse.json({
    tasks,
    meta: {
      total: totalTasks,
      count: taskResults.length,
      limit,
      nextCursor,
    },
  });
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

  const statusResult = await resolveStatusFromPayload(body.status, {
    fallbackKey: "PENDING",
  });
  if (statusResult.response) return statusResult.response;
  const statusId = statusResult.status?.id;
  if (!statusId) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 },
    );
  }
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
    statusId,
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

  const { response: accessResponse, userId } = ensureMapacheAccess(session);
  if (accessResponse) return accessResponse;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Task id is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    const titleResult = parseStringWithDefault(body.title, "title");
    if (titleResult instanceof NextResponse) return titleResult;
    const title = titleResult;
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    data.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    if (typeof body.description === "string") {
      data.description = body.description;
    } else if (body.description == null) {
      data.description = null;
    } else {
      return NextResponse.json({ error: "Description must be a string" }, { status: 400 });
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    const statusResult = await resolveStatusFromPayload(body.status);
    if (statusResult.response) return statusResult.response;
    const status = statusResult.status;
    if (!status) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.statusId = status.id;
  }

  if (Object.prototype.hasOwnProperty.call(body, "substatus")) {
    const substatus = parseSubstatus(body.substatus);
    if (!substatus) {
      return NextResponse.json({ error: "Invalid substatus" }, { status: 400 });
    }
    data.substatus = substatus;
  }

  if (Object.prototype.hasOwnProperty.call(body, "origin")) {
    const origin = parseOrigin(body.origin);
    if (!origin) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 400 });
    }
    data.origin = origin;
  }

  if (Object.prototype.hasOwnProperty.call(body, "requesterEmail")) {
    const requesterEmailResult = parseEmail(
      body.requesterEmail,
      "requesterEmail",
    );
    if (requesterEmailResult instanceof NextResponse) return requesterEmailResult;
    const requesterEmail = requesterEmailResult;
    if (!requesterEmail) {
      return NextResponse.json(
        { error: "requesterEmail is required" },
        { status: 400 },
      );
    }
    data.requesterEmail = requesterEmail;
  }

  if (Object.prototype.hasOwnProperty.call(body, "clientName")) {
    const clientNameResult = parseStringWithDefault(body.clientName, "clientName");
    if (clientNameResult instanceof NextResponse) return clientNameResult;
    const clientName = clientNameResult;
    if (!clientName) {
      return NextResponse.json(
        { error: "clientName is required" },
        { status: 400 },
      );
    }
    data.clientName = clientName;
  }

  if (Object.prototype.hasOwnProperty.call(body, "productKey")) {
    const productKeyResult = parseStringWithDefault(body.productKey, "productKey");
    if (productKeyResult instanceof NextResponse) return productKeyResult;
    const productKey = productKeyResult;
    if (!productKey) {
      return NextResponse.json(
        { error: "productKey is required" },
        { status: 400 },
      );
    }
    data.productKey = productKey;
  }

  if (Object.prototype.hasOwnProperty.call(body, "needFromTeam")) {
    const needFromTeam = parseNeedFromTeam(body.needFromTeam);
    if (!needFromTeam) {
      return NextResponse.json({ error: "Invalid needFromTeam" }, { status: 400 });
    }
    data.needFromTeam = needFromTeam;
  }

  if (Object.prototype.hasOwnProperty.call(body, "directness")) {
    const directness = parseDirectness(body.directness);
    if (!directness) {
      return NextResponse.json({ error: "Invalid directness" }, { status: 400 });
    }
    data.directness = directness;
  }

  if (Object.prototype.hasOwnProperty.call(body, "assigneeId")) {
    const assigneeIdResult = parseOptionalId(body.assigneeId, "assigneeId");
    if (assigneeIdResult instanceof NextResponse) return assigneeIdResult;
    const assigneeId = assigneeIdResult;
    data.assignee = assigneeId
      ? { connect: { id: assigneeId } }
      : { disconnect: true };
  }

  if (Object.prototype.hasOwnProperty.call(body, "presentationDate")) {
    const presentationDateResult = parsePresentationDate(body.presentationDate);
    if (presentationDateResult instanceof NextResponse)
      return presentationDateResult;
    if (presentationDateResult !== undefined) {
      data.presentationDate = presentationDateResult;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "interlocutorRole")) {
    const interlocutorRoleResult = parseOptionalString(
      body.interlocutorRole,
      "interlocutorRole",
    );
    if (interlocutorRoleResult instanceof NextResponse) {
      return interlocutorRoleResult;
    }
    data.interlocutorRole = interlocutorRoleResult;
  }

  if (Object.prototype.hasOwnProperty.call(body, "clientWebsiteUrls")) {
    const clientWebsiteUrlsResult = parseUrlArray(
      body.clientWebsiteUrls,
      "clientWebsiteUrls",
    );
    if (clientWebsiteUrlsResult instanceof NextResponse) {
      return clientWebsiteUrlsResult;
    }
    data.clientWebsiteUrls = clientWebsiteUrlsResult;
  }

  if (Object.prototype.hasOwnProperty.call(body, "pipedriveDealUrl")) {
    const pipedriveDealUrlResult = parseUrl(
      body.pipedriveDealUrl,
      "pipedriveDealUrl",
    );
    if (pipedriveDealUrlResult instanceof NextResponse) {
      return pipedriveDealUrlResult;
    }
    data.pipedriveDealUrl = pipedriveDealUrlResult;
  }

  if (Object.prototype.hasOwnProperty.call(body, "clientPain")) {
    const clientPainResult = parseOptionalString(body.clientPain, "clientPain");
    if (clientPainResult instanceof NextResponse) return clientPainResult;
    data.clientPain = clientPainResult;
  }

  if (Object.prototype.hasOwnProperty.call(body, "managementType")) {
    const managementTypeResult = parseOptionalString(
      body.managementType,
      "managementType",
    );
    if (managementTypeResult instanceof NextResponse) {
      return managementTypeResult;
    }
    data.managementType = managementTypeResult;
  }

  if (Object.prototype.hasOwnProperty.call(body, "docsCountApprox")) {
    const docsCountApproxResult = parseInteger(
      body.docsCountApprox,
      "docsCountApprox",
    );
    if (docsCountApproxResult instanceof NextResponse) {
      return docsCountApproxResult;
    }
    data.docsCountApprox = docsCountApproxResult;
  }

  if (Object.prototype.hasOwnProperty.call(body, "docsLengthApprox")) {
    const docsLengthApproxResult = parseOptionalString(
      body.docsLengthApprox,
      "docsLengthApprox",
    );
    if (docsLengthApproxResult instanceof NextResponse) {
      return docsLengthApproxResult;
    }
    data.docsLengthApprox = docsLengthApproxResult;
  }

  if (Object.prototype.hasOwnProperty.call(body, "integrationType")) {
    if (body.integrationType === null) {
      data.integrationType = null;
    } else {
      const parsed = parseIntegrationType(body.integrationType);
      if (!parsed) {
        return NextResponse.json(
          { error: "Invalid integrationType" },
          { status: 400 },
        );
      }
      data.integrationType = parsed;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "integrationOwner")) {
    if (body.integrationOwner === null) {
      data.integrationOwner = null;
    } else {
      const parsed = parseIntegrationOwner(body.integrationOwner);
      if (!parsed) {
        return NextResponse.json(
          { error: "Invalid integrationOwner" },
          { status: 400 },
        );
      }
      data.integrationOwner = parsed;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "integrationName")) {
    const integrationNameResult = parseOptionalString(
      body.integrationName,
      "integrationName",
    );
    if (integrationNameResult instanceof NextResponse) {
      return integrationNameResult;
    }
    data.integrationName = integrationNameResult;
  }

  if (Object.prototype.hasOwnProperty.call(body, "integrationDocsUrl")) {
    const integrationDocsUrlResult = parseUrl(
      body.integrationDocsUrl,
      "integrationDocsUrl",
    );
    if (integrationDocsUrlResult instanceof NextResponse) {
      return integrationDocsUrlResult;
    }
    data.integrationDocsUrl = integrationDocsUrlResult;
  }

  if (Object.prototype.hasOwnProperty.call(body, "avgMonthlyConversations")) {
    const avgMonthlyConversationsResult = parseInteger(
      body.avgMonthlyConversations,
      "avgMonthlyConversations",
    );
    if (avgMonthlyConversationsResult instanceof NextResponse) {
      return avgMonthlyConversationsResult;
    }
    data.avgMonthlyConversations = avgMonthlyConversationsResult;
  }

  let deliverablesUpdate: DeliverableInput[] | undefined;
  if (Object.prototype.hasOwnProperty.call(body, "deliverables")) {
    const deliverablesResult = parseDeliverables(body.deliverables);
    if (deliverablesResult instanceof NextResponse) return deliverablesResult;
    deliverablesUpdate = deliverablesResult;
  }

  const hasTaskUpdates = Object.keys(data).length > 0;
  const hasDeliverablesUpdate = deliverablesUpdate !== undefined;

  if (!hasTaskUpdates && !hasDeliverablesUpdate) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const mapacheTaskTx = (
      tx as unknown as { mapacheTask: MapacheTaskDelegate }
    ).mapacheTask;
    const mapacheTaskDeliverableTx = (
      tx as unknown as { mapacheTaskDeliverable: MapacheTaskDeliverableDelegate }
    ).mapacheTaskDeliverable;

    if (hasDeliverablesUpdate) {
      const currentDeliverables = (await mapacheTaskDeliverableTx.findMany({
        where: { taskId: id },
        select: {
          id: true,
          title: true,
          url: true,
          type: true,
          addedById: true,
        },
      })) as Array<{
        id: string;
        title: string;
        url: string;
        type: MapacheDeliverableType;
        addedById: string | null;
      }>;

      const remainingByKey = new Map<
        string,
        Array<{ id: string; addedById: string | null }>
      >();
      for (const deliverable of currentDeliverables) {
        const key = `${deliverable.type}|${deliverable.title}|${deliverable.url}|${deliverable.addedById ?? ""}`;
        const entries = remainingByKey.get(key);
        if (entries) {
          entries.push({ id: deliverable.id, addedById: deliverable.addedById });
        } else {
          remainingByKey.set(key, [
            { id: deliverable.id, addedById: deliverable.addedById },
          ]);
        }
      }

      const toCreate: DeliverableInput[] = [];

      for (const deliverable of deliverablesUpdate ?? []) {
        const key = `${deliverable.type}|${deliverable.title}|${deliverable.url}|${deliverable.addedById ?? ""}`;
        const existing = remainingByKey.get(key);
        if (existing && existing.length > 0) {
          existing.shift();
        } else {
          toCreate.push(deliverable);
        }
      }

      const toDeleteIds: string[] = [];
      for (const entries of remainingByKey.values()) {
        for (const entry of entries) {
          toDeleteIds.push(entry.id);
        }
      }

      if (toDeleteIds.length > 0) {
        await mapacheTaskDeliverableTx.deleteMany({
          where: { id: { in: toDeleteIds } },
        });
      }

      for (const deliverable of toCreate) {
        const ownerId = deliverable.addedById ?? userId ?? null;
        const payload: Record<string, unknown> = {
          taskId: id,
          title: deliverable.title,
          url: deliverable.url,
          type: deliverable.type,
        };
        if (ownerId !== null) {
          payload.addedById = ownerId;
        }

        await mapacheTaskDeliverableTx.create({
          data: payload,
        });
      }
    }

    if (hasTaskUpdates) {
      await mapacheTaskTx.update({
        where: { id },
        data,
      });
    }

    return mapacheTaskTx.findUnique({
      where: { id },
      select: taskSelect,
    });
  });

  if (!updated) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

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

