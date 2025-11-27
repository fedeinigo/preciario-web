export type MapachePortalSection = "generator" | "pipedrive" | "goals";

export const MAPACHE_PORTAL_DEFAULT_SECTION: MapachePortalSection = "generator";

export const MAPACHE_PORTAL_SECTION_CHANGED_EVENT =
  "mapache-portal:section-changed";

export const MAPACHE_PORTAL_READY_EVENT = "mapache-portal:ready";

export function isMapachePortalSection(
  value: unknown,
): value is MapachePortalSection {
  return value === "generator" || value === "pipedrive" || value === "goals";
}
