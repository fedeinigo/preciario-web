import "./setup-module-alias";
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { NextResponse } from "next/server";

import type { ApiSession } from "@/app/api/_utils/require-auth";
import * as requireAuth from "@/app/api/_utils/require-auth";
import * as pipedrive from "@/lib/pipedrive";
import { POST } from "@/app/api/pipedrive/sync/route";

describe("POST /api/pipedrive/sync", () => {
  it("returns the unauthorized response when the session guard fails", async () => {
    const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    mock.method(requireAuth, "requireApiSession", async () => ({
      session: null,
      response: unauthorizedResponse,
    }));

    mock.method(pipedrive, "replaceDealProducts", async () => {
      throw new Error("replaceDealProducts should not be called when unauthorized");
    });
    mock.method(pipedrive, "updateOneShotAndUrl", async () => {
      throw new Error("updateOneShotAndUrl should not be called when unauthorized");
    });

    try {
      const response = await POST(
        new Request("https://example.com/api/pipedrive/sync", {
          method: "POST",
          body: JSON.stringify({ dealId: 123 }),
          headers: { "Content-Type": "application/json" },
        }),
      );

      assert.equal(response.status, 401);
      const payload = (await response.json()) as { error: string };
      assert.equal(payload.error, "Unauthorized");
    } finally {
      mock.restoreAll();
    }
  });

  it("syncs deal products when the session guard passes", async () => {
    const session: ApiSession = {
      user: { id: "user-1", role: "usuario", team: null, positionName: null, leaderEmail: null },
      expires: new Date().toISOString(),
    };

    const requireMock = mock.method(requireAuth, "requireApiSession", async () => ({
      session,
      response: undefined,
    }));

    const replaceMock = mock.method(pipedrive, "replaceDealProducts", async () => ({
      deleted: 0,
      added: 2,
      missingSkus: [],
      failedSkus: [],
    }));

    const updateMock = mock.method(pipedrive, "updateOneShotAndUrl", async () => ({
      skipped: false,
    }));

    try {
      const response = await POST(
        new Request("https://example.com/api/pipedrive/sync", {
          method: "POST",
          body: JSON.stringify({
            dealId: "deal-123",
            proposalUrl: "https://example.com/proposal.pdf",
            oneShot: 99,
            items: [
              { sku: " SKU-1 ", quantity: 2, unitNet: 10 },
              { code: "SKU-2", quantity: 1, unit_price: 20 },
              { sku: "", quantity: 1, unitNet: 5 },
            ],
          }),
          headers: { "Content-Type": "application/json" },
        }),
      );

      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        ok: boolean;
        products: unknown;
      };
      assert.equal(payload.ok, true);

      assert.equal(requireMock.mock.calls.length, 1);

      assert.equal(replaceMock.mock.calls.length, 1);
      const replaceArgs = replaceMock.mock.calls[0]?.arguments ?? [];
      assert.equal(replaceArgs[0], "deal-123");
      assert.deepEqual(replaceArgs[1], [
        { sku: "SKU-1", quantity: 2, unitPrice: 10 },
        { sku: "SKU-2", quantity: 1, unitPrice: 20 },
      ]);

      assert.equal(updateMock.mock.calls.length, 1);
      const updateArgs = updateMock.mock.calls[0]?.arguments ?? [];
      assert.equal(updateArgs[0], "deal-123");
      assert.deepEqual(updateArgs[1], {
        oneShot: 99,
        proposalUrl: "https://example.com/proposal.pdf",
      });
    } finally {
      mock.restoreAll();
    }
  });
});

