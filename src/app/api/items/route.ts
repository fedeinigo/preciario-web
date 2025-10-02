// src/app/api/items/route.ts
import { NextResponse } from "next/server";
import type { LanguageCode } from "@prisma/client";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import { defaultLocale } from "@/lib/i18n/config";
import prisma from "@/lib/prisma";
import {
  ITEM_SELECT,
  itemPayloadSchema,
  mapItemToResponse,
  normalizeTranslations,
  getLocaleFromRequest,
} from "./shared";

export async function GET(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;

  const locale = getLocaleFromRequest(request);
  const localesToFetch = Array.from(
    new Set<LanguageCode>([defaultLocale as LanguageCode, locale as LanguageCode])
  );

  const rows = await prisma.item.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
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
        where: { locale: { in: localesToFetch } },
        select: {
          locale: true,
          name: true,
          category: true,
          description: true,
        },
      },
    },
  });

  const payload = rows.map((item) => mapItemToResponse(item, locale));
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;

  const locale = getLocaleFromRequest(request);

  const raw = await request.json();
  const parsed = itemPayloadSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalido",
        details: parsed.error.format(),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;

  if (body.unitPrice === undefined || body.devHours === undefined) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const sku = (body.sku ?? "").trim();

  if (sku) {
    const exists = await prisma.item.findFirst({
      where: { sku: { equals: sku, mode: "insensitive" } },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json({ error: "El SKU ya existe" }, { status: 409 });
    }
  }

  let translations;
  try {
    translations = normalizeTranslations(body);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Traducciones invalidas",
      },
      { status: 400 }
    );
  }

  const defaultTranslation = translations.find((t) => t.locale === defaultLocale)!;

  const created = await prisma.item.create({
    data: {
      sku,
      category: defaultTranslation.category,
      name: defaultTranslation.name,
      description: defaultTranslation.description,
      unitPrice: body.unitPrice,
      devHours: body.devHours,
      active: body.active ?? true,
      translations: {
        create: translations.map((entry) => ({
          locale: entry.locale as LanguageCode,
          name: entry.name,
          category: entry.category,
          description: entry.description,
        })),
      },
    },
    select: ITEM_SELECT,
  });

  return NextResponse.json(mapItemToResponse(created, locale), { status: 201 });
}

