import "./setup-module-alias";
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

import type { ApiSession } from "@/app/api/_utils/require-auth";
import * as requireAuth from "@/app/api/_utils/require-auth";
import * as mapacheAccess from "@/app/api/mapache/tasks/access";
import prisma from "@/lib/prisma";
import { PATCH } from "@/app/api/mapache/tasks/route";

describe("PATCH /api/mapache/tasks", () => {
  it("updates client, product and integration fields", async () => {
    const session: ApiSession = {
      user: { id: "user-123", role: "usuario", team: "Mapaches" },
      expires: new Date().toISOString(),
    };

    mock.method(requireAuth, "requireApiSession", async () => ({
      session,
      response: undefined,
    }));

    mock.method(
      mapacheAccess,
      "resolveStatusFromPayload",
      async () => ({
        response: null,
        status: {
          id: "status-in-progress",
          key: "IN_PROGRESS",
          label: "In Progress",
          order: 1,
        },
      }),
    );

    const updateCalls: Array<{
      where: { id: string };
      data: Record<string, unknown>;
    }> = [];
    const findUniqueCalls: unknown[] = [];

    const updatedTask = {
      id: "task-1",
      title: "New title",
      description: "Updated description",
      status: "IN_PROGRESS",
      substatus: "BLOCKED",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
      createdById: "creator-1",
      assigneeId: "assignee-1",
      assignee: { id: "assignee-1", name: "Mapache", email: "mapache@example.com" },
      requesterEmail: "user@example.com",
      clientName: "New Client",
      presentationDate: new Date("2024-07-01T00:00:00Z"),
      interlocutorRole: "CTO",
      clientWebsiteUrls: ["https://client.example.com"],
      directness: "PARTNER",
      pipedriveDealUrl: "https://pipedrive.example.com/deal",
      needFromTeam: "QUOTE",
      clientPain: "We need help",
      productKey: "New Product",
      managementType: "Agency",
      docsCountApprox: 5,
      docsLengthApprox: "2 pages",
      integrationType: "REST",
      integrationOwner: "OWN",
      integrationName: "CRM",
      integrationDocsUrl: "https://docs.example.com/",
      avgMonthlyConversations: 123,
      origin: "GOOGLE_FORM",
      deliverables: [],
    };

    const prismaAny = prisma as unknown as {
      $transaction: typeof prisma.$transaction;
    };
    const originalTransaction = prismaAny.$transaction;
    let transactionCalls = 0;
    prismaAny.$transaction = (async (
      callback: (tx: unknown) => Promise<unknown>,
    ) =>
      callback({
        mapacheTask: {
          update: async (args: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => {
            updateCalls.push(args);
            return {};
          },
          findUnique: async (args: unknown) => {
            findUniqueCalls.push(args);
            return updatedTask;
          },
        },
        mapacheTaskDeliverable: {
          findMany: async () => [],
          deleteMany: async () => ({ count: 0 }),
          create: async () => ({}),
        },
      }).finally(() => {
        transactionCalls += 1;
      })) as typeof prisma.$transaction;

    try {
      const response = await PATCH(
        new Request("https://example.com/api/mapache/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: "task-1",
            title: "  New title  ",
            description: "Updated description",
            status: "IN_PROGRESS",
            substatus: "BLOCKED",
            origin: "GOOGLE_FORM",
            requesterEmail: " user@example.com ",
            clientName: "  New Client  ",
            productKey: " New Product ",
            needFromTeam: "QUOTE",
            directness: "PARTNER",
            assigneeId: " assignee-1 ",
            presentationDate: "2024-07-01",
            interlocutorRole: " CTO ",
            clientWebsiteUrls: ["https://client.example.com"],
            pipedriveDealUrl: "https://pipedrive.example.com/deal",
            clientPain: " We need help ",
            managementType: " Agency ",
            docsCountApprox: "5",
            docsLengthApprox: " 2 pages ",
            integrationType: "REST",
            integrationOwner: "OWN",
            integrationName: " CRM ",
            integrationDocsUrl: "https://docs.example.com",
            avgMonthlyConversations: "123",
          }),
        }),
      );

      assert.equal(response.status, 200);
      const payload = (await response.json()) as typeof updatedTask;
      assert.equal(payload.clientName, "New Client");
      assert.equal(payload.productKey, "New Product");
      assert.equal(payload.integrationType, "REST");
      assert.equal(payload.integrationOwner, "OWN");
      assert.equal(payload.integrationName, "CRM");
      assert.equal(payload.avgMonthlyConversations, 123);

      assert.equal(transactionCalls, 1);
      assert.equal(updateCalls.length, 1);
      const updateArgs = updateCalls[0];
      assert.deepEqual(updateArgs.where, { id: "task-1" });
      const updatedData = updateArgs.data;
      assert.equal(updatedData.clientName, "New Client");
      assert.equal(updatedData.productKey, "New Product");
      assert.equal(updatedData.requesterEmail, "user@example.com");
      assert.equal(updatedData.needFromTeam, "QUOTE");
      assert.equal(updatedData.directness, "PARTNER");
      assert.equal(updatedData.substatus, "BLOCKED");
      assert.equal(updatedData.origin, "GOOGLE_FORM");
      assert.deepEqual(updatedData.clientWebsiteUrls, ["https://client.example.com/"]);
      assert.equal(updatedData.pipedriveDealUrl, "https://pipedrive.example.com/deal");
      assert.equal(updatedData.clientPain, "We need help");
      assert.equal(updatedData.managementType, "Agency");
      assert.equal(updatedData.docsCountApprox, 5);
      assert.equal(updatedData.docsLengthApprox, "2 pages");
      assert.equal(updatedData.integrationType, "REST");
      assert.equal(updatedData.integrationOwner, "OWN");
      assert.equal(updatedData.integrationName, "CRM");
      assert.equal(updatedData.integrationDocsUrl, "https://docs.example.com/");
      assert.equal(updatedData.avgMonthlyConversations, 123);
      assert(updatedData.presentationDate instanceof Date);
      assert.equal(
        (updatedData.presentationDate as Date).toISOString(),
        new Date("2024-07-01T00:00:00.000Z").toISOString(),
      );
      assert.equal(updatedData.interlocutorRole, "CTO");
      assert.deepEqual(updatedData.assignee, { connect: { id: "assignee-1" } });

      assert.equal(findUniqueCalls.length, 1);
    } finally {
      prismaAny.$transaction = originalTransaction;
      mock.restoreAll();
    }
  });

  it("replaces deliverables by deleting removed ones and creating the new records", async () => {
    const session: ApiSession = {
      user: { id: "user-123", role: "usuario", team: "Mapaches" },
      expires: new Date().toISOString(),
    };

    mock.method(requireAuth, "requireApiSession", async () => ({
      session,
      response: undefined,
    }));

    mock.method(
      mapacheAccess,
      "resolveStatusFromPayload",
      async () => ({
        response: null,
        status: {
          id: "status-in-progress",
          key: "IN_PROGRESS",
          label: "In Progress",
          order: 1,
        },
      }),
    );

    const deleteCalls: Array<{ where: { id: { in: string[] } } }> = [];
    const createCalls: Array<{ data: Record<string, unknown> }> = [];
    const findManyCalls: unknown[] = [];
    const taskUpdateCalls: unknown[] = [];

    const updatedTask = {
      id: "task-1",
      title: "New title",
      description: "Updated description",
      status: "IN_PROGRESS",
      substatus: "BLOCKED",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
      createdById: "creator-1",
      assigneeId: null,
      assignee: null,
      requesterEmail: "user@example.com",
      clientName: "New Client",
      presentationDate: null,
      interlocutorRole: null,
      clientWebsiteUrls: [],
      directness: "DIRECT",
      pipedriveDealUrl: null,
      needFromTeam: "QUOTE",
      clientPain: null,
      productKey: "New Product",
      managementType: null,
      docsCountApprox: null,
      docsLengthApprox: null,
      integrationType: null,
      integrationOwner: null,
      integrationName: null,
      integrationDocsUrl: null,
      avgMonthlyConversations: null,
      origin: "MANUAL",
      deliverables: [
        {
          id: "d2",
          type: "QUOTE",
          title: "Quote",
          url: "https://example.com/quote",
          addedById: null,
          createdAt: new Date("2024-01-03T00:00:00Z"),
        },
        {
          id: "d3",
          type: "SCOPE",
          title: "Implementation Plan",
          url: "https://example.com/plan",
          addedById: "owner-789",
          createdAt: new Date("2024-01-04T00:00:00Z"),
        },
        {
          id: "d4",
          type: "OTHER",
          title: "Checklist",
          url: "https://example.com/checklist",
          addedById: "user-123",
          createdAt: new Date("2024-01-05T00:00:00Z"),
        },
      ],
    };

    const prismaStub = prisma as unknown as {
      $transaction: typeof prisma.$transaction;
    };
    const originalTx = prismaStub.$transaction;
    prismaStub.$transaction = (async (
      callback: (tx: unknown) => Promise<unknown>,
    ) =>
      callback({
        mapacheTask: {
          update: async (...args: unknown[]) => {
            taskUpdateCalls.push(args);
            return {};
          },
          findUnique: async () => updatedTask,
        },
        mapacheTaskDeliverable: {
          findMany: async (args: unknown) => {
            findManyCalls.push(args);
            return [
              {
                id: "d1",
                type: "SCOPE",
                title: "Old Scope",
                url: "https://example.com/scope",
                addedById: "user-999",
              },
              {
                id: "d2",
                type: "QUOTE",
                title: "Quote",
                url: "https://example.com/quote",
                addedById: null,
              },
            ];
          },
          deleteMany: async (args: { where: { id: { in: string[] } } }) => {
            deleteCalls.push(args);
            return { count: args.where.id.in.length };
          },
          create: async (args: { data: Record<string, unknown> }) => {
            createCalls.push(args);
            return {};
          },
        },
      })) as typeof prisma.$transaction;

    try {
      const response = await PATCH(
        new Request("https://example.com/api/mapache/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: "task-1",
            deliverables: [
              {
                title: "Quote",
                url: "https://example.com/quote",
                type: "QUOTE",
              },
              {
                title: "Implementation Plan",
                url: "https://example.com/plan",
                type: "SCOPE",
                addedById: "owner-789",
              },
              {
                title: "Checklist",
                url: "https://example.com/checklist",
                type: "OTHER",
              },
            ],
          }),
        }),
      );

      assert.equal(response.status, 200);
      const payload = (await response.json()) as typeof updatedTask;
      assert.equal(payload.deliverables.length, 3);

      assert.equal(findManyCalls.length, 1);
      const findManyArgs = findManyCalls[0] as {
        where: { taskId: string };
        select: Record<string, boolean>;
      };
      assert.deepEqual(findManyArgs, {
        where: { taskId: "task-1" },
        select: {
          id: true,
          title: true,
          url: true,
          type: true,
          addedById: true,
        },
      });
      assert.equal(deleteCalls.length, 1);
      assert.deepEqual(deleteCalls[0]?.where, { id: { in: ["d1"] } });

      assert.equal(createCalls.length, 2);
      const [firstCreate, secondCreate] = createCalls;
      assert.deepEqual(firstCreate.data, {
        taskId: "task-1",
        title: "Implementation Plan",
        url: "https://example.com/plan",
        type: "SCOPE",
        addedById: "owner-789",
      });
      assert.deepEqual(secondCreate.data, {
        taskId: "task-1",
        title: "Checklist",
        url: "https://example.com/checklist",
        type: "OTHER",
        addedById: "user-123",
      });
      assert.equal(taskUpdateCalls.length, 0);
    } finally {
      prismaStub.$transaction = originalTx;
      mock.restoreAll();
    }
  });
});
