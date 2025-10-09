export const MAPACHE_TASK_CURSOR_SEPARATOR = "::";

export function makeTaskCursor(createdAt: string, id: string): string {
  return `${createdAt}${MAPACHE_TASK_CURSOR_SEPARATOR}${id}`;
}

export function parseTaskCursor(
  value: string | null | undefined,
): { createdAt: string; id: string } | null {
  if (!value) {
    return null;
  }
  const [createdAt, id] = value.split(MAPACHE_TASK_CURSOR_SEPARATOR);
  if (!createdAt || !id) {
    return null;
  }
  return { createdAt, id };
}
