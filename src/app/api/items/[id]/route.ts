// src/app/api/items/[id]/route.ts
import { NextResponse } from "next/server";
import type { LanguageCode, Prisma } from "@prisma/client";

import { ensureSessionRole, requireApiSession } from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import {
  itemPayloadSchema,
  normalizeTranslations,
  ITEM_SELECT,
  mapItemToResponse,
  getLocaleFromRequest,
  type NormalizedTranslation,
} from "../shared";

function getItemIdFromUrl(req: Request): string | null {
  try {
    const { pathname } = new URL(req.url);
    const parts = pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((segment) => segment === "items");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    return null;
  }
}

export async function PATCH(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const forbidden = ensureSessionRole(session, ["admin"]);
  if (forbidden) return forbidden;

  const id = getItemIdFromUrl(req);
  if (!id) {
    return NextResponse.json({ error: "id no encontrado en la URL" }, { status: 400 });
  }

  const raw = await req.json();
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

  if (typeof body.sku === "string") {
    const newSku = body.sku.trim();
    if (newSku) {
      const dup = await prisma.item.findFirst({
        where: {
          sku: { equals: newSku, mode: "insensitive" },
          NOT: { id },
        },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json({ error: "El SKU ya existe" }, { status: 409 });
      }
    }
  }

  const touchesContent = Boolean(
    (body.translations && body.translations.length > 0) ||
      typeof body.name === "string" ||
      typeof body.category === "string" ||
      typeof body.description === "string"
  );

  let translations: NormalizedTranslation[] | null = null;

  let existingSnapshot: Prisma.ItemGetPayload<{ select: typeof ITEM_SELECT }> | null = null;
  if (touchesContent) {
    existingSnapshot = await prisma.item.findUnique({
      where: { id },
      select: ITEM_SELECT,
    });
    if (!existingSnapshot) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
    }

    const currentTranslations: NormalizedTranslation[] = [
      {
        locale: defaultLocale,
        name: existingSnapshot.name,
        category: existingSnapshot.category,
        description: existingSnapshot.description ?? "",
      },
      ...existingSnapshot.translations.map((translation) => ({
        locale: translation.locale as Locale,
        name: translation.name,
        category: translation.category,
        description: translation.description,
      })),
    ];

    try {
      translations = normalizeTranslations(body, currentTranslations);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Traducciones invalidas",
        },
        { status: 400 }
      );
    }
  }

  const data: Prisma.ItemUpdateInput = {};

  if (typeof body.sku === "string") {
    data.sku = body.sku.trim();
  }

  if (body.unitPrice !== undefined) {
    data.unitPrice = body.unitPrice;
  }

  if (body.devHours !== undefined) {
    data.devHours = body.devHours;
  }

  if (body.active !== undefined) {
    data.active = body.active;
  }

  if (translations) {
    const defaultTranslation = translations.find((entry) => entry.locale === defaultLocale)!;
    data.name = defaultTranslation.name;
    data.category = defaultTranslation.category;
    data.description = defaultTranslation.description;

    data.translations = {
      upsert: translations.map((entry) => ({
        where: {
          itemId_locale: {
            itemId: id,
            locale: entry.locale as LanguageCode,
          },
        },
        update: {
          name: entry.name,
          category: entry.category,
          description: entry.description,
        },
        create: {
          locale: entry.locale as LanguageCode,
          name: entry.name,
          category: entry.category,
          description: entry.description,
        },
      })),
    };
  } else {
    if (typeof body.name === "string") {
      data.name = body.name;
    }
    if (typeof body.category === "string") {
      const category = body.category.trim();
      data.category = category ? category : "general";
    }
    if (typeof body.description === "string") {
      data.description = body.description;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  const updated = await prisma.item.update({
    where: { id },
    data,
    select: ITEM_SELECT,
  });

  const locale = getLocaleFromRequest(req);
  return NextResponse.json(mapItemToResponse(updated, locale));
}

export async function DELETE(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const forbidden = ensureSessionRole(session, ["admin"]);
  if (forbidden) return forbidden;

  const id = getItemIdFromUrl(req);
  if (!id) {
    return NextResponse.json({ error: "id no encontrado en la URL" }, { status: 400 });
  }

  try {
    await prisma.item.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

