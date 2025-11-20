// src/lib/pipedrive.ts

//* eslint-disable no-console */

import type { PipedriveDealSummary } from "@/types/pipedrive";
import logger from "@/lib/logger";

const log = logger.child({ service: "pipedrive" });

const BASE_URL = process.env.PIPEDRIVE_BASE_URL ?? "https://wcx.pipedrive.com";
const API_TOKEN = process.env.PIPEDRIVE_API_TOKEN ?? "";

const FIELD_ONESHOT = process.env.PIPEDRIVE_FIELD_ONESHOT ?? ""; // id del campo OneShot (numérico $)
const FIELD_PROPOSAL_URL = process.env.PIPEDRIVE_FIELD_PROPOSAL_URL ?? ""; // id del campo Propuesta Comercial (URL)
const FIELD_MAPACHE_ASSIGNED =
  process.env.PIPEDRIVE_FIELD_MAPACHE_ASSIGNED ??
  "e2d185431fb620ed330b8a77a0b090cd28e20c32";
const FIELD_FEE_MENSUAL =
  process.env.PIPEDRIVE_FIELD_FEE_MENSUAL ??
  "5cc64655a798c1cff20311078bc3f87c6296446f";
const FIELD_DOC_CONTEXT_DEAL =
  process.env.PIPEDRIVE_FIELD_DOC_CONTEXT_DEAL ??
  "0adac015f939871f8cabfe7f6d9392953193df17";

const CUSTOM_FIELD_KEYS = [
  FIELD_MAPACHE_ASSIGNED,
  FIELD_FEE_MENSUAL,
  FIELD_PROPOSAL_URL,
  FIELD_DOC_CONTEXT_DEAL,
].filter(Boolean).join(",");

type MapacheFieldOptions = {
  optionById: Map<number, string>;
  optionIdByName: Map<string, number>;
};
let mapacheFieldOptionsCache: MapacheFieldOptions | null = null;
const ownerNameCache = new Map<number, string | null>();
let stageNameMapCache: Map<number, string> | null = null;

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

type PdDealRecord = {
  id: number;
  title?: string | null;
  value?: number | string | null;
  add_time?: string | null;
  won_time?: string | null;
  stage_id?: number | null;
  owner_id?: number | null;
  owner_name?: string | null;
  status?: string | null;
  custom_fields?: Record<string, unknown> | null;
};

type PdDealsListResponse = {
  success: boolean;
  data?: PdDealRecord[];
  additional_data?: {
    next_cursor?: string | null;
  };
};

type PdDealFieldOption = {
  id?: number | null;
  label?: string | null;
};

type PdDealField = {
  id: number;
  key: string;
  field_type: string;
  options?: PdDealFieldOption[] | null;
};

type PdDealFieldsResponse = {
  success: boolean;
  data?: PdDealField[];
};

type PdStagesResponse = {
  success: boolean;
  data?: Array<{
    id?: number | null;
    name?: string | null;
  }>;
};

type PdUserResponse = {
  success: boolean;
  data?: {
    id: number;
    name?: string | null;
  } | null;
};

type DealStatus = "open" | "won" | "lost" | "all_not_deleted";

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
    log.info("pipedrive.skip_update", { reason: "empty_payload" });
    return { skipped: true };
  }

  log.info("pipedrive.update_payload", {
    FIELD_ONESHOT: FIELD_ONESHOT ? "(ok)" : "(missing)",
    FIELD_PROPOSAL_URL: FIELD_PROPOSAL_URL ? "(ok)" : "(missing)",
    payload,
  });

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
  log.info("pipedrive.replace_deal_products", result);
  return result;
}

