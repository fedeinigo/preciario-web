import test from "node:test";
import assert from "node:assert/strict";

import type { ApiSession } from "../../src/app/api/_utils/require-auth";
import { createAuthGuards } from "../../src/app/api/_utils/require-auth";

const session: ApiSession = {
  user: { id: "user-99", role: "usuario", team: null },
  expires: new Date().toISOString(),
};

test("flujo completo: sesión inválida bloquea lectura y escritura", async () => {
  let secure = true;
  const guards = createAuthGuards({
    authFn: async () => session,
    isFeatureEnabledFn: () => secure,
  });

  const { response } = await guards.requireApiSession();
  assert.equal(response, undefined);

  const forbidden = guards.ensureSessionRole(session, ["admin", "superadmin"]);
  assert.equal(forbidden?.status, 403);

  secure = false;
  const relaxed = guards.ensureSessionRole(session, ["admin"], 451);
  assert.equal(relaxed, null);
});
