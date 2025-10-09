import type { ProposalRecord } from "./types";

export type ProposalsListMeta = {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
};

export type ProposalsListResult = {
  proposals: ProposalRecord[];
  meta?: ProposalsListMeta;
};

type FetchError = Error & { status?: number };

/**
 * El endpoint `/api/proposals` acepta el parámetro `aggregate=activeUsers` junto con `from` y
 * `to` para devolver la cantidad de correos distintos que generaron propuestas en el rango.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProposalRecord(value: unknown): value is ProposalRecord {
  if (!isRecord(value)) return false;
  if (!("id" in value)) return false;
  const id = value.id;
  return typeof id === "string" && id.length > 0;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function parseMeta(value: unknown): ProposalsListMeta | undefined {
  if (!isRecord(value)) return undefined;
  const meta: ProposalsListMeta = {};
  const page = toNumber(value.page);
  const pageSize = toNumber(value.pageSize);
  const totalItems = toNumber(value.totalItems);
  const totalPages = toNumber(value.totalPages);

  if (page !== undefined) meta.page = page;
  if (pageSize !== undefined) meta.pageSize = pageSize;
  if (totalItems !== undefined) meta.totalItems = totalItems;
  if (totalPages !== undefined) meta.totalPages = totalPages;

  return Object.keys(meta).length > 0 ? meta : undefined;
}

export function parseProposalsListResponse(input: unknown): ProposalsListResult {
  if (Array.isArray(input)) {
    const proposals = input.filter(isProposalRecord) as ProposalRecord[];
    return { proposals };
  }

  if (isRecord(input)) {
    const data = Array.isArray(input.data) ? input.data : undefined;
    const meta = parseMeta(input.meta);
    const proposals = data?.filter(isProposalRecord) as ProposalRecord[] | undefined;
    if (proposals) return { proposals, meta };
    const fallback = Array.isArray(input) ? (input.filter(isProposalRecord) as ProposalRecord[]) : [];
    return { proposals: fallback, meta };
  }

  return { proposals: [] };
}

const hasTotals = (meta?: ProposalsListMeta): boolean =>
  Boolean(meta && (meta.totalItems !== undefined || meta.totalPages !== undefined));

const mergeMeta = (
  base: ProposalsListMeta | undefined,
  incoming: ProposalsListMeta,
): ProposalsListMeta => (base ? { ...base, ...incoming } : { ...incoming });

export async function fetchAllProposals(init?: RequestInit & { pageSize?: number }): Promise<ProposalsListResult> {
  const { pageSize: requestedPageSize, ...restInit } = (init ?? {}) as RequestInit & { pageSize?: number };
  const baseInit: RequestInit = { ...restInit, cache: restInit.cache ?? "no-store" };
  const buildInit = () => ({ ...baseInit });

  const normalizedRequested =
    typeof requestedPageSize === "number" && requestedPageSize > 0
      ? Math.floor(requestedPageSize)
      : undefined;
  const firstPageSize = normalizedRequested ?? 100;
  const firstQuery = new URLSearchParams({ page: "1", pageSize: String(firstPageSize) });
  const firstResponse = await fetch(`/api/proposals?${firstQuery.toString()}`, buildInit());
  if (!firstResponse.ok) {
    const error = new Error("Failed to fetch proposals") as FetchError;
    error.status = firstResponse.status;
    throw error;
  }

  const firstParsed = parseProposalsListResponse(await firstResponse.json());
  let proposals = [...firstParsed.proposals];
  let meta = firstParsed.meta;
  let latestMetaWithTotals = hasTotals(meta) ? meta : undefined;

  const totalPages = meta?.totalPages && meta.totalPages > 1 ? Math.floor(meta.totalPages) : 1;
  if (totalPages > 1) {
    const pageSize = meta?.pageSize && meta.pageSize > 0 ? Math.floor(meta.pageSize) : proposals.length || 20;
    const pageNumbers = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
    const pageResults = await Promise.all(
      pageNumbers.map(async (page) => {
        const response = await fetch(`/api/proposals?page=${page}&pageSize=${pageSize}`, buildInit());
        if (!response.ok) {
          const error = new Error("Failed to fetch proposals") as FetchError;
          error.status = response.status;
          throw error;
        }
        return parseProposalsListResponse(await response.json());
      }),
    );

    for (const parsed of pageResults) {
      proposals = proposals.concat(parsed.proposals);
      if (!parsed.meta) continue;

      if (hasTotals(parsed.meta)) {
        latestMetaWithTotals = mergeMeta(latestMetaWithTotals, parsed.meta);
        meta = latestMetaWithTotals;
      } else if (latestMetaWithTotals) {
        meta = mergeMeta(latestMetaWithTotals, parsed.meta);
      } else {
        meta = mergeMeta(meta, parsed.meta);
      }
    }
  }

  return { proposals, meta: latestMetaWithTotals ?? meta };
}

export async function fetchActiveUsersCount(
  range: { from: string; to: string },
  init?: RequestInit,
): Promise<number> {
  const baseInit: RequestInit = { ...(init ?? {}), cache: init?.cache ?? "no-store" };
  const params = new URLSearchParams({ aggregate: "activeUsers", from: range.from, to: range.to });
  const response = await fetch(`/api/proposals?${params.toString()}`, baseInit);

  if (!response.ok) {
    const error = new Error("Failed to fetch active proposal users") as FetchError;
    error.status = response.status;
    throw error;
  }

  const payload = (await response.json()) as unknown;
  const count = isRecord(payload) ? toNumber(payload.activeUsers ?? payload.count) : undefined;

  if (typeof count !== "number") {
    throw new Error("Invalid response for active users aggregate");
  }

  return count;
}

export async function fetchWonProposalsTotal(
  params: { userEmail: string; from: string; to: string },
  init?: RequestInit,
): Promise<number> {
  const baseInit: RequestInit = { ...(init ?? {}), cache: init?.cache ?? "no-store" };
  const searchParams = new URLSearchParams({
    aggregate: "sum",
    status: "WON",
    userEmail: params.userEmail,
    from: params.from,
    to: params.to,
  });

  const response = await fetch(`/api/proposals?${searchParams.toString()}`, baseInit);

  if (!response.ok) {
    const error = new Error("Failed to fetch won proposals total") as FetchError;
    error.status = response.status;
    throw error;
  }

  const payload = (await response.json()) as unknown;
  const total = isRecord(payload)
    ? toNumber(payload.totalAmount ?? payload.total ?? payload.sum ?? payload.value)
    : undefined;

  if (typeof total !== "number") {
    throw new Error("Invalid response for won proposals aggregate");
  }

  return total;
}
