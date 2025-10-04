import "./setup-paths";
import test from "node:test";
import assert from "node:assert/strict";

import { loadNavbarProgress } from "../../src/app/components/navbar/load-progress";

const sampleRange = { from: "2024-01-01", to: "2024-03-31" } as const;

const createTrackingFetcher = (value: number) => {
  const calls: Array<{ userEmail: string; from: string; to: string }> = [];
  const fn = async (params: { userEmail: string; from: string; to: string }) => {
    calls.push(params);
    return value;
  };
  return { calls, fn };
};

test("loadNavbarProgress delegates to the aggregate helper", async () => {
  const { calls, fn } = createTrackingFetcher(4200);
  const total = await loadNavbarProgress(
    { userEmail: "user@example.com", range: sampleRange },
    fn,
  );

  assert.equal(total, 4200);
  assert.deepEqual(calls, [
    { userEmail: "user@example.com", from: sampleRange.from, to: sampleRange.to },
  ]);
});

test("navbar progress flow uses the aggregate total to update state", async () => {
  {
    let progress = -1;
    try {
      const total = await loadNavbarProgress(
        { userEmail: "user@example.com", range: sampleRange },
        async () => 2750,
      );
      progress = total;
    } catch {
      progress = 0;
    }
    assert.equal(progress, 2750);
  }

  {
    let progress = -1;
    try {
      const total = await loadNavbarProgress(
        { userEmail: "user@example.com", range: sampleRange },
        async () => {
          throw new Error("boom");
        },
      );
      progress = total;
    } catch {
      progress = 0;
    }
    assert.equal(progress, 0);
  }
});