export async function searchDealsByMapacheAssigned(mapacheName: string) {
  const normalizedName = mapacheName.trim();
  if (!normalizedName) {
    return [];
  }
  if (!FIELD_MAPACHE_ASSIGNED) {
    throw new Error("Falta PIPEDRIVE_FIELD_MAPACHE_ASSIGNED en config");
  }

  const mapacheOptions = await ensureMapacheFieldOptions();
  const normalizedInput = normalizeForComparison(normalizedName);
  const optionId = mapacheOptions.optionIdByName.get(normalizedInput);

  if (!optionId) {
    log.warn("pipedrive.mapache_option_not_found", { mapache: normalizedName });
    return [];
  }

  const [stageNames, deals] = await Promise.all([
    ensureStageNameMap(),
    fetchDealsWithMapacheFields(["open", "won"]),
  ]);

  const filtered = deals.filter((deal) => {
    const value = getCustomFieldValue(deal.custom_fields, FIELD_MAPACHE_ASSIGNED);
    const numericValue = ensureNumber(value);
    return numericValue !== null && numericValue === optionId;
  });

  const ownerIds = Array.from(
    new Set(
      filtered
        .map((deal) => ensureNumber(deal.owner_id))
        .filter((id): id is number => typeof id === "number" && Number.isFinite(id)),
    ),
  );
  const ownerNames = await resolveOwnerNames(ownerIds);

  const summaries = filtered.map((deal) => {
    const stageId = ensureNumber(deal.stage_id);
    const stageName = stageId !== null ? stageNames.get(stageId) ?? null : null;
    const ownerId = ensureNumber(deal.owner_id);
    const ownerName = ownerId !== null ? ownerNames.get(ownerId) ?? null : null;

    return normalizeDealSummary({
      deal,
      stageName,
      ownerName,
      mapacheOptions,
    });
  });

  log.info("pipedrive.mapache_search", {
    mapache: normalizedName,
    hits: summaries.length,
  });

  return summaries;
}

async function fetchDealsWithMapacheFields(
  statuses: DealStatus[] = ["open"],
) {
  const results: PdDealRecord[] = [];
  const limit = 100;

  for (const status of statuses) {
    let cursor: string | null = null;
    do {
      const payload: Record<string, string | number> = {
        api_token: API_TOKEN,
        status,
        limit,
      };
      if (cursor) {
        payload.cursor = cursor;
      }
      if (CUSTOM_FIELD_KEYS) {
        payload.custom_fields = CUSTOM_FIELD_KEYS;
      }
      const url = `${BASE_URL}/api/v2/deals?${q(payload)}`;
      const json = await rawFetch<PdDealsListResponse>(url, { method: "GET" });
      if (Array.isArray(json.data)) {
        results.push(...json.data);
      }
      cursor = json.additional_data?.next_cursor ?? null;
    } while (cursor);
  }

  return results;
}

async function ensureStageNameMap() {
  if (stageNameMapCache) {
    return stageNameMapCache;
  }
  const url = `${BASE_URL}/api/v1/stages?${q({ api_token: API_TOKEN })}`;
  const json = await rawFetch<PdStagesResponse>(url, { method: "GET" });
  const map = new Map<number, string>();
  for (const stage of json.data ?? []) {
    const id = ensureNumber(stage?.id ?? null);
    if (id === null) continue;
    const name = extractString(stage?.name) ?? null;
    if (name) {
      map.set(id, name);
    }
  }
  stageNameMapCache = map;
  return map;
}

async function resolveOwnerNames(ownerIds: number[]) {
  const map = new Map<number, string | null>();
  const missing: number[] = [];

  for (const ownerId of ownerIds) {
    if (ownerNameCache.has(ownerId)) {
      map.set(ownerId, ownerNameCache.get(ownerId) ?? null);
    } else {
      missing.push(ownerId);
    }
  }

  const promises = missing.map(async (ownerId) => {
    const name = await fetchOwnerName(ownerId);
    ownerNameCache.set(ownerId, name);
    map.set(ownerId, name);
  });

  if (promises.length > 0) {
    await Promise.allSettled(promises);
  }

  return map;
}

