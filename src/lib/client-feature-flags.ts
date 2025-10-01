// src/lib/client-feature-flags.ts
// Helper to read client-side feature flags backed by NEXT_PUBLIC_* env vars.

export type ClientFeatureFlag = "accessibilitySkeletons";

function readBooleanFlag(value: string | undefined) {
  return value === "1" || value === "true";
}

export function isClientFeatureEnabled(flag: ClientFeatureFlag): boolean {
  if (flag === "accessibilitySkeletons") {
    return readBooleanFlag(process.env.NEXT_PUBLIC_FEATURE_ACCESSIBILITY_SKELETONS);
  }
  return false;
}
