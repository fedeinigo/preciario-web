import test from "node:test";
import assert from "node:assert/strict";

import { locales } from "../../src/lib/i18n/config";
import {
  type DeepRecord,
  clearMessagesCache,
  extractMessage,
  loadMessages,
} from "../../src/lib/i18n/messages";

function collectKeys(dict: DeepRecord, prefix: string[] = []): string[] {
  return Object.entries(dict).flatMap(([key, value]) => {
    const path = [...prefix, key];
    if (typeof value === "string") {
      return [path.join(".")];
    }
    return collectKeys(value, path);
  });
}

function diffKeys(a: Set<string>, b: Set<string>): string[] {
  const result: string[] = [];
  for (const key of a) {
    if (!b.has(key)) {
      result.push(key);
    }
  }
  return result;
}

test("loadMessages returns usable dictionaries for every locale", async () => {
  clearMessagesCache();
  for (const locale of locales) {
    const dict = await loadMessages(locale);
    const label = extractMessage(dict, "common.language.label");
    assert.equal(
      typeof label,
      "string",
      `Dictionary for ${locale} should resolve translation strings.`
    );
  }
});

test("all locale dictionaries keep the same key set", async () => {
  clearMessagesCache();
  const dictionaries = await Promise.all(locales.map((locale) => loadMessages(locale)));
  const keySets = dictionaries.map((dict) => new Set(collectKeys(dict)));
  const baseKeys = keySets[0];

  for (let index = 1; index < locales.length; index += 1) {
    const locale = locales[index];
    const keys = keySets[index];
    const missingKeys = diffKeys(baseKeys, keys);
    const extraKeys = diffKeys(keys, baseKeys);

    assert.equal(
      missingKeys.length,
      0,
      `Missing translations for ${locale}: ${missingKeys.slice(0, 20).join(", ")}`
    );
    assert.equal(
      extraKeys.length,
      0,
      `Unexpected extra keys in ${locale}: ${extraKeys.slice(0, 20).join(", ")}`
    );
  }
});
