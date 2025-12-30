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

export type ProposalFacets = {
  countries: string[];
};

export type ProposalsPageResult = ProposalsListResult & {
  facets?: ProposalFacets;
};

export type ProposalFilters = {
  from?: string;
  to?: string;
  userEmail?: string;
  team?: string;
  country?: string;
  idQuery?: string;
  companyQuery?: string;
  emailQuery?: string;
  status?: string;
  sku?: string;
};

export type ProposalStatsResponse = {
  kpis: {
    totalCount: number;
    uniqueUsers: number;
    uniqueCompanies: number;
    totalMonthly: number;
    avgPerProposal: number;
    wonCount: number;
    wonAmount: number;
    winRate: number;
    wonAvgTicket: number;
  };
  bySku: Array<{ sku: string; name: string; qty: number }>;
  byCountry: Array<{ country: string; total: number }>;
  byUser: Array<{ email: string | null; total: number }>;
  sparklines: {
    proposals: Array<{ date: string; value: number }>;
    uniqueUsers: Array<{ date: string; value: number }>;
    uniqueCompanies: Array<{ date: string; value: number }>;
    totalMonthly: Array<{ date: string; value: number }>;
    avgPerProposal: Array<{ date: string; value: number }>;
    wonCount: Array<{ date: string; value: number }>;
    wonAmount: Array<{ date: string; value: number }>;
    winRate: Array<{ date: string; value: number }>;
    wonAvgTicket: Array<{ date: string; value: number }>;
  };
  lastUpdated: string;
};

type FetchError = Error & { status?: number };

