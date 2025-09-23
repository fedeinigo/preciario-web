// src/app/api/bot/proposals/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  createProposalDocSystem,
  type LineItem as DocLineItem,
} from "@/lib/google-system";
import {
  replaceDealProducts,
  updateOneShotAndUrl,
} from "@/lib/pipedrive";

const RATE_ONESHOT_USD = Number(process.env.PROPOSAL_ONESHOT_RATE_USD ?? "50");

// API Key(s) válidas separadas por coma
function isValidApiKey(header: string | null): boolean {
  if (!header) return false;
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  const provided = m[1].trim();
  const all = (process.env.BOT_API_KEYS ?? process.env.BOT_API_KEY ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return all.includes(provided);
}

const LineSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
});

const PayloadSchema = z.object({
  companyName: z.string().min(1),
  country: z.string().min(1),
  pipedriveLink: z.string().url().optional(),
  pipedriveDealId: z.string().min(1).optional(),
  creatorEmail: z.string().email().optional(),
  externalId: z.string().min(1).optional(), // idempotencia cross-sistema
  items: z.array(LineSchema).min(1),
});

type Payload = z.infer<typeof PayloadSchema>;

function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

async function resolveCountry(country: string): Promise<{
  countryId: string;
  countryName: string;
  subsidiaryId: string;
  subsidiaryTitle: string;
}> {
  // 1) insensitive
  let row = await prisma.filialCountry.findFirst({
    where: { name: { equals: country, mode: "insensitive" } },
    include: { group: true },
  });

  // 2) normalizado
  if (!row) {
    const all = await prisma.filialCountry.findMany({ include: { group: true } });
    const needle = normalizeKey(country);
    row = all.find((r) => normalizeKey(r.name) === needle) ?? null;
  }

  if (!row) {
    throw new Response(
      JSON.stringify({ error: "invalid_country", message: `País no encontrado: ${country}` }),
      { status: 422, headers: { "content-type": "application/json" } }
    );
  }

  return {
    countryId: row.id,
    countryName: row.name,
    subsidiaryId: row.groupId,
    subsidiaryTitle: row.group.title,
  };
}

async function loadItemsBySku(lines: Array<{ sku: string; quantity: number }>): Promise<{
  items: Array<{
    itemId: string;
    name: string;
    sku: string;
    unitPrice: Prisma.Decimal;
    devHours: number;
    quantity: number;
  }>;
  unknownSkus: string[];
}> {
  const skus = Array.from(new Set(lines.map((l) => l.sku.trim())));
  const rows = await prisma.item.findMany({
    where: { sku: { in: skus }, active: true },
    select: { id: true, sku: true, name: true, unitPrice: true, devHours: true },
  });

  const bySku = new Map(rows.map((r) => [r.sku.toLowerCase(), r]));
  const items: Array<{
    itemId: string;
    name: string;
    sku: string;
    unitPrice: Prisma.Decimal;
    devHours: number;
    quantity: number;
  }> = [];

  const unknownSkus: string[] = [];

  for (const ln of lines) {
    const key = ln.sku.toLowerCase();
    const it = bySku.get(key);
    if (!it) {
      unknownSkus.push(ln.sku);
      continue;
    }
    items.push({
      itemId: it.id,
      name: it.name,
      sku: it.sku,
      unitPrice: it.unitPrice,
      devHours: it.devHours,
      quantity: ln.quantity,
    });
  }

  return { items, unknownSkus };
}

function sumDecimals(xs: Array<Prisma.Decimal>): Prisma.Decimal {
  return xs.reduce((acc, v) => acc.add(v), new Prisma.Decimal(0));
}

function toNumber(d: Prisma.Decimal): number {
  return Number(d.toFixed(2));
}

