import test from "node:test";
import assert from "node:assert/strict";

import { featureFlags, isFeatureEnabled } from "../../src/lib/feature-flags";
import type { FeatureFlag } from "../../src/lib/feature-flags";

const expectedDefaults: Record<FeatureFlag, boolean> = {
  secureApiRoutes: true,
  proposalsPagination: false,
  strictOauthLinking: false,
  appShellRsc: false,
  proposalsClientRefactor: false,
  accessibilitySkeletons: false,
};

test("feature flags usan los defaults esperados", () => {
  (Object.keys(featureFlags) as FeatureFlag[]).forEach((flag) => {
    const expected = expectedDefaults[flag];
    assert.equal(featureFlags[flag], expected, `El flag ${flag} deberia iniciar en ${expected}`);
    assert.equal(isFeatureEnabled(flag), expected);
  });
});
