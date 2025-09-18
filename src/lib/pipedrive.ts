// src/lib/pipedrive.ts

//* eslint-disable no-console */

const BASE_URL = process.env.PIPEDRIVE_BASE_URL ?? "https://wcx.pipedrive.com";
const API_TOKEN = process.env.PIPEDRIVE_API_TOKEN ?? "";

const FIELD_ONESHOT = process.env.PIPEDRIVE_FIELD_ONESHOT ?? ""; // id del campo OneShot (numérico $)
const FIELD_PROPOSAL_URL = process.env.PIPEDRIVE_FIELD_PROPOSAL_URL ?? ""; // id del campo Propuesta Comercial (URL)

function q(obj: Record<string, string | number | boolean | null | undefined>): string {
  const usp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) usp.set(k, String(v));
  });
  return usp.toString();
}

async function rawFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Pipedrive parse error: ${text.slice(0, 300)}`);
  }
  // Respuestas de PD traen { success:boolean, data?:... }
  const okHttp = res.ok;
  const okApi = typeof (json as { success?: boolean }).success === "boolean"
    ? (json as { success?: boolean }).success
    : undefined;

  if (!okHttp || okApi === false) {
    const err = (json as { error?: string }).error ?? `HTTP ${res.status}`;
    throw new Error(err);
  }
  return json as T;
}

/* ---------- Tipos ---------- */

export type NormalizedLine = {
  sku: string;          // code del producto en PD
  quantity: number;     // > 0
  unitPrice: number;    // precio unitario neto
};

type PdListDealProductsResp = {
  success: boolean;
  data?: Array<{
    id: number;          // attachment_id
    deal_id: number;
    product_id: number;
    name: string;
    item_price: number;
    quantity: number;
  }>;
};

type PdSearchProducts = {
  success: boolean;
  data?: {
    items?: Array<{
      item: { id: number; name: string; code?: string };
    }>;
  };
};

type PdAddDealProductResp = { success: boolean; data?: { id: number } };

/* ---------- API v2: productos del trato ---------- */

// Listar productos del trato (attachments) – v2
export async function listDealProductsV2(dealId: number | string) {
  const url = `${BASE_URL}/api/v2/deals/${dealId}/products?${q({ api_token: API_TOKEN, limit: 100 })}`;
  const json = await rawFetch<PdListDealProductsResp>(url, { method: "GET" });
  return json.data ?? [];
}

// Eliminar 1 attachment – v2
export async function deleteDealProductV2(dealId: number | string, attachmentId: number) {
  const url = `${BASE_URL}/api/v2/deals/${dealId}/products/${attachmentId}?${q({ api_token: API_TOKEN })}`;
  await rawFetch<{ success: boolean; data?: { id: number } }>(url, { method: "DELETE" });
}

// Buscar product_id por SKU (code) – v1 search
export async function findProductIdBySku(sku: string): Promise<number | null> {
  const url = `${BASE_URL}/api/v1/products/search?${q({
    api_token: API_TOKEN,
    term: sku,
    fields: "code",
    exact_match: 1,
    limit: 5,
  })}`;
  const json = await rawFetch<PdSearchProducts>(url, { method: "GET" });
  const items = json.data?.items ?? [];
  for (const it of items) {
    const code = it?.item?.code;
    if (code && code.toLowerCase() === sku.toLowerCase()) {
      return it.item.id;
    }
  }
  return null;
}

// Agregar product a deal – v2
export async function addDealProductV2(dealId: number | string, args: {
  product_id: number;
  item_price: number;
  quantity: number;
  tax?: number;
  discount?: number;
  discount_type?: "percentage" | "amount";
  tax_method?: "none" | "exclusive" | "inclusive";
  is_enabled?: boolean;
  comments?: string;
}) {
  const url = `${BASE_URL}/api/v2/deals/${dealId}/products?${q({ api_token: API_TOKEN })}`;
  const body = JSON.stringify({
    product_id: args.product_id,
    item_price: args.item_price,
    quantity: args.quantity,
    tax: args.tax ?? 0,
    discount: args.discount ?? 0,
    discount_type: args.discount_type ?? "percentage",
    tax_method: args.tax_method ?? "none",
    is_enabled: args.is_enabled ?? true,
    comments: args.comments ?? undefined,
  });
  await rawFetch<PdAddDealProductResp>(url, { method: "POST", body });
}

/* ---------- API v1: actualizar campos del deal (PUT) ---------- */

export async function updateOneShotAndUrl(dealId: number | string, opts: {
  oneShot?: number | null;
  proposalUrl?: string | null;
}) {
  const payload: Record<string, unknown> = {};
  if (opts.oneShot !== undefined && opts.oneShot !== null && Number.isFinite(Number(opts.oneShot))) {
    if (!FIELD_ONESHOT) throw new Error("Falta PIPEDRIVE_FIELD_ONESHOT en .env.local");
    payload[FIELD_ONESHOT] = Number(opts.oneShot);
  }
  if (opts.proposalUrl) {
    if (!FIELD_PROPOSAL_URL) throw new Error("Falta PIPEDRIVE_FIELD_PROPOSAL_URL en .env.local");
    payload[FIELD_PROPOSAL_URL] = String(opts.proposalUrl);
  }
  if (Object.keys(payload).length === 0) {
    console.log("[Pipedrive] PATCH omitido (payload vacío). Revisa IDs de campos en .env.local");
    return { skipped: true };
  }

  console.log("[Pipedrive] updateOneShotAndUrl env:", {
    FIELD_ONESHOT: FIELD_ONESHOT ? "(ok)" : "(missing)",
    FIELD_PROPOSAL_URL: FIELD_PROPOSAL_URL ? "(ok)" : "(missing)",
  });
  console.log("[Pipedrive] updateOneShotAndUrl payload:", payload);

  // v1: PUT /deals/{id}
  const url = `${BASE_URL}/api/v1/deals/${dealId}?${q({ api_token: API_TOKEN })}`;
  await rawFetch<{ success: boolean }>(url, { method: "PUT", body: JSON.stringify(payload) });

  return { skipped: false };
}

/* ---------- Orquestador: reemplazar productos ---------- */

export async function replaceDealProducts(
  dealId: number | string,
  lines: NormalizedLine[]
) {
  // 1) listar existenes y borrar
  const current = await listDealProductsV2(dealId);
  for (const row of current) {
    await deleteDealProductV2(dealId, row.id);
  }

  // 2) agregar nuevos
  const missingSkus: string[] = [];
  const failedSkus: string[] = [];
  let added = 0;

  for (const ln of lines) {
    const pid = await findProductIdBySku(ln.sku);
    if (!pid) {
      missingSkus.push(ln.sku);
      continue;
    }
    try {
      await addDealProductV2(dealId, {
        product_id: pid,
        item_price: ln.unitPrice,
        quantity: ln.quantity,
        tax_method: "none",
        discount_type: "percentage",
      });
      added += 1;
    } catch {
      failedSkus.push(ln.sku);
    }
  }

  const result = { deleted: current.length, added, missingSkus, failedSkus };
  console.log("[Pipedrive] replaceDealProducts:", result);
  return result;
}
