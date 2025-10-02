import "./setup-module-alias";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildReplaceRequests, resolveHourlyRate } from "@/app/api/proposals/create/route";

describe("create proposals route", () => {
  it("uses PROPOSALS_ONESHOT_RATE when building valor_hora placeholder", () => {
    const hourlyRate = resolveHourlyRate({ PROPOSALS_ONESHOT_RATE: "75" });

    const requests = buildReplaceRequests({
      body: {
        companyName: "ACME",
        country: "AR",
        subsidiary: "BA",
        items: [
          { name: "Dev", quantity: 2, unitPrice: 100, devHours: 5 },
        ],
        totals: {
          monthly: 200,
          oneShot: 750,
          hours: 10,
        },
      },
      conditionsText: "Condiciones",
      whatsappRows: [],
      hourlyRate,
      currentDate: new Date("2024-01-01T00:00:00Z"),
    });

    type ReplaceAllTextRequest = {
      replaceAllText?: {
        containsText?: { text?: string };
        replaceText?: string;
      };
    };

    const valorHoraRequest = requests.find((req): req is ReplaceAllTextRequest => {
      const replaceAllText = (req as ReplaceAllTextRequest).replaceAllText;
      const text = replaceAllText?.containsText?.text;
      return typeof text === "string" && text === "<-valor_hora->";
    });

    assert.ok(valorHoraRequest, "valor_hora replacement should be present");
    assert.strictEqual(
      valorHoraRequest.replaceAllText?.replaceText,
      "US$ 75",
    );
  });
});
