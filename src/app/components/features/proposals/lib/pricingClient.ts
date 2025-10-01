import {
  createProposalCodeError,
  isProposalError,
  parseProposalErrorResponse,
  type ProposalError,
} from "./errors";

type PricingOk = {
  ok: true;
  totalQty: number;
  totalAmount: number;
  unitPrice: number;
};
type PricingErr = { ok: false; error?: string };

async function parsePricingError(
  res: Response,
  fallbackCode: "pricing.whatsAppFailed" | "pricing.minutesFailed"
): Promise<ProposalError> {
  try {
    const data = (await res.clone().json()) as PricingErr;
    if (typeof data?.error === "string" && data.error.trim()) {
      return { kind: "message", message: data.error };
    }
  } catch {
    // ignore JSON parsing errors
  }
  return parseProposalErrorResponse(res, fallbackCode);
}

async function ensurePricingOk(
  res: Response,
  fallbackCode: "pricing.whatsAppFailed" | "pricing.minutesFailed"
): Promise<PricingOk> {
  try {
    if (!res.ok) {
      throw await parsePricingError(res, fallbackCode);
    }
    const data = (await res.json()) as PricingOk | PricingErr;
    if (!data.ok) {
      if (typeof data.error === "string" && data.error.trim()) {
        throw { kind: "message", message: data.error } satisfies ProposalError;
      }
      throw createProposalCodeError(fallbackCode);
    }
    return data;
  } catch (error) {
    if (isProposalError(error)) throw error;
    throw createProposalCodeError(fallbackCode);
  }
}

export async function priceWhatsApp(input: {
  subsidiary: string;
  destCountry: string;
  kind: "marketing" | "utility" | "auth";
  qty: number;
}): Promise<PricingOk> {
  const body = {
    kind: "whatsapp",
    subsidiary: input.subsidiary,
    destCountry: input.destCountry,
    marketingQty: input.kind === "marketing" ? input.qty : 0,
    utilityQty:   input.kind === "utility"   ? input.qty : 0,
    authQty:      input.kind === "auth"      ? input.qty : 0,
  };
  const res = await fetch("/api/pricing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return ensurePricingOk(res, "pricing.whatsAppFailed");
}

export async function priceMinutes(input: {
  subsidiary: string;
  destCountry: string;
  kind: "out" | "in";
  qty: number;
}): Promise<PricingOk> {
  const body = {
    kind: "minutes",
    subsidiary: input.subsidiary,
    destCountry: input.destCountry,
    outQty: input.kind === "out" ? input.qty : 0,
    inQty:  input.kind === "in"  ? input.qty : 0,
  };
  const res = await fetch("/api/pricing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return ensurePricingOk(res, "pricing.minutesFailed");
}
