type PricingOk = {
  ok: true;
  totalQty: number;
  totalAmount: number;
  unitPrice: number;
};
type PricingErr = { ok: false; error: string };

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
  const data = (await res.json()) as PricingOk | PricingErr;
  if (!data.ok) throw new Error(data.error);
  return data;
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
  const data = (await res.json()) as PricingOk | PricingErr;
  if (!data.ok) throw new Error(data.error);
  return data;
}
