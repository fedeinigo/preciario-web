import type { MapacheTask } from "../types";
import type { MapacheUser } from "../user-types";

export function getTaskAssigneeId(task: MapacheTask): string | null {
  if (typeof task.assigneeId === "string") {
    const trimmed = task.assigneeId.trim();
    return trimmed ? trimmed : null;
  }
  return null;
}

export function getTaskAssigneeEmail(task: MapacheTask): string | null {
  const email = task.assignee?.email;
  if (typeof email === "string") {
    const trimmed = email.trim().toLowerCase();
    return trimmed ? trimmed : null;
  }
  return null;
}

export function formatTaskAssigneeLabel(task: MapacheTask): string {
  const name = task.assignee?.name;
  if (typeof name === "string") {
    const trimmed = name.trim();
    if (trimmed) return trimmed;
  }
  const email = task.assignee?.email;
  if (typeof email === "string") {
    const trimmed = email.trim();
    if (trimmed) return trimmed;
  }
  return getTaskAssigneeId(task) ?? "";
}

export function formatAssigneeOption(user: MapacheUser) {
  const name = user.name?.trim();
  return name && name.length > 0 ? name : user.email;
}
