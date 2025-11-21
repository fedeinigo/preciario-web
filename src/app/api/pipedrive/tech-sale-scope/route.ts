import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import { updateTechSaleScope } from "@/lib/pipedrive";

function parseDealId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const numeric = Number(value.trim());
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return null;
}

function normalizeScopeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("El enlace no puede estar vacío.");
  }
  const url = new URL(trimmed);
  return url.toString();
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;

  let body: { dealId?: number | string; scopeUrl?: string } | null = null;
  try {
    body = (await request.json()) as { dealId?: number | string; scopeUrl?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const dealId = parseDealId(body?.dealId);
  if (dealId === null) {
    return NextResponse.json(
      { ok: false, error: "ID del deal inválido" },
      { status: 400 },
    );
  }

  const rawUrl = typeof body?.scopeUrl === "string" ? body.scopeUrl : "";
  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeScopeUrl(rawUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "URL inválida";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  try {
    await updateTechSaleScope(dealId, normalizedUrl);
    return NextResponse.json({ ok: true, scopeUrl: normalizedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
