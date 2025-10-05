import "./setup-module-alias";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createStatusIndex,
  normalizeMapacheTask,
  type MapacheStatusDetails,
} from "@/app/mapache-portal/types";
import {
  normalizeBoardConfig,
  normalizeBoardList,
} from "@/app/mapache-portal/board-types";
import {
  createDefaultBoardColumns,
  parseColumnsPayload,
} from "@/app/api/mapache/boards/utils";
import { NextResponse } from "next/server";

type StatusInput = Pick<MapacheStatusDetails, "id" | "key" | "label" | "order">;

function buildStatusIndex() {
  const statuses: StatusInput[] = [
    { id: "status-1", key: "backlog", label: "Backlog", order: 2 },
    { id: "status-2", key: "in_progress", label: "In Progress", order: 1 },
    { id: "status-3", key: "done", label: "Done", order: 3 },
  ];

  return createStatusIndex(statuses);
}

describe("normalizeMapacheTask", () => {
  it("maps status identifiers using the provided index", () => {
    const statusIndex = buildStatusIndex();

    const normalized = normalizeMapacheTask(
      {
        id: "task-1",
        title: "Prepare proposal",
        statusId: "status-2",
        status: {
          id: "status-2",
          key: "in_progress",
          label: "In Progress",
          order: 1,
        },
        substatus: "BACKLOG",
        origin: "GOOGLE_FORM",
        deliverables: [],
        clientWebsiteUrls: [],
      },
      statusIndex,
    );

    assert(normalized);
    assert.equal(normalized.status, "IN_PROGRESS");
    assert.equal(normalized.statusId, "status-2");
    assert.deepEqual(normalized.statusDetails, {
      id: "status-2",
      key: "IN_PROGRESS",
      label: "In Progress",
      order: 1,
    });
  });
});

describe("normalizeBoardConfig", () => {
  it("sorts columns and keeps only statuses from the index", () => {
    const statusIndex = buildStatusIndex();

    const config = normalizeBoardConfig(
      {
        id: "board-1",
        name: "Sales",
        order: 2,
        columns: [
          {
            id: "column-b",
            title: "In progress",
            order: 2,
            filters: { statuses: [" in_progress ", "DONE", "IN_PROGRESS"] },
          },
          {
            id: "column-a",
            title: "Backlog",
            order: 1,
            filters: { statuses: ["backlog", "BACKLOG"] },
          },
        ],
      },
      statusIndex,
    );

    assert(config);
    assert.deepEqual(
      config.columns.map((column) => ({ id: column.id, statuses: column.filters.statuses })),
      [
        { id: "column-a", statuses: ["BACKLOG"] },
        { id: "column-b", statuses: ["IN_PROGRESS", "DONE"] },
      ],
    );
  });

  it("returns null when columns reference unknown statuses", () => {
    const statusIndex = buildStatusIndex();

    const result = normalizeBoardConfig(
      {
        id: "board-1",
        name: "Invalid",
        order: 1,
        columns: [
          {
            id: "column-a",
            title: "Unknown",
            order: 1,
            filters: { statuses: ["not_real"] },
          },
        ],
      },
      statusIndex,
    );

    assert.equal(result, null);
  });
});

describe("normalizeBoardList", () => {
  it("filters invalid boards and orders the result", () => {
    const statusIndex = buildStatusIndex();

    const boards = normalizeBoardList(
      [
        {
          id: "board-2",
          name: "Later",
          order: 2,
          columns: [
            {
              id: "column-a",
              title: "Backlog",
              order: 2,
              filters: { statuses: ["BACKLOG"] },
            },
          ],
        },
        {
          id: "board-invalid",
          name: "Broken",
          order: 3,
          columns: [
            {
              id: "column-x",
              title: "Unknown",
              order: 1,
              filters: { statuses: ["??"] },
            },
          ],
        },
        {
          id: "board-1",
          name: "First",
          order: 1,
          columns: [
            {
              id: "column-b",
              title: "In progress",
              order: 2,
              filters: { statuses: ["in_progress"] },
            },
            {
              id: "column-a",
              title: "Backlog",
              order: 1,
              filters: { statuses: ["backlog"] },
            },
          ],
        },
      ],
      statusIndex,
    );

    assert.deepEqual(boards.map((board) => board.id), ["board-1", "board-2"]);
    assert.deepEqual(boards[0].columns.map((column) => column.filters.statuses), [["BACKLOG"], ["IN_PROGRESS"]]);
  });
});

describe("parseColumnsPayload", () => {
  it("rejects unknown statuses", async () => {
    const statusIndex = buildStatusIndex();

    const response = parseColumnsPayload(
      [
        {
          title: "New column",
          filters: { statuses: ["unknown"] },
        },
      ],
      statusIndex,
    );

    assert(response instanceof NextResponse);
    assert.equal(response.status, 400);
    const payload = (await response.json()) as { error: string };
    assert.equal(
      payload.error,
      "columns[0].filters.statuses must include at least one status",
    );
  });

  it("normalizes statuses and titles", () => {
    const statusIndex = buildStatusIndex();

    const payload = parseColumnsPayload(
      [
        {
          id: "col-1",
          title: "  In progress  ",
          filters: { statuses: ["in_progress", "DONE", "in_progress", ""] },
        },
      ],
      statusIndex,
    );

    assert(!(payload instanceof NextResponse));
    assert.deepEqual(payload, [
      {
        id: "col-1",
        title: "In progress",
        filters: { statuses: ["IN_PROGRESS", "DONE"] },
      },
    ]);
  });
});

describe("createDefaultBoardColumns", () => {
  it("uses the ordered statuses to build default columns", () => {
    const statusIndex = buildStatusIndex();

    const defaults = createDefaultBoardColumns(statusIndex);

    assert.deepEqual(defaults, [
      { title: "In Progress", filters: { statuses: ["IN_PROGRESS"] } },
      { title: "Backlog", filters: { statuses: ["BACKLOG"] } },
      { title: "Done", filters: { statuses: ["DONE"] } },
    ]);
  });
});
