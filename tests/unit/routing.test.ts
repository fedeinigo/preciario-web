import "./setup-paths";
import test from "node:test";
import assert from "node:assert/strict";

import { isMapachePath, stripLocaleFromPath } from "../../src/lib/routing";

test("stripLocaleFromPath keeps non-localized pathnames unchanged", () => {
  assert.equal(stripLocaleFromPath("/mapache-portal"), "/mapache-portal");
  assert.equal(stripLocaleFromPath("/"), "/");
});

test("stripLocaleFromPath removes locale prefixes", () => {
  assert.equal(stripLocaleFromPath("/es/mapache-portal"), "/mapache-portal");
  assert.equal(stripLocaleFromPath("/en/mapache-portal/reports"), "/mapache-portal/reports");
  assert.equal(stripLocaleFromPath("/pt"), "/");
});

test("stripLocaleFromPath handles missing pathnames", () => {
  assert.equal(stripLocaleFromPath(null), "");
});

test("isMapachePath detects mapache routes regardless of locale prefix", () => {
  assert.equal(isMapachePath("/mapache-portal"), true);
  assert.equal(isMapachePath("/es/mapache-portal"), true);
  assert.equal(isMapachePath("/pt/mapache-portal/settings"), true);
});

test("isMapachePath ignores non mapache routes", () => {
  assert.equal(isMapachePath("/dashboard"), false);
  assert.equal(isMapachePath("/en/dashboard"), false);
  assert.equal(isMapachePath(null), false);
});
