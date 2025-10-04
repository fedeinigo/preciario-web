import test from "node:test";
import assert from "node:assert/strict";

import {
  fetchAllProposals,
  fetchWonProposalsTotal,
  parseProposalsListResponse,
} from "../../src/app/components/features/proposals/lib/proposals-response";
import type { ProposalRecord } from "../../src/lib/types";

const sampleProposal: ProposalRecord = {
  id: "p-1",
  seq: 1,
  companyName: "Acme",
  country: "Argentina",
  countryId: "AR",
  subsidiary: "Acme Subsidiary",
  subsidiaryId: "AR-1",
  totalAmount: 1000,
  totalHours: 40,
  oneShot: 0,
  docUrl: null,
  userId: "user-1",
  userEmail: "user@example.com",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

test("parseProposalsListResponse handles array payloads", () => {
  const { proposals, meta } = parseProposalsListResponse([sampleProposal]);
  assert.equal(proposals.length, 1);
  assert.equal(proposals[0]?.id, sampleProposal.id);
  assert.equal(meta, undefined);
});

test("parseProposalsListResponse handles object payloads with meta", () => {
  const response = {
    data: [sampleProposal],
    meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
  };
  const { proposals, meta } = parseProposalsListResponse(response);
  assert.equal(proposals.length, 1);
  assert.equal(meta?.page, 1);
  assert.equal(meta?.totalItems, 1);
  assert.equal(meta?.totalPages, 1);
});

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const createResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
  }) as Response;

test("fetchAllProposals fetches remaining pages in parallel and preserves order", async () => {
  const originalFetch = globalThis.fetch;
  const fetchCalls: string[] = [];
  const releases: Array<() => void> = [];

  const proposalsByPage: ProposalRecord[][] = [
    [
      { ...sampleProposal, id: "p-1" },
      { ...sampleProposal, id: "p-2", seq: 2 },
    ],
    [
      { ...sampleProposal, id: "p-3", seq: 3 },
      { ...sampleProposal, id: "p-4", seq: 4 },
    ],
    [
      { ...sampleProposal, id: "p-5", seq: 5 },
      { ...sampleProposal, id: "p-6", seq: 6 },
    ],
  ];

  const responses = [
    { data: proposalsByPage[0], meta: { page: 1, pageSize: 2, totalItems: 6, totalPages: 3 } },
    { data: proposalsByPage[1], meta: { page: 2 } },
    { data: proposalsByPage[2], meta: { page: 3, totalItems: 6, totalPages: 3 } },
  ];

  let callIndex = 0;
  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    const responseBody = responses[callIndex];
    fetchCalls.push(url);
    callIndex += 1;

    if (!responseBody) {
      throw new Error(`Unexpected fetch call to ${url}`);
    }

    if (fetchCalls.length === 1) {
      return Promise.resolve(createResponse(responseBody));
    }

    const deferred = createDeferred<Response>();
    releases.push(() => deferred.resolve(createResponse(responseBody)));
    return deferred.promise;
  }) as typeof fetch;

  try {
    const resultPromise = fetchAllProposals();

    await Promise.resolve();
    await Promise.resolve();

    assert.equal(fetchCalls.length, 3);
    assert.equal(fetchCalls[0], "/api/proposals?page=1&pageSize=100");
    assert.equal(fetchCalls[1], "/api/proposals?page=2&pageSize=2");
    assert.equal(fetchCalls[2], "/api/proposals?page=3&pageSize=2");

    releases.forEach((release) => release());

    const { proposals, meta } = await resultPromise;
    assert.deepEqual(
      proposals.map((proposal) => proposal.id),
      proposalsByPage.flat().map((proposal) => proposal.id),
    );
    assert.equal(meta?.page, 3);
    assert.equal(meta?.pageSize, 2);
    assert.equal(meta?.totalItems, 6);
    assert.equal(meta?.totalPages, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchWonProposalsTotal requests the aggregate endpoint with no-store caching", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push({ url, init });
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ totalAmount: 3500, count: 2 }),
    } as Response);
  }) as typeof fetch;

  try {
    const total = await fetchWonProposalsTotal({
      userEmail: "user@example.com",
      from: "2024-01-01",
      to: "2024-03-31",
    });

    assert.equal(total, 3500);
    const [call] = calls;
    assert.ok(call, "fetch should be called");
    assert.equal(
      call.url,
      "/api/proposals?aggregate=sum&status=WON&userEmail=user%40example.com&from=2024-01-01&to=2024-03-31",
    );
    assert.equal(call.init?.cache, "no-store");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchWonProposalsTotal throws when the response is not ok", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    return Promise.resolve({
      ok: false,
      status: 500,
      json: async () => ({ message: "error", url }),
    } as Response);
  }) as typeof fetch;

  try {
    await assert.rejects(() =>
      fetchWonProposalsTotal({ userEmail: "user@example.com", from: "2024-01-01", to: "2024-03-31" }),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

