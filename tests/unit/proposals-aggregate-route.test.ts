import "./setup-module-alias";
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { Prisma } from "@prisma/client";

import * as requireAuth from "@/app/api/_utils/require-auth";
import prisma from "@/lib/prisma";
import { GET } from "@/app/api/proposals/route";

describe("GET /api/proposals aggregate=sum", () => {
  it("filters by user, status and date before aggregating total", async () => {
    mock.method(requireAuth, "requireApiSession", async () => ({ response: undefined }));

    const aggregateCalls: Prisma.ProposalAggregateArgs[] = [];
    const delegate = prisma.proposal as unknown as {
      aggregate: (args: Prisma.ProposalAggregateArgs) => Promise<Prisma.AggregateProposal>;
    };
    const originalAggregate = delegate.aggregate;
    delegate.aggregate = (args: Prisma.ProposalAggregateArgs) => {
      aggregateCalls.push(args);
      return Promise.resolve({
        _sum: { totalAmount: new Prisma.Decimal(3500) },
        _count: { _all: 2 },
      } as unknown as Prisma.AggregateProposal);
    };

    try {
      const response = await GET(
        new Request(
          "https://example.com/api/proposals?aggregate=sum&userEmail=user%40example.com&status=won&from=2024-01-01&to=2024-03-31"
        )
      );

      assert.equal(response.status, 200);
      const payload = (await response.json()) as { totalAmount: number; count: number };
      assert.equal(payload.totalAmount, 3500);
      assert.equal(payload.count, 2);

      const [call] = aggregateCalls;
      assert.ok(call, "aggregate should be invoked");
      assert.equal(call.where?.userEmail, "user@example.com");
      assert.equal(call.where?.status, "WON");
      const createdAtFilter = call.where?.createdAt as Prisma.DateTimeFilter | undefined;
      assert.ok(createdAtFilter?.gte instanceof Date);
      assert.ok(createdAtFilter?.lte instanceof Date);
      assert.equal(
        (createdAtFilter?.gte as Date).toISOString(),
        new Date("2024-01-01T00:00:00.000Z").toISOString()
      );
      assert.equal(
        (createdAtFilter?.lte as Date).toISOString(),
        new Date("2024-03-31T23:59:59.999Z").toISOString()
      );
    } finally {
      mock.restoreAll();
      delegate.aggregate = originalAggregate;
    }
  });
});

describe("GET /api/proposals aggregate=activeUsers", () => {
  it("counts distinct non-null userEmail values in the requested range", async () => {
    mock.method(requireAuth, "requireApiSession", async () => ({ response: undefined }));

    const groupByCalls: Prisma.ProposalGroupByArgs[] = [];
    const delegate = prisma.proposal as unknown as {
      groupBy: (
        args: Prisma.ProposalGroupByArgs,
      ) => Promise<Array<{ userEmail: string | null }>>;
    };
    const originalGroupBy = delegate.groupBy;
    delegate.groupBy = (args: Prisma.ProposalGroupByArgs) => {
      groupByCalls.push(args);
      return Promise.resolve([
        { userEmail: "one@example.com" },
        { userEmail: "two@example.com" },
        { userEmail: "three@example.com" },
      ]);
    };

    try {
      const response = await GET(
        new Request("https://example.com/api/proposals?aggregate=activeUsers&from=2024-01-01&to=2024-01-31"),
      );

      assert.equal(response.status, 200);
      const payload = (await response.json()) as { activeUsers: number };
      assert.equal(payload.activeUsers, 3);

      const [call] = groupByCalls;
      assert.ok(call, "groupBy should be invoked");
      assert.deepEqual(call.by, ["userEmail"]);
      assert.deepEqual(call.where?.userEmail, { not: null });
      const createdAtFilter = call.where?.createdAt as Prisma.DateTimeFilter | undefined;
      assert.ok(createdAtFilter?.gte instanceof Date);
      assert.ok(createdAtFilter?.lte instanceof Date);
    } finally {
      mock.restoreAll();
      delegate.groupBy = originalGroupBy;
    }
  });
});
