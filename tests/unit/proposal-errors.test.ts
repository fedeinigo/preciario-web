import "./setup";

import test from "node:test";
import assert from "node:assert/strict";

import {
  parseProposalErrorResponse,
  createProposalCodeError,
} from "../../src/app/components/features/proposals/lib/errors";

test("parseProposalErrorResponse devuelve código unauthorized para 401/403", async () => {
  const res = new Response("{}", { status: 401 });
  const error = await parseProposalErrorResponse(res, "filiales.loadFailed", {
    unauthorizedCode: "filiales.unauthorized",
  });
  assert.deepEqual(error, createProposalCodeError("filiales.unauthorized"));
});

test("parseProposalErrorResponse usa fallback si falta unauthorizedCode", async () => {
  const res = new Response(null, { status: 403 });
  const error = await parseProposalErrorResponse(res, "glossary.loadFailed");
  assert.deepEqual(error, createProposalCodeError("glossary.loadFailed"));
});
