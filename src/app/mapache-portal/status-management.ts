import type {
  MapacheStatusDetails,
  MapacheStatusIndex,
  MapacheTaskStatus,
} from "./types";
import type { StatusFilterValue } from "./filters";
import { createStatusIndex } from "./types";

function arraysShallowEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}

export function sortStatuses(
  statuses: Iterable<MapacheStatusDetails>,
): MapacheStatusDetails[] {
  return createStatusIndex(statuses).ordered;
}

export function upsertStatus(
  statuses: MapacheStatusDetails[],
  next: MapacheStatusDetails,
): MapacheStatusDetails[] {
  const filtered = statuses.filter((status) => status.id !== next.id);
  return sortStatuses([...filtered, next]);
}

export function removeStatus(
  statuses: MapacheStatusDetails[],
  statusId: string,
): MapacheStatusDetails[] {
  return sortStatuses(statuses.filter((status) => status.id !== statusId));
}

export function ensureValidTaskStatus(
  current: MapacheTaskStatus,
  statusIndex: MapacheStatusIndex,
): MapacheTaskStatus {
  if (statusIndex.byKey.has(current)) {
    return current;
  }
  const fallback = statusIndex.ordered[0]?.key;
  return fallback ?? current;
}

export function ensureValidFilterStatus(
  current: StatusFilterValue,
  statusIndex: MapacheStatusIndex,
): StatusFilterValue {
  if (current === "all") {
    return current;
  }
  if (statusIndex.byKey.has(current)) {
    return current;
  }
  const fallback = statusIndex.ordered[0]?.key;
  return fallback ?? "all";
}

export function normalizeColumnStatuses(
  statuses: MapacheTaskStatus[],
  statusIndex: MapacheStatusIndex,
): MapacheTaskStatus[] {
  if (statusIndex.ordered.length === 0) {
    return [];
  }
  const allowed = new Set(statusIndex.ordered.map((status) => status.key));
  const filtered = statuses.filter((status) => allowed.has(status));
  if (filtered.length > 0) {
    return filtered;
  }
  const fallback = statusIndex.ordered[0];
  return fallback ? [fallback.key] : [];
}

export function didColumnStatusesChange(
  prev: MapacheTaskStatus[],
  next: MapacheTaskStatus[],
): boolean {
  return !arraysShallowEqual(prev, next);
}
