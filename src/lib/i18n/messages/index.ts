import type { Locale } from "../config";
import type { DeepRecord } from "./types";
import esMessages from "./es";

type MessagesLoader = () => Promise<DeepRecord>;

function normalizeDict(locale: Locale, dict: DeepRecord): DeepRecord {
  if (Object.prototype.hasOwnProperty.call(dict, locale)) {
    const candidate = dict[locale];
    if (isRecord(candidate)) {
      return candidate;
    }
  }
  return dict;
}

const cache: Partial<Record<Locale, DeepRecord>> = {
  es: normalizeDict("es", esMessages),
};

const loaders: Record<Locale, MessagesLoader> = {
  es: async () => esMessages,
  en: () => import("./en").then((mod) => mod.default),
  pt: () => import("./pt").then((mod) => mod.default),
};

function isRecord(value: unknown): value is DeepRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function loadMessages(locale: Locale): Promise<DeepRecord> {
  if (cache[locale]) {
    return cache[locale]!;
  }
  const loader = loaders[locale];
  if (!loader) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  const dict = await loader();
  const normalized = normalizeDict(locale, dict);
  cache[locale] = normalized;
  return normalized;
}

export function setMessages(locale: Locale, messages: DeepRecord) {
  cache[locale] = messages;
}

export function getCachedMessages(locale: Locale): DeepRecord | undefined {
  return cache[locale];
}

export function extractMessage(dict: DeepRecord | undefined, key: string): string | undefined {
  if (!dict) return undefined;
  const path = key.split(".").filter(Boolean);
  let current: string | DeepRecord | undefined = dict;

  for (const segment of path) {
    if (!current) return undefined;

    if (isRecord(current)) {
      current = current[segment];
    } else {
      return segment === path[path.length - 1] ? current : undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

export function clearMessagesCache() {
  (Object.keys(cache) as Locale[]).forEach((locale) => {
    delete cache[locale];
  });
}

export type { DeepRecord } from "./types";
