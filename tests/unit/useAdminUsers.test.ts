import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { __testUtils } from "../../src/app/components/features/proposals/hooks/useAdminUsers";

type FetchType = typeof fetch;

const originalFetch: FetchType | undefined = globalThis.fetch;

beforeEach(() => {
  __testUtils.reset();
});

afterEach(() => {
  __testUtils.reset();
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
});

test("useAdminUsers shares cached response across consumers", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return {
      ok: true,
      json: async () => [
        {
          id: "u1",
          email: "demo@example.com",
          name: "Demo",
          image: null,
          role: "superadmin",
          team: "Team A",
        },
      ],
    } as unknown as Response;
  }) as FetchType;

  const [first, second] = await Promise.all([
    __testUtils.ensure(),
    __testUtils.ensure(),
  ]);

  assert.strictEqual(calls, 1);
  assert.strictEqual(first, second);
  assert.strictEqual(first[0]?.email, "demo@example.com");

  const third = await __testUtils.ensure();
  assert.strictEqual(third, first);
  assert.strictEqual(calls, 1);
});
