import test from "node:test";
import assert from "node:assert/strict";

import { featureFlags, isFeatureEnabled } from "../../src/lib/feature-flags";

test("feature flags están apagados por defecto", () => {
  for (const [flag, value] of Object.entries(featureFlags)) {
    assert.equal(value, false, `El flag ${flag} debería iniciar en false`);
    assert.equal(isFeatureEnabled(flag as keyof typeof featureFlags), value);
  }
});
