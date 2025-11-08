import test from "node:test";
import assert from "node:assert/strict";

import { type Locale } from "../../src/lib/i18n/config";
import { formatMessage } from "../../src/lib/i18n/formatMessage";
import { extractMessage, loadMessages } from "../../src/lib/i18n/messages";

const key = "admin.teams.card.membersCount";

async function translate(locale: Locale, count: number) {
  const dict = await loadMessages(locale);
  const template = extractMessage(dict, key) ?? key;
  return formatMessage(template, locale, { count });
}

test("teams members count is singularized in Spanish", async () => {
  assert.equal(await translate("es", 1), "1 integrante");
  assert.equal(await translate("es", 2), "2 integrantes");
});

test("teams members count is pluralized in English", async () => {
  assert.equal(await translate("en", 1), "1 member");
  assert.equal(await translate("en", 2), "2 members");
});
