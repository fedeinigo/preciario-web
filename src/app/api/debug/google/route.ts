// src/app/api/debug/google/route.ts
import { NextResponse } from "next/server";
import { ensureSessionRole, requireApiSession } from "@/app/api/_utils/require-auth";
import { createProposalDocSystem, type AnyItemInput } from "@/lib/google-system";

type DebugBody = Partial<{
  companyName: string;
  country: string;
  subsidiary: string;
  items: AnyItemInput[];
}>;

export async function POST(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const forbidden = ensureSessionRole(session, ["superadmin"], 403);
  if (forbidden) return forbidden;

  // Body tipado: si falla el parseo usamos {} tipado como DebugBody
  const json = (await req.json().catch(() => ({}))) as DebugBody;

  const companyName = json.companyName ?? "Debug SA";
  const country = json.country ?? "Argentina";
  const subsidiary = json.subsidiary; // opcional

  const items: AnyItemInput[] =
    Array.isArray(json.items) && json.items.length > 0
      ? json.items
      : [{ sku: "wcx-001", quantity: 1 }];

  try {
    // createProposalDocSystem calcula totales internamente
    const result = await createProposalDocSystem({
      companyName,
      country,
      subsidiary,
      items,
    });

    // result suele incluir { docId, docUrl } y puede traer mas campos (totals, subsidiary)
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
