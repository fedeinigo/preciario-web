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

import { ensureMapacheAccess, parseStatus, taskSelect } from "./access";

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

  const tasks = await prisma.mapacheTask.findMany({
    orderBy: { createdAt: "desc" },
    select: taskSelect,
  });

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

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const status =
    body.status === undefined || body.status === null
      ? "PENDING"
      : parseStatus(body.status);

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

  const data: Prisma.MapacheTaskUpdateInput = {};

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

  const updated = await prisma.mapacheTask.update({
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

  await prisma.mapacheTask.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

