export const locales = ["es", "en", "pt"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export const storageKey = "preciario:lang";