async function fetchOwnerName(ownerId: number) {
  const url = `${BASE_URL}/api/v1/users/${ownerId}?${q({ api_token: API_TOKEN })}`;
  try {
    const json = await rawFetch<PdUserResponse>(url, { method: "GET" });
    const name = extractString(json.data?.name);
    return name ?? null;
  } catch (error) {
    log.error("pipedrive.fetch_owner_failed", {
      ownerId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function normalizeDealSummary({
  deal,
  stageName,
  ownerName,
  mapacheOptions,
}: {
  deal: PdDealRecord;
  stageName: string | null;
  ownerName: string | null;
  mapacheOptions: MapacheFieldOptions;
}): PipedriveDealSummary {
  const customFields = deal.custom_fields ?? {};
  const rawMapache = getCustomFieldValue(customFields, FIELD_MAPACHE_ASSIGNED);
  const mapacheOptionId = ensureNumber(rawMapache);
  const mapacheAssigned =
    mapacheOptionId !== null ? mapacheOptions.optionById.get(mapacheOptionId) ?? null : null;

  return {
    id: deal.id,
    title: extractString(deal.title) ?? "",
    value: ensureNumber(deal.value),
    createdAt: extractString(deal.add_time),
    wonAt: extractString(deal.won_time),
    wonQuarter: determineQuarter(deal.won_time),
    stageId: ensureNumber(deal.stage_id),
    stageName,
    ownerId: ensureNumber(deal.owner_id),
    ownerName,
    status: typeof deal.status === "string" ? deal.status : null,
    mapacheAssigned,
    feeMensual: getCustomFieldMoney(customFields, FIELD_FEE_MENSUAL),
    proposalUrl: getCustomFieldString(customFields, FIELD_PROPOSAL_URL),
    docContextDeal: getCustomFieldString(customFields, FIELD_DOC_CONTEXT_DEAL),
    dealUrl: buildDealUrl(deal.id),
  };
}

function getCustomFieldString(
  fields: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  if (!fields || !key) return null;
  const raw = fields[key];
  return extractString(raw);
}

function getCustomFieldMoney(
  fields: Record<string, unknown> | null | undefined,
  key: string,
): number | null {
  if (!fields || !key) return null;
  const raw = fields[key];
  if (typeof raw === "number" || typeof raw === "string") {
    return ensureNumber(raw);
  }
  if (raw && typeof raw === "object" && "value" in raw) {
    const value = (raw as { value?: unknown }).value;
    return ensureNumber(value);
  }
  return null;
}

function getCustomFieldValue(
  fields: Record<string, unknown> | null | undefined,
  key: string,
): unknown {
  if (!fields || !key) return null;
  return fields[key];
}

function ensureNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return null;
}

function buildDealUrl(dealId: number): string {
  const base = BASE_URL.replace(/\/+$/, "");
  return `${base}/deal/${dealId}`;
}

function determineQuarter(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.getMonth(); // 0-11
  return Math.floor(month / 3) + 1;
}

async function ensureMapacheFieldOptions(): Promise<MapacheFieldOptions> {
  if (mapacheFieldOptionsCache) {
    return mapacheFieldOptionsCache;
  }

  const url = `${BASE_URL}/api/v1/dealFields?${q({ api_token: API_TOKEN })}`;
  const json = await rawFetch<PdDealFieldsResponse>(url, { method: "GET" });
  const fields = json.data ?? [];
  const field = fields.find((item) => item.key === FIELD_MAPACHE_ASSIGNED);
  if (!field) {
    throw new Error("No se encontró el campo Mapache Asignado en Pipedrive");
  }

  const optionById = new Map<number, string>();
  const optionIdByName = new Map<string, number>();
  for (const option of field.options ?? []) {
    const id = ensureNumber(option?.id);
    const label = extractString(option?.label);
    if (id === null || !label) continue;
    optionById.set(id, label);
    optionIdByName.set(normalizeForComparison(label), id);
  }

  mapacheFieldOptionsCache = { optionById, optionIdByName };
  return mapacheFieldOptionsCache;
}

function normalizeForComparison(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
