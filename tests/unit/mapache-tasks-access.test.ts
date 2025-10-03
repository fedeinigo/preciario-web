import "./setup-paths";
import test from "node:test";
import assert from "node:assert/strict";

import type { ApiSession } from "../../src/app/api/_utils/require-auth";
import { ensureMapacheAccess } from "../../src/app/api/mapache/tasks/access";

const baseSession: ApiSession = {
  user: { id: "user-1", role: "usuario", team: "Mapaches" },
  expires: new Date().toISOString(),
};

test("secureApiRoutes activo: sin sesión responde 401", () => {
  const { response } = ensureMapacheAccess(null);
  assert.equal(response?.status, 401);
});

test("secureApiRoutes activo: bloquea usuarios de otros equipos", () => {
  const session: ApiSession = {
    user: { id: "user-2", role: "usuario", team: "Ventas" },
    expires: new Date().toISOString(),
  };

  const { response } = ensureMapacheAccess(session);
  assert.equal(response?.status, 403);
});

test("secureApiRoutes activo: permite al equipo Mapaches", () => {
  const result = ensureMapacheAccess(baseSession);
  assert.equal(result.response, null);
  assert.equal(result.userId, baseSession.user?.id);
});

test("secureApiRoutes activo: admin accede sin importar el team", () => {
  const session: ApiSession = {
    user: { id: "user-4", role: "admin", team: null },
    expires: new Date().toISOString(),
  };

  const result = ensureMapacheAccess(session);
  assert.equal(result.response, null);
  assert.equal(result.userId, session.user?.id);
});

test("secureApiRoutes activo: superadmin accede sin importar el team", () => {
  const session: ApiSession = {
    user: { id: "user-3", role: "superadmin", team: null },
    expires: new Date().toISOString(),
  };

  const result = ensureMapacheAccess(session);
  assert.equal(result.response, null);
  assert.equal(result.userId, session.user?.id);
});
