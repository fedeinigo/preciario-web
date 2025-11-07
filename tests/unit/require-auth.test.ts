import "./setup-paths";
import test from "node:test";
import assert from "node:assert/strict";

import type { ApiSession } from "../../src/app/api/_utils/require-auth";
import { createAuthGuards } from "../../src/app/api/_utils/require-auth";

const mockSession: ApiSession = {
  user: { id: "user-1", role: "admin", team: null },
  expires: new Date().toISOString(),
};

test("requireApiSession devuelve la sesión cuando el flag está apagado", async () => {
  const guards = createAuthGuards({
    authFn: async () => mockSession,
    isFeatureEnabledFn: () => false,
  });

  const result = await guards.requireApiSession();
  assert.equal(result.session, mockSession);
  assert.equal(result.response, undefined);
});

test("requireApiSession responde 401 cuando el flag está activo y no hay usuario", async () => {
  const guards = createAuthGuards({
    authFn: async () => null,
    isFeatureEnabledFn: () => true,
  });

  const result = await guards.requireApiSession();
  assert.equal(result.session, null);
  assert.equal(result.response?.status, 401);
});

test("ensureSessionRole permite roles válidos y bloquea los no autorizados", () => {
  const guards = createAuthGuards({
    authFn: async () => mockSession,
    isFeatureEnabledFn: () => true,
  });

  const ok = guards.ensureSessionRole(mockSession, ["admin"]);
  assert.equal(ok, null);

  const forbidden = guards.ensureSessionRole(mockSession, ["usuario"], 418);
  assert.equal(forbidden?.status, 418);
});
