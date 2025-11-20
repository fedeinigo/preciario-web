import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import { assignDealToMapache } from "@/lib/pipedrive";

function extractDealId(link: string | null | undefined): number | null {
  if (!link) return null;
  const match = link.match(/deal\/(\d+)/i);
  if (match?.[1]) {
    return Number(match[1]);
  }
  const numeric = link.replace(/\D+/g, "");
  if (numeric) {
    const value = Number(numeric);
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

export async function POST(request: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const mapacheName = session?.user?.name?.trim();
  if (!mapacheName) {
    return NextResponse.json(
      { ok: false, error: "No se pudo resolver tu nombre de usuario." },
      { status: 400 },
    );
  }

  let body: { dealLink?: string } | null = null;
  try {
    body = (await request.json()) as { dealLink?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const dealId = extractDealId(body?.dealLink ?? "");
  if (!dealId) {
    return NextResponse.json(
      { ok: false, error: "Link de Pipedrive inválido. Usa https://.../deal/{id}" },
      { status: 400 },
    );
  }

  try {
    await assignDealToMapache(dealId, mapacheName);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
