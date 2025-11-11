// src/app/api/items/categories/route.ts
import { NextResponse } from "next/server";
import { Prisma, type LanguageCode } from "@prisma/client";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getLocaleFromRequest } from "../shared";

function toLanguageCode(locale: Locale): LanguageCode {
  return locale as LanguageCode;
}

function normalizeCategoryKey(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFKC")
    .toLowerCase();
}

function sanitizeCategoryLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export async function GET(request: Request) {
  const locale = getLocaleFromRequest(request);

  const storedCategoriesPromise = prisma.itemCategory.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });

  const translations = await prisma.itemTranslation.findMany({
    where: { locale: toLanguageCode(locale) },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });

  const storedCategories = await storedCategoriesPromise;
  const categorySet = new Set(storedCategories.map((row) => row.name));

  let categories = translations.map((row) => row.category);

  if (categories.length === 0 && locale !== defaultLocale) {
    const fallback = await prisma.itemTranslation.findMany({
      where: { locale: toLanguageCode(defaultLocale) },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    categories = fallback.map((row) => row.category);
  }

  if (categories.length === 0) {
    const rows = await prisma.item.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    categories = rows.map((row) => row.category);
  }

  for (const category of categories) {
    if (typeof category === "string" && category.trim()) {
      categorySet.add(category);
    }
  }

  const orderedCategories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));

  return NextResponse.json(orderedCategories);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const { from, to } = (await req.json()) as { from?: string; to?: string };
  const source = from?.trim();
  const target = to?.trim();

  if (!source || !target) {
    return NextResponse.json({ ok: false, error: "Parametros invalidos" }, { status: 400 });
  }

  const result = await prisma.$transaction([
    prisma.item.updateMany({
      where: { category: source },
      data: { category: target },
    }),
    prisma.itemTranslation.updateMany({
      where: { category: source },
      data: { category: target },
    }),
  ]);

  return NextResponse.json({ ok: true, updated: result[0].count });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }
  const { name, replaceWith } = (await req.json()) as { name?: string; replaceWith?: string };
  const source = name?.trim();
  if (!source) {
    return NextResponse.json({ ok: false, error: "Parametros invalidos" }, { status: 400 });
  }
  const target = replaceWith?.trim() || "general";

  const result = await prisma.$transaction([
    prisma.item.updateMany({
      where: { category: source },
      data: { category: target },
    }),
    prisma.itemTranslation.updateMany({
      where: { category: source },
      data: { category: target },
    }),
  ]);

  return NextResponse.json({ ok: true, moved: result[0].count, to: target });
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalido" }, { status: 400 });
  }

  const payload =
    body && typeof body === "object"
      ? (body as { name?: unknown })
      : ({} as { name?: unknown });
  const name = typeof payload.name === "string" ? payload.name : "";
  const sanitizedName = sanitizeCategoryLabel(name);

  if (!sanitizedName) {
    return NextResponse.json({ ok: false, error: "Parametros invalidos" }, { status: 400 });
  }

  const normalizedName = normalizeCategoryKey(sanitizedName);

  const [stored, translations, items] = await Promise.all([
    prisma.itemCategory.findMany({ select: { normalizedName: true } }),
    prisma.itemTranslation.findMany({ distinct: ["category"], select: { category: true } }),
    prisma.item.findMany({ distinct: ["category"], select: { category: true } }),
  ]);

  const normalizedSet = new Set<string>();
  for (const row of stored) {
    normalizedSet.add(row.normalizedName);
  }
  for (const row of translations) {
    const key = normalizeCategoryKey(row.category);
    if (key) normalizedSet.add(key);
  }
  for (const row of items) {
    const key = normalizeCategoryKey(row.category);
    if (key) normalizedSet.add(key);
  }

  if (normalizedSet.has(normalizedName)) {
    return NextResponse.json({ ok: false, error: "Categoria duplicada" }, { status: 409 });
  }

  try {
    const created = await prisma.itemCategory.create({
      data: { name: sanitizedName, normalizedName },
      select: { name: true },
    });

    return NextResponse.json({ ok: true, name: created.name }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: false, error: "Categoria duplicada" }, { status: 409 });
    }
    throw error;
  }
}

