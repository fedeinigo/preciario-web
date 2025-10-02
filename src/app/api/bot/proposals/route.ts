// src/app/api/bot/proposals/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  createProposalDocSystem,
  type AnyItemInput,
} from "@/lib/google-system";
import {
  countryIdFromName,
  subsidiaryIdFromName,
  autoSubsidiaryForCountry,
} from "@/app/components/features/proposals/lib/catalogs";
import {
  replaceDealProducts,
  updateOneShotAndUrl,
  type NormalizedLine,
} from "@/lib/pipedrive";

/* ======================= Tipos de entrada ======================= */
type IncomingItemSku = { sku: string; quantity: number };
type IncomingItemNamed = {
  name: string;
  quantity: number;
  unitPrice: number;
  devHours: number;
};
type IncomingItem = IncomingItemSku | IncomingItemNamed;

type BotBody = {
  companyName?: string;
  country?: string;
  subsidiary?: string;      // opcional; si falta se infiere por país
  creatorEmail?: string;    // opcional; si existe se asocia a userId si lo encontramos
  items?: IncomingItem[];
  pipedriveLink?: string;   // opcional
  apiKey?: string;          // opcional, compatibilidad
};

/* ======================= Helpers ======================= */
function parseConfiguredKeys(): string[] {
  const rawValues = [process.env.BOT_API_KEY, process.env.BOT_API_KEYS].filter(Boolean) as string[];
  const tokens = new Set<string>();
  rawValues.forEach((value) => {
    value
      .split(/[,;\s]+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .forEach((token) => tokens.add(token));
  });
  return Array.from(tokens);
}

function extractRequestKey(req: Request, body: BotBody): string | null {
  const headerKey = req.headers.get("x-api-key")?.trim();
  if (headerKey) return headerKey;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  const bodyKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  return bodyKey || null;
}

function toNumber(n: unknown, fallback = 0): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function extractDealIdFromLink(s?: string): string | null {
  if (!s) return null;
  const t = s.trim();
  const onlyNum = /^(\d+)$/.exec(t);
  if (onlyNum) return onlyNum[1];
  const m = t.match(/\/deal\/(\d+)/i);
  return m ? m[1] : null;
}

/* ======================= Handler ======================= */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as BotBody;

    const allowedKeys = parseConfiguredKeys();
    if (allowedKeys.length > 0) {
      const providedKey = extractRequestKey(req, body);
      if (!providedKey || !allowedKeys.includes(providedKey)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const companyName = (body.companyName ?? "").trim();
    const country = (body.country ?? "").trim();
    if (!companyName || !country) {
      return NextResponse.json(
        { error: "Faltan campos: companyName y country son requeridos." },
        { status: 400 }
      );
    }

    // Filial / IDs
    const usedSubsidiary =
      (body.subsidiary?.trim() || "") || autoSubsidiaryForCountry(country);
    const countryId = countryIdFromName(country);

    // Usuario (opcional)
    const creatorEmail = body.creatorEmail?.trim() || null;
    const user =
      creatorEmail
        ? await prisma.user.findFirst({ where: { email: creatorEmail } })
        : null;
    const userId = user?.id ?? null;

    // Ítems entrantes
    const incoming: IncomingItem[] = Array.isArray(body.items) ? body.items : [];
    if (incoming.length === 0) {
      return NextResponse.json(
        { error: "Debes enviar al menos un ítem en items[]." },
        { status: 400 }
      );
    }

    // Resolver ítems contra catálogo (si viene sku) o usar valores explícitos (si vienen completos)
    type ResolvedItem = {
      sku?: string;
      dbItemId?: string;
      name: string;
      quantity: number;
      unitPrice: number; // neto
      devHours: number;
    };

    const resolvedItems: ResolvedItem[] = [];
    for (const it of incoming) {
      if ("sku" in it && typeof it.sku === "string") {
        const sku = it.sku.trim();
        const qty = Math.max(1, toNumber(it.quantity, 1));
        const db = await prisma.item.findUnique({ where: { sku } });
        if (!db) {
          return NextResponse.json(
            { error: `SKU no encontrado en catálogo: ${sku}` },
            { status: 400 }
          );
        }
        resolvedItems.push({
          sku,
          dbItemId: db.id,
          name: db.name,
          quantity: qty,
          unitPrice: Number(db.unitPrice),
          devHours: db.devHours,
        });
      } else if (
        "name" in it &&
        typeof it.name === "string" &&
        typeof it.quantity === "number" &&
        typeof it.unitPrice === "number" &&
        typeof it.devHours === "number"
      ) {
        resolvedItems.push({
          name: it.name,
          quantity: Math.max(1, toNumber(it.quantity, 1)),
          unitPrice: Math.max(0, toNumber(it.unitPrice, 0)),
          devHours: Math.max(0, toNumber(it.devHours, 0)),
        });
      }
    }

    if (resolvedItems.length === 0) {
      return NextResponse.json(
        { error: "Ningún ítem válido (con sku o con name/unitPrice/devHours)." },
        { status: 400 }
      );
    }

    // Totales preliminares
    const HOURLY_RATE = Number(process.env.PROPOSAL_ONESHOT_RATE_USD ?? "50");
    const totalAmount = resolvedItems.reduce(
      (acc, r) => acc + r.unitPrice * r.quantity,
      0
    );
    const totalHours = resolvedItems.reduce(
      (acc, r) => acc + r.devHours * r.quantity,
      0
    );
    const oneShot = Math.round(totalHours * HOURLY_RATE);

    // Crear Doc (se envían nombres, no SKUs)
    const docItems: AnyItemInput[] = resolvedItems.map((r) => ({
      name: r.name,
      quantity: r.quantity,
      unitPrice: r.unitPrice,
      devHours: r.devHours,
    }));

    const {
      docId,
      docUrl,
      totals: docTotals,          // { monthly, hours, oneShot }
      subsidiary: docSubsidiary,  // por si la lib decide ajustar
    } = await createProposalDocSystem({
      companyName,
      country,
      subsidiary: usedSubsidiary,
      items: docItems,
      creatorEmail: creatorEmail || undefined,
    });

    // Alinear totales con lo que devolvió la lib (fallback a los preliminares)
    const finalMonthly = toNumber(docTotals?.monthly, totalAmount);
    const finalHours = toNumber(docTotals?.hours, totalHours);
    const finalOneShot = toNumber(docTotals?.oneShot, oneShot);
    const finalSubsidiary = (docSubsidiary || usedSubsidiary).trim();

    // Guardar propuesta + items (aparece en Histórico/Stats)
    const proposalId = randomUUID();
    await prisma.proposal.create({
      data: {
        id: proposalId,
        userId,
        userEmail: creatorEmail,
        companyName,
        country,
        countryId,
        subsidiary: finalSubsidiary,
        subsidiaryId: subsidiaryIdFromName(finalSubsidiary),
        totalAmount: finalMonthly,
        totalHours: finalHours,
        oneShot: finalOneShot,
        docUrl: docUrl ?? null,
        docId: docId ?? null,
        createdChannel: "API",
        items: {
          create: resolvedItems
            .filter((r) => !!r.dbItemId)
            .map((r) => ({
              itemId: r.dbItemId as string,
              quantity: r.quantity,
              unitPrice: r.unitPrice,
              devHours: r.devHours,
            })),
        },
      },
    });

    // Sincronización con Pipedrive (si vino link)
    let pipedriveSyncStatus: "OK" | "ERROR" | null = null;
    const dealId = extractDealIdFromLink(body.pipedriveLink);

    if (dealId) {
      try {
        const lines: NormalizedLine[] = resolvedItems
          .filter((r): r is Required<Pick<ResolvedItem, "sku">> & ResolvedItem => !!r.sku)
          .map((r) => ({
            sku: r.sku as string,
            quantity: r.quantity,
            unitPrice: r.unitPrice,
          }));

        await replaceDealProducts(dealId, lines);
        await updateOneShotAndUrl(dealId, {
          oneShot: finalOneShot,
          proposalUrl: docUrl ?? undefined,
        });

        pipedriveSyncStatus = "OK";
      } catch (e) {
        console.error("[pipedrive sync error]", e);
        pipedriveSyncStatus = "ERROR";
      }
    }

    return NextResponse.json({
      proposalId,
      docId,
      docUrl,
      pipedriveSyncStatus,
      docsError: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error creating proposal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
