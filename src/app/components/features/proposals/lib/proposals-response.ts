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

export async function fetchAllProposals(init?: RequestInit): Promise<ProposalsListResult> {
  const baseInit: RequestInit = { ...init, cache: init?.cache ?? "no-store" };
  const buildInit = () => ({ ...baseInit });

  const firstResponse = await fetch("/api/proposals", buildInit());
  if (!firstResponse.ok) {
    const error = new Error("Failed to fetch proposals") as FetchError;
    error.status = firstResponse.status;
    throw error;
  }

  const firstParsed = parseProposalsListResponse(await firstResponse.json());
  let proposals = [...firstParsed.proposals];
  let meta = firstParsed.meta;

  const totalPages = meta?.totalPages && meta.totalPages > 1 ? Math.floor(meta.totalPages) : 1;
  if (totalPages > 1) {
    const pageSize = meta?.pageSize && meta.pageSize > 0 ? Math.floor(meta.pageSize) : proposals.length || 20;
    for (let page = 2; page <= totalPages; page++) {
      const response = await fetch(`/api/proposals?page=${page}&pageSize=${pageSize}`, buildInit());
      if (!response.ok) {
        const error = new Error("Failed to fetch proposals") as FetchError;
        error.status = response.status;
        throw error;
      }
      const parsed = parseProposalsListResponse(await response.json());
      proposals = proposals.concat(parsed.proposals);
      meta = parsed.meta ?? meta;
    }
  }

  return { proposals, meta };
}
