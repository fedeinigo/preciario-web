export const MAPACHE_PORTAL_SECTIONS = ["generator", "pipedrive", "goals"] as const;

export type MapachePortalSection = (typeof MAPACHE_PORTAL_SECTIONS)[number];

export const MAPACHE_PORTAL_DEFAULT_SECTION: MapachePortalSection = "generator";

export const MAPACHE_PORTAL_READY_EVENT = "mapache-portal:ready";
export const MAPACHE_PORTAL_SECTION_CHANGED_EVENT = "mapache-portal:section-changed";

export function isMapachePortalSection(value: unknown): value is MapachePortalSection {
  return (
    typeof value === "string" &&
    MAPACHE_PORTAL_SECTIONS.includes(value as MapachePortalSection)
  );
}