export async function POST(req: Request) {
  if (!isValidApiKey(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Payload;
  try {
    const json = await req.json();
    body = PayloadSchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_payload", detail: String(err) },
      { status: 400 }
    );
  }

  // Idempotencia por externalId / pipedriveDealId
  const or: Prisma.ProposalWhereInput[] = [];
  if (body.externalId) or.push({ externalId: body.externalId });
  if (body.pipedriveDealId) or.push({ pipedriveDealId: body.pipedriveDealId });

  if (or.length) {
    const existing = await prisma.proposal.findFirst({
      where: { OR: or },
      select: { id: true, docUrl: true, pipedriveSyncStatus: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          proposalId: existing.id,
          docUrl: existing.docUrl ?? null,
          pipedriveSyncStatus: existing.pipedriveSyncStatus ?? null,
          idempotent: true,
        },
        { status: 200 }
      );
    }
  }

  // País / filial
  const geo = await resolveCountry(body.country);

  // Ítems
  const loaded = await loadItemsBySku(body.items);
  if (loaded.unknownSkus.length > 0) {
    return NextResponse.json(
      { error: "unknown_skus", skus: loaded.unknownSkus },
      { status: 422 }
    );
  }

  // Totales
  const totalAmount = sumDecimals(
    loaded.items.map((ln) => ln.unitPrice.mul(ln.quantity))
  );
  const totalHours = loaded.items
    .map((ln) => ln.devHours * ln.quantity)
    .reduce((a, b) => a + b, 0);

  const oneShot = new Prisma.Decimal(RATE_ONESHOT_USD).mul(totalHours);

  // Usuario (opcional)
  let userId: string | null = null;
  if (body.creatorEmail) {
    const user = await prisma.user.findUnique({
      where: { email: body.creatorEmail },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  // Crear propuesta + items
  const proposalId = randomUUID();

  const created = await prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.create({
      data: {
        id: proposalId,
        companyName: body.companyName,
        country: geo.countryName,
        countryId: geo.countryId,
        subsidiary: geo.subsidiaryTitle,
        subsidiaryId: geo.subsidiaryId,

        totalAmount,
        totalHours,
        oneShot,

        userId,
        userEmail: body.creatorEmail ?? null,

        pipedriveLink: body.pipedriveLink ?? null,
        pipedriveDealId: body.pipedriveDealId ?? null,

        // Campos nuevos -> requerís migración y prisma generate
        createdChannel: "WHATSAPP",
        createdByExternalId: body.externalId ?? null,
        externalId: body.externalId ?? null,

        items: {
          create: loaded.items.map((ln) => ({
            itemId: ln.itemId,
            quantity: ln.quantity,
            unitPrice: ln.unitPrice,
            devHours: ln.devHours,
          })),
        },
      },
      select: { id: true },
    });

    return proposal;
  });

  // Generar Doc (sin sesión de usuario)
  const docItems: DocLineItem[] = loaded.items.map((ln) => ({
    name: `${ln.sku} - ${ln.name}`,
    quantity: ln.quantity,
    devHours: ln.devHours,
    unitPrice: toNumber(ln.unitPrice),
  }));

  let docId: string | null = null;
  let docUrl: string | null = null;
  try {
    const doc = await createProposalDocSystem({
      companyName: body.companyName,
      country: geo.countryName,
      subsidiary: geo.subsidiaryTitle,
      items: docItems,
      totalAmount: toNumber(totalAmount),
      totalHours,
      oneShot: Number(oneShot.toFixed(2)),
    });
    docId = doc.docId;
    docUrl = doc.docUrl;

    await prisma.proposal.update({
      where: { id: created.id },
      data: { docId, docUrl },
    });
  } catch (_err) {
    // Log para debugging y que no salte ESLint
    console.error("[docs:createProposalDocSystem] error", _err);
    await prisma.proposal.update({
      where: { id: created.id },
      data: { docId: null, docUrl: null },
    });
  }

  // Sync Pipedrive (opcional)
  let pipedriveSyncStatus: "OK" | "ERROR" | null = null;
  if (body.pipedriveDealId) {
    try {
      await replaceDealProducts(
        body.pipedriveDealId,
        docItems.map((ln) => ({
          sku: ln.name.split(" - ")[0], // recupera el SKU exacto
          quantity: ln.quantity,
          unitPrice: ln.unitPrice,
        }))
      );

      await updateOneShotAndUrl(body.pipedriveDealId, {
        oneShot: Number(oneShot.toFixed(2)),
        proposalUrl: docUrl ?? undefined,
      });

      await prisma.proposal.update({
        where: { id: created.id },
        data: {
          pipedriveSyncedAt: new Date(),
          pipedriveSyncStatus: "OK",
          pipedriveSyncNote: null,
        },
      });
      pipedriveSyncStatus = "OK";
    } catch (err) {
      console.error("[pipedrive:sync] error", err);
      await prisma.proposal.update({
        where: { id: created.id },
        data: {
          pipedriveSyncedAt: new Date(),
          pipedriveSyncStatus: "ERROR",
          pipedriveSyncNote: String(err),
        },
      });
      pipedriveSyncStatus = "ERROR";
    }
  }

  return NextResponse.json(
    {
      proposalId: created.id,
      docUrl,
      pipedriveSyncStatus,
    },
    { status: 201 }
  );
}
