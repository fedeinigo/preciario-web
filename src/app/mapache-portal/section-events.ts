export type MapachePortalSection = "tasks" | "metrics";

export const MAPACHE_PORTAL_DEFAULT_SECTION: MapachePortalSection = "tasks";

export const MAPACHE_PORTAL_NAVIGATE_EVENT = "mapache-portal:navigate";
export const MAPACHE_PORTAL_SECTION_CHANGED_EVENT =
  "mapache-portal:section-changed";

export function isMapachePortalSection(
  value: unknown,
): value is MapachePortalSection {
  return value === "tasks" || value === "metrics";
}
