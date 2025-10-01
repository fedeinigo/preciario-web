// src/lib/feature-flags.ts
// Centraliza los flags de características para habilitar mejoras sin romper compatibilidad.
// Todos los flags deben tener fallback seguro (false) para mantener el comportamiento actual.

export type FeatureFlag =
  | "secureApiRoutes"
  | "proposalsPagination"
  | "strictOauthLinking"
  | "appShellRsc"
  | "proposalsClientRefactor"
  | "accessibilitySkeletons";
=======
  | "strictOauthLinking";

function readBooleanFlag(value: string | undefined): boolean {
  return value === "1" || value === "true";
}

export const featureFlags: Record<FeatureFlag, boolean> = {
  secureApiRoutes: readBooleanFlag(process.env.FEATURE_SECURE_API_ROUTES),
  proposalsPagination: readBooleanFlag(process.env.FEATURE_PROPOSALS_PAGINATION),
  strictOauthLinking: readBooleanFlag(process.env.FEATURE_STRICT_OAUTH_LINKING),
  appShellRsc: readBooleanFlag(process.env.FEATURE_APP_SHELL_RSC),
  proposalsClientRefactor: readBooleanFlag(process.env.FEATURE_PROPOSALS_CLIENT_REFACTOR),
  accessibilitySkeletons: readBooleanFlag(process.env.FEATURE_ACCESSIBILITY_SKELETONS),
=======
};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
