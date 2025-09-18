// src/app/api/pipedrive/sync/route.ts
import { NextResponse } from "next/server";
import {
  replaceDealProducts,
  updateOneShotAndUrl,
  type NormalizedLine,
} from "@/lib/pipedrive";

type IncomingLine = {
  sku?: string;
  code?: string;
  quantity?: number;
  unitNet?: number;
  unit_price?: number;
};

type SyncBody = {
  dealId?: string | number;
  proposalUrl?: string;
  oneShot?: number;
  items?: IncomingLine[];
};

function normalizeLines(items?: IncomingLine[]): NormalizedLine[] {
  if (!Array.isArray(items)) return [];
  const out: NormalizedLine[] = [];
  for (const it of items) {
    const sku = (it.sku ?? it.code ?? "").toString().trim();
    const qty = Number(it.quantity ?? 0);
    const price = Number(
      it.unitNet ?? it.unit_price ?? Number.NaN
    );

    if (!sku || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price)) {
      continue;
    }
    out.push({ sku, quantity: qty, unitPrice: price });
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SyncBody;

    const dealId = body.dealId;
    if (!dealId) {
      return NextResponse.json(
        { ok: false, reason: "missing_deal_id" },
        { status: 400 }
      );
    }

    const lines = normalizeLines(body.items);
    console.log("[Pipedrive] /sync payload:", {
      dealId,
      itemsLen: lines.length,
      sample: lines.slice(0, 3),
      hasOneShot: typeof body.oneShot !== "undefined",
      hasUrl: typeof body.proposalUrl !== "undefined",
    });

    // 1) reemplazar productos (v2)
    const products = await replaceDealProducts(dealId, lines);

    // 2) actualizar OneShot + URL (v1 PUT)
    await updateOneShotAndUrl(dealId, {
      oneShot: typeof body.oneShot === "number" ? body.oneShot : undefined,
      proposalUrl: body.proposalUrl ?? undefined,
    });

    return NextResponse.json({ ok: true, products });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: `Pipedrive error (${msg}).` },
      { status: 500 }
    );
  }
}
