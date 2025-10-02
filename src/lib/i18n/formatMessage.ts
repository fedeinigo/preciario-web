import { type Locale } from "./config";

type Replacements = Record<string, string | number>;

const ICU_PLURAL_PATTERN = /\{\s*(\w+)\s*,\s*plural\s*,/;
const PLURAL_OPTION_PATTERN = /([=\w]+)\s*\{([^{}]*)\}/g;

function formatPluralSegments(
  template: string,
  locale: Locale,
  replacements: Replacements
): string {
  let cursor = 0;
  let result = "";
  const pluralRules = new Intl.PluralRules(locale);

  while (cursor < template.length) {
    const start = template.indexOf("{", cursor);

    if (start === -1) {
      result += template.slice(cursor);
      break;
    }

    result += template.slice(cursor, start);

    const headMatch = template
      .slice(start)
      .match(/^\{\s*(\w+)\s*,\s*plural\s*,/);

    if (!headMatch) {
      result += "{";
      cursor = start + 1;
      continue;
    }

    const token = headMatch[1];
    let index = start + headMatch[0].length;
    let depth = 1;

    while (index < template.length && depth > 0) {
      const char = template[index];
      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
      }
      index += 1;
    }

    if (depth !== 0) {
      result += template.slice(start, index);
      cursor = index;
      continue;
    }

    const bodyEnd = index - 1;
    const body = template.slice(start + headMatch[0].length, bodyEnd);
    const value = replacements[token];

    if (typeof value !== "number") {
      result += template.slice(start, index);
      cursor = index;
      continue;
    }

    const options: Record<string, string> = {};
    let optionMatch: RegExpExecArray | null;
    while ((optionMatch = PLURAL_OPTION_PATTERN.exec(body))) {
      const [, selector, replacement] = optionMatch;
      options[selector.trim()] = replacement;
    }
    PLURAL_OPTION_PATTERN.lastIndex = 0;

    const exactKey = `=${value}`;
    const rule = pluralRules.select(value);
    const replacement =
      options[exactKey] ?? options[rule] ?? options.other ?? null;

    if (replacement === null) {
      result += template.slice(start, index);
    } else {
      result += replacement.replace(/#/g, String(value));
    }

    cursor = index;
  }

  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applySimpleTokens(
  template: string,
  replacements: Replacements
): string {
  return Object.entries(replacements).reduce((acc, [token, value]) => {
    const pattern = new RegExp(`\\{${escapeRegExp(token)}\\}`, "g");
    return acc.replace(pattern, String(value));
  }, template);
}

export function formatMessage(
  template: string,
  locale: Locale,
  replacements?: Replacements
): string {
  if (!replacements || Object.keys(replacements).length === 0) {
    return template;
  }

  let formatted = template;

  if (ICU_PLURAL_PATTERN.test(template)) {
    formatted = formatPluralSegments(formatted, locale, replacements);
  }

  return applySimpleTokens(formatted, replacements);
}
