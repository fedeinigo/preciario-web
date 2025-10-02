import test from "node:test";
import assert from "node:assert/strict";

import { parseProposalsListResponse } from "../../src/app/components/features/proposals/lib/proposals-response";
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

