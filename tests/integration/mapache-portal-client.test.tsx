import "../unit/setup-module-alias";
import "../unit/setup";
import "./setup-dom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";

import { LanguageProvider } from "@/app/LanguageProvider";
import MapachePortalClient from "@/app/mapache-portal/MapachePortalClient";
import { MapachePortalQueryProvider } from "@/app/mapache-portal/context/query-client";
import type {
  MapachePortalBootstrap,
  SerializedMapacheTask,
  SerializedStatus,
} from "@/app/mapache-portal/bootstrap-types";

import type { SimpleElement } from "../mocks/simple-dom";

import { __resetSession, __setSession } from "next-auth/react";
import { __resetRouterState, __setRouterState } from "next/navigation";

type FetchCall = {
  url: string;
  method: string;
  body?: unknown;
};

const ISO_NOW = new Date("2024-12-15T12:00:00Z").toISOString();

const STATUSES: SerializedStatus[] = [
  {
    id: "status-pending",
    key: "PENDING",
    label: "Pendiente",
    order: 0,
    createdAt: ISO_NOW,
    updatedAt: ISO_NOW,
  },
  {
    id: "status-in-progress",
    key: "IN_PROGRESS",
    label: "En progreso",
    order: 1,
    createdAt: ISO_NOW,
    updatedAt: ISO_NOW,
  },
  {
    id: "status-done",
    key: "DONE",
    label: "Completada",
    order: 2,
    createdAt: ISO_NOW,
    updatedAt: ISO_NOW,
  },
];

function createTask(params: {
  id: string;
  title: string;
  statusKey: "PENDING" | "IN_PROGRESS" | "DONE";
  substatus?: "BACKLOG" | "WAITING_CLIENT" | "BLOCKED";
  assigneeId?: string | null;
  assigneeEmail?: string | null;
  assigneeName?: string | null;
  requesterEmail: string;
  clientName: string;
  productKey: string;
  presentationDate?: string | null;
}): SerializedMapacheTask {
  const status = STATUSES.find((entry) => entry.key === params.statusKey);
  if (!status) {
    throw new Error(`Unknown status ${params.statusKey}`);
  }
  const assigneeId = params.assigneeId ?? null;
  const assignee = assigneeId
    ? {
        id: assigneeId,
        email: params.assigneeEmail ?? null,
        name: params.assigneeName ?? null,
      }
    : null;

  return {
    id: params.id,
    title: params.title,
    description: null,
    statusId: status.id,
    status: {
      id: status.id,
      key: status.key,
      label: status.label,
      order: status.order,
    },
    substatus: params.substatus ?? "BACKLOG",
    createdAt: ISO_NOW,
    updatedAt: ISO_NOW,
    createdById: "creator-1",
    assigneeId,
    assignee,
    requesterEmail: params.requesterEmail,
    clientName: params.clientName,
    presentationDate: params.presentationDate ?? null,
    interlocutorRole: null,
    clientWebsiteUrls: [],
    directness: "DIRECT",
    pipedriveDealUrl: null,
    needFromTeam: "OTHER",
    clientPain: null,
    productKey: params.productKey,
    managementType: null,
    docsCountApprox: null,
    docsLengthApprox: null,
    integrationType: null,
    integrationOwner: null,
    integrationName: null,
    integrationDocsUrl: null,
    avgMonthlyConversations: null,
    origin: "MANUAL",
    deliverables: [],
  };
}

function buildBootstrap(tasks: SerializedMapacheTask[]): MapachePortalBootstrap {
  return {
    statuses: STATUSES,
    tasks,
    tasksMeta: {
      total: tasks.length,
      count: tasks.length,
      hasMore: false,
      limit: Math.max(tasks.length, 25),
      nextCursor: null,
    },
    filterPresets: [],
    boards: [
      {
        id: "board-1",
        name: "Seguimiento semanal",
        order: 0,
        columns: [
          {
            id: "board-col-1",
            title: "Pendientes",
            order: 0,
            filters: { statuses: ["PENDING"] },
          },
          {
            id: "board-col-2",
            title: "En progreso",
            order: 1,
            filters: { statuses: ["IN_PROGRESS"] },
          },
        ],
      },
    ],
    team: [
      { id: "mapache-1", name: "Mapache Uno", email: "mapache1@example.com" },
      { id: "mapache-2", name: "Mapache Dos", email: "mapache2@example.com" },
    ],
  };
}

function renderPortal(bootstrap: MapachePortalBootstrap) {
  return render(
    <LanguageProvider>
      <MapachePortalQueryProvider>
        <MapachePortalClient initialBootstrap={bootstrap} />
      </MapachePortalQueryProvider>
    </LanguageProvider>,
  );
}

function extractRequestInfo(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1] | undefined,
) {
  if (typeof input === "string") {
    return { url: input, method: init?.method ?? "GET" };
  }
  if (input instanceof URL) {
    return { url: input.toString(), method: init?.method ?? "GET" };
  }
  if (input instanceof Request) {
    return { url: input.url, method: init?.method ?? input.method ?? "GET" };
  }

  const candidate = input as { url?: unknown; method?: unknown };
  const url = typeof candidate.url === "string" ? candidate.url : String(candidate.url ?? "");
  const method = typeof candidate.method === "string" ? candidate.method : init?.method ?? "GET";
  return { url, method };
}

