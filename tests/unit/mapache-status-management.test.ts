import assert from "node:assert/strict";
import test from "node:test";

import {
  didColumnStatusesChange,
  ensureValidFilterStatus,
  ensureValidTaskStatus,
  normalizeColumnStatuses,
  removeStatus,
  sortStatuses,
  upsertStatus,
} from "@/app/mapache-portal/status-management";
import { createStatusIndex } from "@/app/mapache-portal/types";

function makeStatus(
  id: string,
  key: string,
  label: string,
  order: number,
) {
  return { id, key, label, order };
}

test("upsertStatus adds new entries keeping order", () => {
  const initial = [
    makeStatus("1", "PENDING", "Pending", 1),
    makeStatus("2", "DONE", "Done", 3),
  ];
  const added = makeStatus("3", "IN_PROGRESS", "In progress", 2);

  const result = upsertStatus(initial, added);
  assert.deepEqual(result.map((status) => status.key), [
    "PENDING",
    "IN_PROGRESS",
    "DONE",
  ]);
  assert.deepEqual(result.map((status) => status.order), [1, 2, 3]);
});

test("upsertStatus replaces entries and syncs filter fallback", () => {
  const initial = [
    makeStatus("1", "PENDING", "Pending", 0),
    makeStatus("2", "DONE", "Done", 1),
  ];
  const updated = makeStatus("2", "COMPLETE", "Complete", 5);

  const result = upsertStatus(initial, updated);
  assert.deepEqual(result.map((status) => status.key), [
    "PENDING",
    "COMPLETE",
  ]);

  const index = createStatusIndex(result);
  const filter = ensureValidFilterStatus("DONE", index);
  assert.equal(filter, "PENDING");
});

test("removeStatus updates forms and board columns", () => {
  const initial = [
    makeStatus("1", "PENDING", "Pending", 0),
    makeStatus("2", "IN_PROGRESS", "In progress", 1),
  ];

  const filtered = removeStatus(initial, "2");
  assert.deepEqual(filtered.map((status) => status.key), ["PENDING"]);

  const index = createStatusIndex(filtered);
  const formStatus = ensureValidTaskStatus("IN_PROGRESS", index);
  assert.equal(formStatus, "PENDING");

  const column = normalizeColumnStatuses([
    "IN_PROGRESS",
    "DONE",
  ], index);
  assert.deepEqual(column, ["PENDING"]);
  assert.equal(didColumnStatusesChange(["IN_PROGRESS"], column), true);
});

test("normalizeColumnStatuses keeps valid multi-status columns", () => {
  const initial = [
    makeStatus("1", "PENDING", "Pending", 0),
    makeStatus("2", "IN_PROGRESS", "In progress", 1),
    makeStatus("3", "DONE", "Done", 2),
  ];

  const index = createStatusIndex(initial);
  const normalized = normalizeColumnStatuses(
    ["PENDING", "IN_PROGRESS", "DONE"],
    index,
  );

  assert.deepEqual(normalized, ["PENDING", "IN_PROGRESS", "DONE"]);
  assert.equal(
    didColumnStatusesChange(["PENDING", "IN_PROGRESS", "DONE"], normalized),
    false,
  );
});

test("sortStatuses trims and orders entries", () => {
  const unordered = [
    makeStatus("1", " done ", " Done ", 3),
    makeStatus("2", " pending", "Pending", 1),
  ];
  const result = sortStatuses(unordered);
  assert.deepEqual(result.map((status) => status.key), [
    "PENDING",
    "DONE",
  ]);
  assert.deepEqual(result.map((status) => status.label), [
    "Pending",
    "Done",
  ]);
});
