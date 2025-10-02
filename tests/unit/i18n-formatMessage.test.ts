import test from "node:test";
import assert from "node:assert/strict";

import { defaultLocale, type Locale } from "../../src/lib/i18n/config";
import { formatMessage } from "../../src/lib/i18n/formatMessage";
import { getMessage } from "../../src/lib/i18n/messages";

const key = "admin.teams.card.membersCount";

function translate(locale: Locale, count: number) {
  const template = getMessage(locale, key, defaultLocale);
  return formatMessage(template, locale, { count });
}

test("teams members count is singularized in Spanish", () => {
  assert.equal(translate("es", 1), "1 integrante");
  assert.equal(translate("es", 2), "2 integrantes");
});

test("teams members count is pluralized in English", () => {
  assert.equal(translate("en", 1), "1 member");
  assert.equal(translate("en", 2), "2 members");
});