/**
 * El endpoint `/api/proposals` acepta el parametro `aggregate=activeUsers` junto con `from` y
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

function parseFacets(input: unknown): ProposalFacets | undefined {
  if (!isRecord(input)) return undefined;
  const facets = input.facets;
  if (!isRecord(facets)) return undefined;
  const rawCountries = facets.countries;
  const countries = Array.isArray(rawCountries)
    ? rawCountries.filter((value): value is string => typeof value === "string")
    : [];
  return { countries };
}

const hasTotals = (meta?: ProposalsListMeta): boolean =>
  Boolean(meta && (meta.totalItems !== undefined || meta.totalPages !== undefined));

const mergeMeta = (
  base: ProposalsListMeta | undefined,
  incoming: ProposalsListMeta,
): ProposalsListMeta => (base ? { ...base, ...incoming } : { ...incoming });

type FetchAllOptions = {
  pageSize?: number;
  maxPages?: number;
  skipCache?: boolean;
  cacheTtlMs?: number;
  requestInit?: RequestInit;
  filters?: ProposalFilters;
  includeItems?: boolean;
  sortKey?: string;
  sortDir?: string;
};

type FetchPageOptions = {
  page: number;
  pageSize: number;
  skipCache?: boolean;
  cacheTtlMs?: number;
  requestInit?: RequestInit;
  includeItems?: boolean;
  includeFacets?: boolean;
  sortKey?: string;
  sortDir?: string;
};

type FetchStatsOptions = {
  skipCache?: boolean;
  cacheTtlMs?: number;
  requestInit?: RequestInit;
};

type CachedEntry<T> = {
  key: string;
  expiresAt: number;
  promise: Promise<T>;
};

const DEFAULT_CACHE_TTL_MS = 30_000;
const pageCache = new Map<string, CachedEntry<ProposalsPageResult>>();
const listCache = new Map<string, CachedEntry<ProposalsListResult>>();
const statsCache = new Map<string, CachedEntry<ProposalStatsResponse>>();

const buildCacheKey = (key: string, init: RequestInit): string => {
  const cache = typeof init.cache === "string" ? init.cache : "no-store";
  const method = init.method ?? "GET";
  return `${key}|${cache}|${method}`;
};

function getCached<T>(cache: Map<string, CachedEntry<T>>, key: string): Promise<T> | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt > Date.now()) return entry.promise;
  cache.delete(key);
  return null;
}

function setCached<T>(
  cache: Map<string, CachedEntry<T>>,
  key: string,
  promise: Promise<T>,
  ttl: number,
) {
  const entry: CachedEntry<T> = {
    key,
    expiresAt: Date.now() + ttl,
    promise,
  };
  cache.set(key, entry);
  promise.catch(() => {
    if (cache.get(key)?.promise === promise) {
      cache.delete(key);
    }
  });
}

function appendParam(params: URLSearchParams, key: string, value?: string | null) {
  const trimmed = value?.trim();
  if (trimmed) {
    params.set(key, trimmed);
  }
}

function buildProposalSearchParams(
  filters: ProposalFilters,
  options?: {
    page?: number;
    pageSize?: number;
    sortKey?: string;
    sortDir?: string;
    includeItems?: boolean;
    includeFacets?: boolean;
  },
): URLSearchParams {
  const params = new URLSearchParams();

  if (options?.page) params.set("page", String(options.page));
  if (options?.pageSize) params.set("pageSize", String(options.pageSize));
  if (options?.sortKey) params.set("sortKey", options.sortKey);
  if (options?.sortDir) params.set("sortDir", options.sortDir);
  if (options?.includeItems !== undefined) {
    params.set("includeItems", String(options.includeItems));
  }
  if (options?.includeFacets !== undefined) {
    params.set("includeFacets", String(options.includeFacets));
  }

  appendParam(params, "from", filters.from);
  appendParam(params, "to", filters.to);
  appendParam(params, "userEmail", filters.userEmail);
  appendParam(params, "team", filters.team);
  appendParam(params, "country", filters.country);
  appendParam(params, "id", filters.idQuery);
  appendParam(params, "company", filters.companyQuery);
  appendParam(params, "email", filters.emailQuery);
  appendParam(params, "status", filters.status);
  appendParam(params, "sku", filters.sku);

  return params;
}

export function invalidateProposalsCache(): void {
  pageCache.clear();
  listCache.clear();
  statsCache.clear();
}

export async function fetchProposalsPage(
  filters: ProposalFilters,
  options: FetchPageOptions,
): Promise<ProposalsPageResult> {
  const {
    page,
    pageSize,
    skipCache,
    cacheTtlMs,
    requestInit,
    includeItems = true,
    includeFacets,
    sortKey,
    sortDir,
  } = options;
  const baseInit: RequestInit = { ...(requestInit ?? {}), cache: requestInit?.cache ?? "no-store" };
  const params = buildProposalSearchParams(filters, {
    page,
    pageSize,
    includeItems,
    includeFacets,
    sortKey,
    sortDir,
  });

  const cacheKey = buildCacheKey(`page|${params.toString()}`, baseInit);
  if (!skipCache) {
    const cached = getCached(pageCache, cacheKey);
    if (cached) return cached;
  }

  const fetchPromise = (async (): Promise<ProposalsPageResult> => {
    const response = await fetch(`/api/proposals?${params.toString()}`, baseInit);
    if (!response.ok) {
      const error = new Error("Failed to fetch proposals") as FetchError;
      error.status = response.status;
      throw error;
    }
    const payload = (await response.json()) as unknown;
    const { proposals, meta } = parseProposalsListResponse(payload);
    const facets = parseFacets(payload);
    return { proposals, meta, facets };
  })();

  if (!skipCache) {
    setCached(pageCache, cacheKey, fetchPromise, cacheTtlMs && cacheTtlMs > 0 ? cacheTtlMs : DEFAULT_CACHE_TTL_MS);
  }

  return fetchPromise;
}

export async function fetchProposalsFacets(filters: ProposalFilters): Promise<ProposalFacets> {
  const result = await fetchProposalsPage(filters, {
    page: 1,
    pageSize: 1,
    includeItems: false,
    includeFacets: true,
  });
  return result.facets ?? { countries: [] };
}

export async function fetchAllProposals(options?: FetchAllOptions): Promise<ProposalsListResult> {
  const {
    pageSize: requestedPageSize,
    maxPages,
    skipCache,
    cacheTtlMs,
    requestInit,
    filters = {},
    includeItems = true,
    sortKey,
    sortDir,
  } = options ?? {};
  const baseInit: RequestInit = { ...(requestInit ?? {}), cache: requestInit?.cache ?? "no-store" };

  const normalizedRequested =
    typeof requestedPageSize === "number" && requestedPageSize > 0
      ? Math.floor(requestedPageSize)
      : undefined;
  const firstPageSize = normalizedRequested ?? 100;

  const baseParams = buildProposalSearchParams(filters, {
    page: 1,
    pageSize: firstPageSize,
    includeItems,
    sortKey,
    sortDir,
  });

  const cacheKey = buildCacheKey(
    `all|${baseParams.toString()}|${maxPages ?? "all"}`,
    baseInit,
  );
  if (!skipCache) {
    const cached = getCached(listCache, cacheKey);
    if (cached) return cached;
  }

  const fetchPromise = (async (): Promise<ProposalsListResult> => {
    const firstResponse = await fetch(`/api/proposals?${baseParams.toString()}`, baseInit);
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
    const allowedPages =
      typeof maxPages === "number" && maxPages > 0 ? Math.min(totalPages, Math.floor(maxPages)) : totalPages;

    if (allowedPages > 1) {
      const pageSize = meta?.pageSize && meta.pageSize > 0 ? Math.floor(meta.pageSize) : proposals.length || 20;
      const pagePromises = [] as Array<Promise<ProposalsListResult>>;
      for (let page = 2; page <= allowedPages; page += 1) {
        const pageParams = new URLSearchParams(baseParams);
        pageParams.set("page", String(page));
        pageParams.set("pageSize", String(pageSize));
        pagePromises.push(
          fetch(`/api/proposals?${pageParams.toString()}`, baseInit).then(async (response) => {
            if (!response.ok) {
              const error = new Error("Failed to fetch proposals") as FetchError;
              error.status = response.status;
              throw error;
            }
            return parseProposalsListResponse(await response.json());
          }),
        );
      }

      const pageResults = await Promise.all(pagePromises);
      pageResults.forEach((parsed) => {
        proposals = proposals.concat(parsed.proposals);
        if (!parsed.meta) return;
        if (hasTotals(parsed.meta)) {
          latestMetaWithTotals = mergeMeta(latestMetaWithTotals, parsed.meta);
          meta = latestMetaWithTotals;
        } else if (latestMetaWithTotals) {
          meta = mergeMeta(latestMetaWithTotals, parsed.meta);
        } else {
          meta = mergeMeta(meta, parsed.meta);
        }
      });
    }

    return { proposals, meta: latestMetaWithTotals ?? meta };
  })();

  if (!skipCache) {
    setCached(listCache, cacheKey, fetchPromise, cacheTtlMs && cacheTtlMs > 0 ? cacheTtlMs : DEFAULT_CACHE_TTL_MS);
  }

  return fetchPromise;
}

export async function fetchProposalStats(
  filters: ProposalFilters,
  options?: FetchStatsOptions,
): Promise<ProposalStatsResponse> {
  const { skipCache, cacheTtlMs, requestInit } = options ?? {};
  const baseInit: RequestInit = { ...(requestInit ?? {}), cache: requestInit?.cache ?? "no-store" };
  const params = buildProposalSearchParams(filters);
  const cacheKey = buildCacheKey(`stats|${params.toString()}`, baseInit);

  if (!skipCache) {
    const cached = getCached(statsCache, cacheKey);
    if (cached) return cached;
  }

  const fetchPromise = (async (): Promise<ProposalStatsResponse> => {
    const response = await fetch(`/api/proposals/stats?${params.toString()}`, baseInit);
    if (!response.ok) {
      const error = new Error("Failed to fetch proposal stats") as FetchError;
      error.status = response.status;
      throw error;
    }
    return (await response.json()) as ProposalStatsResponse;
  })();

  if (!skipCache) {
    setCached(statsCache, cacheKey, fetchPromise, cacheTtlMs && cacheTtlMs > 0 ? cacheTtlMs : DEFAULT_CACHE_TTL_MS);
  }

  return fetchPromise;
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
