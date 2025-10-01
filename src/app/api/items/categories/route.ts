// src/app/api/items/categories/route.ts
import { NextResponse } from "next/server";
import type { LanguageCode } from "@prisma/client";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getLocaleFromRequest } from "../shared";

function toLanguageCode(locale: Locale): LanguageCode {
  return locale as LanguageCode;
}

export async function GET(request: Request) {
  const locale = getLocaleFromRequest(request);

  const translations = await prisma.itemTranslation.findMany({
    where: { locale: toLanguageCode(locale) },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });

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

  return NextResponse.json(Array.from(new Set(categories)));
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
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
  if (session?.user?.role !== "superadmin") {
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

