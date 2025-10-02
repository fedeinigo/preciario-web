import test from "node:test";
import assert from "node:assert/strict";

import { normalizeSearchText } from "../../src/lib/normalize-search-text";

test("normalizeSearchText removes diacritics and lowercases", () => {
  const original = "Árbol Crédito MÉXICO";
  const normalized = normalizeSearchText(original);
  assert.equal(normalized, "arbol credito mexico");
});

test("normalizeSearchText enables accent-insensitive filtering for credito", () => {
  const options = ["Crédito empresarial", "Préstamo personal"];
  const query = "Credito";
  const normalizedQuery = normalizeSearchText(query);
  const results = options.filter((opt) => normalizeSearchText(opt).includes(normalizedQuery));

  assert.deepEqual(results, ["Crédito empresarial"]);
});

test("normalizeSearchText enables accent-insensitive filtering for mexico", () => {
  const countries = ["México", "Argentina", "Perú"];
  const query = "Mexico";
  const normalizedQuery = normalizeSearchText(query);
  const results = countries.filter((country) =>
    normalizeSearchText(country).includes(normalizedQuery)
  );

  assert.deepEqual(results, ["México"]);
});
