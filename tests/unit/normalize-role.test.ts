import "./setup-paths";
import test from "node:test";
import assert from "node:assert/strict";

import { normalizeRole } from "../../src/app/api/admin/users/normalize-role";
import { Role as DbRole } from "@prisma/client";

test("normalizeRole mapea los strings esperados al enum de Prisma", () => {
  assert.equal(normalizeRole("superadmin"), DbRole.superadmin);
  assert.equal(normalizeRole("admin"), DbRole.admin);
  assert.equal(normalizeRole("lider"), DbRole.lider);
  assert.equal(normalizeRole("usuario"), DbRole.usuario);
  assert.equal(normalizeRole("comercial"), DbRole.usuario);
});

test("normalizeRole ignora mayúsculas y espacios extra", () => {
  assert.equal(normalizeRole("  ADMIN  "), DbRole.admin);
});

test("normalizeRole devuelve undefined para valores no válidos", () => {
  assert.equal(normalizeRole("unknown"), undefined);
  assert.equal(normalizeRole(null), undefined);
  assert.equal(normalizeRole(undefined), undefined);
});