beforeEach(() => {
  __setSession({
    data: {
      user: {
        id: "mapache-1",
        email: "mapache1@example.com",
        name: "Mapache Uno",
      },
      expires: new Date("2025-01-01T00:00:00Z").toISOString(),
    },
    status: "authenticated",
  });
  __setRouterState({
    pathname: "/mapache-portal/generator",
    searchParams: new URLSearchParams(),
  });
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  mock.restoreAll();
  __resetSession();
  __resetRouterState();
  window.localStorage.clear();
});

const statusByKey = new Map(STATUSES.map((status) => [status.key, status]));

describe("MapachePortalClient integration", () => {
  it("permite crear una nueva tarea desde el formulario", async () => {
    const bootstrap = buildBootstrap([
      createTask({
        id: "task-1",
        title: "Seguimiento inicial",
        statusKey: "PENDING",
        requesterEmail: "cliente@example.com",
        clientName: "Cliente Uno",
        productKey: "Producto Alfa",
      }),
    ]);

    const fetchCalls: FetchCall[] = [];

    mock.method(globalThis, "fetch", async (
      input: Parameters<typeof fetch>[0],
      init?: Parameters<typeof fetch>[1],
    ) => {
      const { url, method } = extractRequestInfo(input, init);

      if (url === "/api/mapache/tasks" && method === "POST") {
        const rawBody = init?.body ? String(init.body) : "{}";
        const payload = JSON.parse(rawBody) as Record<string, unknown>;
        fetchCalls.push({ url, method, body: payload });

        const status = statusByKey.get(String(payload.status));
        if (!status) {
          throw new Error("Missing status in mock response");
        }

        const responsePayload = {
          id: "task-created",
          title: payload.title,
          description: payload.description ?? null,
          status: {
            id: status.id,
            key: status.key,
            label: status.label,
            order: status.order,
          },
          statusId: status.id,
          substatus: payload.substatus,
          createdAt: ISO_NOW,
          updatedAt: ISO_NOW,
          createdById: "creator-2",
          assigneeId: payload.assigneeId ?? null,
          assignee:
            payload.assigneeId && typeof payload.assigneeId === "string"
              ? {
                  id: String(payload.assigneeId),
                  email: "mapache2@example.com",
                  name: "Mapache Dos",
                }
              : null,
          requesterEmail: payload.requesterEmail,
          clientName: payload.clientName,
          presentationDate: payload.presentationDate ?? null,
          interlocutorRole: payload.interlocutorRole ?? null,
          clientWebsiteUrls: payload.clientWebsiteUrls ?? [],
          directness: payload.directness ?? "DIRECT",
          pipedriveDealUrl: payload.pipedriveDealUrl ?? null,
          needFromTeam: payload.needFromTeam ?? "OTHER",
          clientPain: payload.clientPain ?? null,
          productKey: payload.productKey,
          managementType: payload.managementType ?? null,
          docsCountApprox: payload.docsCountApprox ?? null,
          docsLengthApprox: payload.docsLengthApprox ?? null,
          integrationType: payload.integrationType ?? null,
          integrationOwner: payload.integrationOwner ?? null,
          integrationName: payload.integrationName ?? null,
          integrationDocsUrl: payload.integrationDocsUrl ?? null,
          avgMonthlyConversations: payload.avgMonthlyConversations ?? null,
          origin: payload.origin ?? "MANUAL",
          deliverables: [],
        };

        return new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.startsWith("/api/mapache/tasks") && method === "GET") {
        fetchCalls.push({ url, method });
        return new Response(
          JSON.stringify({
            tasks: bootstrap.tasks,
            meta: bootstrap.tasksMeta,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/mapache/filters") {
        fetchCalls.push({ url, method });
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    renderPortal(bootstrap);

    const user = userEvent.setup();

    const addButton = await screen.findByRole("button", { name: "Agregar tarea" });
    await user.click(addButton);

    const formModal = await screen.findByRole("dialog", { name: "Agregar tarea" });

    await act(async () => {
      const api = (window as unknown as Record<string, any>).__MAPACHE_PORTAL_TEST;
      api?.setFormField?.("title", "Nueva propuesta");
      api?.setFormField?.("clientName", "Cliente Dos");
      api?.setFormField?.("productKey", "Producto Beta");
      api?.setFormField?.("requesterEmail", "contacto@cliente.com");
      api?.setCurrentStep?.(1);
    });

    await act(async () => {
      const api = (window as unknown as Record<string, any>).__MAPACHE_PORTAL_TEST;
      api?.setCurrentStep?.(2);
      api?.setCurrentStep?.(3);
    });

    await user.click(within(formModal).getByRole("button", { name: "Guardar tarea" }));

    await waitFor(() => {
      const createCall = fetchCalls.find(
        (call) => call.url === "/api/mapache/tasks" && call.method === "POST",
      );
      assert.ok(createCall, "expected a POST request to create the task");
      const body = createCall.body as Record<string, unknown>;
      assert.equal(body.title, "Nueva propuesta");
      assert.equal(body.clientName, "Cliente Dos");
      assert.equal(body.productKey, "Producto Beta");
      assert.equal(body.requesterEmail, "contacto@cliente.com");
      assert.equal(body.status, "PENDING");
      assert.equal(body.substatus, "BACKLOG");
      assert.deepEqual(body.clientWebsiteUrls, []);
    });

    await screen.findByText("Tarea creada");

    await waitFor(() => {
      const modal = screen.queryByRole("dialog", { name: "Agregar tarea" });
      assert.equal(modal, null);
    });
  });

  it("organiza las tareas en el tablero y permite reasignarlas", async () => {
    const tasks = [
      createTask({
        id: "task-1",
        title: "Presentación semanal",
        statusKey: "PENDING",
        requesterEmail: "cliente@example.com",
        clientName: "Cliente Uno",
        productKey: "Producto Alfa",
        assigneeId: "mapache-1",
        assigneeEmail: "mapache1@example.com",
        assigneeName: "Mapache Uno",
      }),
      createTask({
        id: "task-2",
        title: "Seguimiento comercial",
        statusKey: "IN_PROGRESS",
        requesterEmail: "otra@example.com",
        clientName: "Cliente Dos",
        productKey: "Producto Beta",
        assigneeId: "mapache-2",
        assigneeEmail: "mapache2@example.com",
        assigneeName: "Mapache Dos",
      }),
    ];
    const bootstrap = buildBootstrap(tasks);

    const fetchCalls: FetchCall[] = [];

    mock.method(globalThis, "fetch", async (
      input: Parameters<typeof fetch>[0],
      init?: Parameters<typeof fetch>[1],
    ) => {
      const { url, method } = extractRequestInfo(input, init);

      if (url === "/api/mapache/tasks" && method === "PATCH") {
        const payload = JSON.parse(init?.body ? String(init.body) : "{}") as Record<
          string,
          unknown
        >;
        fetchCalls.push({ url, method, body: payload });

        const firstTask = tasks[0];
        if (!firstTask) {
          throw new Error("Missing initial task for reassignment mock");
        }
        const statusKeyFromTask = firstTask.status?.key;
        if (!statusKeyFromTask) {
          throw new Error("Missing status key in initial task");
        }
        const status = statusByKey.get(statusKeyFromTask);
        if (!status) {
          throw new Error("Missing status in reassignment mock response");
        }
        return new Response(
          JSON.stringify({
            ...firstTask,
            status: {
              id: status.id,
              key: status.key,
              label: status.label,
              order: status.order,
            },
            statusId: status.id,
            assigneeId: payload.assigneeId,
            assignee:
              payload.assigneeId && typeof payload.assigneeId === "string"
                ? {
                    id: String(payload.assigneeId),
                    email: "mapache2@example.com",
                    name: "Mapache Dos",
                  }
                : null,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url.startsWith("/api/mapache/tasks") && method === "GET") {
        fetchCalls.push({ url, method });
        return new Response(
          JSON.stringify({
            tasks,
            meta: bootstrap.tasksMeta,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/mapache/filters") {
        fetchCalls.push({ url, method });
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    renderPortal(bootstrap);

    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Tablero" }));

    const pendingColumnTitle = await screen.findByText("Pendientes");
    const pendingColumnSection = pendingColumnTitle.closest("section");
    assert.ok(pendingColumnSection, "pending column should render as a section");

    await waitFor(() => {
      within(pendingColumnSection!).getByText("Presentación semanal");
    });

    const progressColumnTitle = await screen.findByText("En progreso");
    const progressColumnSection = progressColumnTitle.closest("section");
    assert.ok(progressColumnSection, "progress column should render as a section");
    await waitFor(() => {
      within(progressColumnSection!).getByText("Seguimiento comercial");
    });

    const openButton = within(pendingColumnSection!).getByRole("button", {
      name: "Abrir detalles de Presentación semanal",
    });
    await user.click(openButton);

    const taskModal = await screen.findByRole("dialog", { name: /Presentación semanal/ });

    await user.selectOptions(
      within(taskModal).getByLabelText("Asignado a"),
      "mapache-2",
    );

    await act(async () => {
      const api = (window as unknown as Record<string, any>).__MAPACHE_PORTAL_TEST;
      api?.setSelectedTaskField?.("assigneeId", "mapache-2");
    });

    await user.click(within(taskModal).getByRole("button", { name: "Guardar tarea" }));

    await screen.findByText("Tarea actualizada");

    await waitFor(() => {
      const patchCall = fetchCalls.find(
        (call) => call.url === "/api/mapache/tasks" && call.method === "PATCH",
      );
      assert.ok(patchCall, "expected a PATCH request when saving the task");
      const body = patchCall.body as Record<string, unknown>;
      assert.equal(body.id, "task-1");
      assert.equal(body.assigneeId, "mapache-2");
    });

    await waitFor(() => {
      const modal = screen.queryByRole("dialog", { name: /Presentación semanal/ });
      assert.equal(modal, null);
    });
  });

});
