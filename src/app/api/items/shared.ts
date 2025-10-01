import { z } from "zod";
import type { LanguageCode, Prisma } from "@prisma/client";

import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";

export const localeSchema = z.enum(locales);

export const translationSchema = z.object({
  locale: localeSchema,
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
});

export const itemPayloadSchema = z.object({
  sku: z.string().trim().optional(),
  category: z.string().trim().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  unitPrice: z.number().nonnegative().optional(),
  devHours: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
  translations: z.array(translationSchema).optional(),
});

export type NormalizedTranslation = {
  locale: Locale;
  name: string;
  category: string;
  description: string;
};

export const ITEM_SELECT = {
  id: true,
  sku: true,
  category: true,
  name: true,
  description: true,
  unitPrice: true,
  devHours: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  translations: {
    select: {
      locale: true,
      name: true,
      category: true,
      description: true,
    },
  },
} satisfies Prisma.ItemSelect;

export type ItemWithTranslations = Prisma.ItemGetPayload<{ select: typeof ITEM_SELECT }>;

export function getLocaleFromRequest(request: Request): Locale {
  return resolveLocale(new URL(request.url).searchParams.get("locale"));
}

export function normalizeTranslations(
  input: {
    translations?: Array<z.infer<typeof translationSchema>>;
    name?: string;
    category?: string;
    description?: string;
  },
  current?: NormalizedTranslation[]
): NormalizedTranslation[] {
  const map = new Map<Locale, { name?: string; category?: string; description?: string }>();

  current?.forEach((entry) => {
    map.set(entry.locale, {
      name: entry.name,
      category: entry.category,
      description: entry.description,
    });
  });

  input.translations?.forEach((entry) => {
    const locale = entry.locale as Locale;
    map.set(locale, {
      name: entry.name.trim(),
      category: entry.category.trim(),
      description: entry.description?.trim() ?? "",
    });
  });

  const baseDefault = map.get(defaultLocale) ?? {};
  const fallbackName = input.name?.trim() ?? baseDefault.name?.trim();
  const fallbackCategory = input.category?.trim() ?? baseDefault.category?.trim();
  const fallbackDescription =
    input.description?.trim() ?? baseDefault.description?.trim() ?? "";

  const resolvedDefaultName = (fallbackName ?? "").trim();
  const resolvedDefaultCategory = (fallbackCategory ?? "").trim() || "general";
  const resolvedDefaultDescription = fallbackDescription;

  if (!resolvedDefaultName || !resolvedDefaultCategory) {
    throw new Error("Debe especificarse nombre y categoria para el idioma base.");
  }

  map.set(defaultLocale, {
    name: resolvedDefaultName,
    category: resolvedDefaultCategory,
    description: resolvedDefaultDescription,
  });

  const normalized: NormalizedTranslation[] = [];
  for (const locale of locales) {
    const entry = map.get(locale as Locale);
    const name = entry?.name?.trim() || resolvedDefaultName;
    const category = entry?.category?.trim() || resolvedDefaultCategory;
    const description = entry?.description?.trim() ?? resolvedDefaultDescription;

    normalized.push({
      locale: locale as Locale,
      name,
      category,
      description,
    });
  }

  return normalized;
}

export function mapItemToResponse(item: ItemWithTranslations, locale: Locale) {
  const base = {
    name: item.name,
    category: item.category,
    description: item.description ?? "",
  };

  const translations = buildTranslationRecord(base, item.translations);
  const activeTranslation = translations[locale] ?? translations[defaultLocale];

  return {
    id: item.id,
    sku: item.sku,
    name: activeTranslation.name,
    category: activeTranslation.category,
    description: activeTranslation.description,
    unitPrice: Number(item.unitPrice),
    devHours: item.devHours,
    active: item.active,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    translations,
  };
}

function resolveLocale(value: string | null): Locale {
  if (!value) return defaultLocale;
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

function buildTranslationRecord(
  base: { name: string; category: string; description: string },
  translations: ItemWithTranslations["translations"]
) {
  const record = Object.fromEntries(
    locales.map((code) => [code, { ...base }])
  ) as Record<Locale, {
    name: string;
    category: string;
    description: string;
  }>;

  translations.forEach((translation) => {
    const locale = translation.locale as Locale;
    record[locale] = {
      name: translation.name,
      category: translation.category,
      description: translation.description,
    };
  });

  return record;
}
