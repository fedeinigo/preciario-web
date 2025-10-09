import type { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  MAPACHE_TEAM,
  mapacheStatusWithMetaSelect,
  taskSelect,
} from "@/app/api/mapache/tasks/access";
import {
  loadStatusKeys,
  serializePreset,
} from "@/app/api/mapache/filters/utils";
import { createStatusIndex } from "./types";
import { normalizeBoardFromDb } from "@/app/api/mapache/boards/utils";
import { makeTaskCursor } from "./task-pagination";
import type {
  MapachePortalBootstrap,
  SerializedFilterPreset,
  SerializedMapacheTask,
  SerializedMapacheTaskDeliverable,
  SerializedStatus,
} from "./bootstrap-types";

const DEFAULT_TASK_LIMIT = 400;

type MapacheTaskRaw = Prisma.MapacheTaskGetPayload<{
  select: typeof taskSelect;
}>;

type MapacheStatusRaw = Prisma.MapacheStatusGetPayload<{
  select: typeof mapacheStatusWithMetaSelect;
}>;

function serializeStatus(status: MapacheStatusRaw): SerializedStatus {
  return {
    id: String(status.id),
    key: status.key.trim().toUpperCase(),
    label: status.label.trim(),
    order: status.order,
    createdAt: status.createdAt.toISOString(),
    updatedAt: status.updatedAt.toISOString(),
  };
}

function serializeTask(task: MapacheTaskRaw): SerializedMapacheTask {
  const status = task.status
    ? {
        id: String(task.status.id),
        key: task.status.key.trim().toUpperCase(),
        label: task.status.label.trim(),
        order: task.status.order,
      }
    : null;

  const deliverables: SerializedMapacheTaskDeliverable[] = task.deliverables.map(
    (deliverable) => ({
      id: deliverable.id,
      type: deliverable.type,
      title: deliverable.title,
      url: deliverable.url,
      addedById: deliverable.addedById,
      createdAt: deliverable.createdAt?.toISOString(),
    }),
  );

  return {
    id: String(task.id),
    title: task.title,
    description: task.description ?? null,
    statusId: task.statusId ?? null,
    status,
    substatus: task.substatus,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    createdById: String(task.createdById),
    assigneeId: task.assigneeId ?? null,
    assignee: task.assignee
      ? {
          id: String(task.assignee.id),
          name: task.assignee.name,
          email: task.assignee.email,
        }
      : null,
    requesterEmail: task.requesterEmail,
    clientName: task.clientName,
    presentationDate: task.presentationDate
      ? task.presentationDate.toISOString()
      : null,
    interlocutorRole: task.interlocutorRole ?? null,
    clientWebsiteUrls: Array.isArray(task.clientWebsiteUrls)
      ? task.clientWebsiteUrls
      : [],
    directness: (task.directness as SerializedMapacheTask["directness"]) ?? null,
    pipedriveDealUrl: task.pipedriveDealUrl ?? null,
    needFromTeam:
      (task.needFromTeam as SerializedMapacheTask["needFromTeam"]) ?? null,
    clientPain: task.clientPain ?? null,
    productKey: task.productKey ?? null,
    managementType: task.managementType ?? null,
    docsCountApprox: task.docsCountApprox ?? null,
    docsLengthApprox: task.docsLengthApprox ?? null,
    integrationType:
      (task.integrationType as SerializedMapacheTask["integrationType"]) ?? null,
    integrationOwner:
      (task.integrationOwner as SerializedMapacheTask["integrationOwner"]) ?? null,
    integrationName: task.integrationName ?? null,
    integrationDocsUrl: task.integrationDocsUrl ?? null,
    avgMonthlyConversations: task.avgMonthlyConversations ?? null,
    origin: (task.origin as SerializedMapacheTask["origin"]) ?? null,
    deliverables,
  };
}

export async function loadMapachePortalBootstrap(options?: {
  taskLimit?: number;
}): Promise<MapachePortalBootstrap> {
  const taskLimit = options?.taskLimit ?? DEFAULT_TASK_LIMIT;

  const statusesRaw = await prisma.mapacheStatus.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: mapacheStatusWithMetaSelect,
  });

  const statuses = statusesRaw.map(serializeStatus);

  const statusIndex = createStatusIndex(
    statuses.map(({ id, key, label, order }) => ({
      id,
      key,
      label,
      order,
    })),
  );

  const statusKeys = await loadStatusKeys();

  const tasksRaw = await prisma.mapacheTask.findMany({
    orderBy: { createdAt: "desc" },
    take: taskLimit,
    select: taskSelect,
  });
  const totalTasks = await prisma.mapacheTask.count();
  const presetsRaw = await prisma.mapacheFilterPreset.findMany({
    orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  const boardsRaw = await prisma.mapacheBoard.findMany({
    orderBy: { position: "asc" },
    include: { columns: { orderBy: { position: "asc" } } },
  });
  const team = await prisma.user.findMany({
    where: { team: MAPACHE_TEAM },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, name: true, email: true },
  });

  const tasks = tasksRaw.map(serializeTask);

  const filterPresets: SerializedFilterPreset[] = presetsRaw.map((preset) =>
    serializePreset(
      {
        id: preset.id,
        name: preset.name,
        filters: preset.filters,
        createdAt: preset.createdAt,
        updatedAt: preset.updatedAt,
        createdBy: preset.createdBy,
      },
      statusKeys,
    ),
  );

  const boards = boardsRaw.map((board) =>
    normalizeBoardFromDb(board, statusIndex),
  );

  const lastTask = tasks[tasks.length - 1] ?? null;
  const nextCursor =
    tasks.length === taskLimit && lastTask
      ? makeTaskCursor(lastTask.createdAt, lastTask.id)
      : null;

  return {
    statuses,
    tasks,
    tasksMeta: {
      total: totalTasks,
      count: tasks.length,
      hasMore: totalTasks > tasks.length,
      limit: taskLimit,
      nextCursor,
    },
    filterPresets,
    boards,
    team: team.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    })),
  };
}
