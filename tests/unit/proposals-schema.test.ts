import { test } from "node:test";
import { strictEqual, throws } from "node:assert/strict";
import { createProposalRequestSchema } from "../../src/lib/schemas/proposals";

test("createProposalRequestSchema accepts minimal payload", () => {
  const parsed = createProposalRequestSchema.parse({
    companyName: "Acme",
    country: "Argentina",
    countryId: "AR",
    subsidiary: "Filial AR",
    subsidiaryId: "grp-1",
    totals: { monthly: 1000, hours: 20 },
    items: [
      {
        itemId: "item-1",
        sku: "SKU-1",
        name: "Servicio",
        quantity: 2,
        unitPrice: 500,
        unitNet: 500,
        devHours: 5,
      },
    ],
  });

  strictEqual(parsed.companyName, "Acme");
  strictEqual(parsed.items.length, 1);
});

test("createProposalRequestSchema rejects empty items", () => {
  throws(() =>
    createProposalRequestSchema.parse({
      companyName: "Acme",
      country: "Argentina",
      countryId: "AR",
      subsidiary: "Filial AR",
      subsidiaryId: "grp-1",
      totals: { monthly: 1000, hours: 20 },
      items: [],
    })
  );
});

