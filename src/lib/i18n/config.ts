export const locales = ["es", "en", "pt"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export const storageKey = "preciario:lang";
export const localeCookieName = "preciario_lang";

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  return locales.includes(value as Locale) ? (value as Locale) : null;
}
