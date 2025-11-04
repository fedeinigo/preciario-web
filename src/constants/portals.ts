// src/constants/portals.ts

export type PortalAccessId = "direct" | "mapache" | "partner" | "marketing";

export const ORDERED_PORTAL_ACCESS: readonly PortalAccessId[] = [
  "direct",
  "mapache",
  "partner",
  "marketing",
];

export const MUTABLE_PORTAL_ACCESS = [
  "mapache",
  "partner",
  "marketing",
] as const satisfies readonly PortalAccessId[];

export function includeDefaultPortal(
  portals: Iterable<PortalAccessId> | null | undefined,
): PortalAccessId[] {
  const allowed = new Set<PortalAccessId>(["direct"]);
  if (portals) {
    for (const portal of portals) {
      if (ORDERED_PORTAL_ACCESS.includes(portal)) {
        allowed.add(portal);
      }
    }
  }
  return ORDERED_PORTAL_ACCESS.filter((key) => allowed.has(key));
}

export function normalizePortalInput(value: unknown): PortalAccessId[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const deduped = new Set<PortalAccessId>();
  for (const item of value) {
    if (typeof item !== "string") {
      return null;
    }
    const normalized = item.trim().toLowerCase() as PortalAccessId;
    if (!ORDERED_PORTAL_ACCESS.includes(normalized)) {
      return null;
    }
    deduped.add(normalized);
  }
  return Array.from(deduped);
}
