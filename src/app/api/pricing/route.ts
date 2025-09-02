// src/app/api/pricing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";

/* ===================== Tipos de payloads soportados ===================== */
type WhatsAppNewPayload = {
  kind: "whatsapp";
  subsidiary: string;
  destCountry: string;
  variant: "marketing" | "utility" | "auth";
  qty: number;
};
type WhatsAppOldPayload = {
  kind: "whatsapp";
  subsidiary: string;
  marketingQty: number;
  utilityQty: number;
  authQty: number;
  destCountry?: string;
};
type MinutesNewPayload = {
  kind: "minutes";
  subsidiary: string;
  destCountry: string;
  variant: "out" | "in";
  qty: number;
};
type MinutesOldPayload = {
  kind: "minutes";
  subsidiary: string;
  destCountry: string;
  outQty: number;
  inQty: number;
};

type AnyPayload =
  | WhatsAppNewPayload
  | WhatsAppOldPayload
  | MinutesNewPayload
  | MinutesOldPayload;

type PricingOk = { ok: true; totalQty: number; totalAmount: number; unitPrice: number };
type PricingErr = { ok: false; error: string };

/* ===================== Helpers ===================== */

function bad(reason: string, status = 400): NextResponse<PricingErr> {
  return NextResponse.json({ ok: false, error: reason }, { status });
}
function assertEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}
function isWhatsAppNew(p: AnyPayload): p is WhatsAppNewPayload {
  return p.kind === "whatsapp" && "variant" in p && "qty" in p;
}
function isWhatsAppOld(p: AnyPayload): p is WhatsAppOldPayload {
  return p.kind === "whatsapp" && ("marketingQty" in p || "utilityQty" in p || "authQty" in p);
}
function isMinutesNew(p: AnyPayload): p is MinutesNewPayload {
  return p.kind === "minutes" && "variant" in p && "qty" in p;
}
function isMinutesOld(p: AnyPayload): p is MinutesOldPayload {
  return p.kind === "minutes" && "outQty" in p && "inQty" in p;
}

/** Convierte strings tipo "$0,095790" | "1.234,56" | "1,234.56" a número */
function parseMoney(input: unknown): number {
  if (typeof input !== "string") return Number(input) || 0;
  let s = input.replace(/\s+/g, "").replace(/\$/g, "");
  if (s.includes(",") && !s.includes(".")) {
    s = s.replace(/\./g, ""); // miles
    s = s.replace(",", ".");  // coma decimal
  } else {
    s = s.replace(/,/g, "");  // miles en en-US
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/* ====== Tipos y helpers para el refresh de token ====== */
interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}
function parseGoogleTokenResponse(raw: string): GoogleTokenResponse {
  try {
    const json = JSON.parse(raw) as unknown;
    if (typeof json !== "object" || json === null) return {};
    const obj = json as Record<string, unknown>;
    return {
      access_token: typeof obj.access_token === "string" ? obj.access_token : undefined,
      expires_in: typeof obj.expires_in === "number" ? obj.expires_in : undefined,
      refresh_token: typeof obj.refresh_token === "string" ? obj.refresh_token : undefined,
      scope: typeof obj.scope === "string" ? obj.scope : undefined,
      token_type: typeof obj.token_type === "string" ? obj.token_type : undefined,
    };
  } catch {
    return {};
  }
}

async function refreshAccessTokenForUser(userId: string): Promise<string> {
  const { prisma } = await import("@/lib/prisma");
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { id: true, refresh_token: true },
  });
  if (!account?.refresh_token) {
    throw new Error("No hay refresh_token de Google. Vuelve a iniciar sesión con Google.");
  }

  const clientId = assertEnv("GOOGLE_CLIENT_ID");
  const clientSecret = assertEnv("GOOGLE_CLIENT_SECRET");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  const raw = await res.text();
  const parsed = parseGoogleTokenResponse(raw);

  if (!res.ok || !parsed.access_token) {
    throw new Error(`Error al refrescar token: ${raw}`);
  }

  const expiresAt =
    typeof parsed.expires_in === "number" ? Math.floor(Date.now() / 1000) + parsed.expires_in : undefined;

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: parsed.access_token,
      ...(typeof expiresAt === "number" ? { expires_at: expiresAt } : {}),
      ...(parsed.refresh_token ? { refresh_token: parsed.refresh_token } : {}),
    },
  });

  return parsed.access_token;
}

async function getSheetsClientForUser(): Promise<sheets_v4.Sheets> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  const accessToken = await refreshAccessTokenForUser(session.user.id as string);
  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth: oauth2 });
}

/* ====== Lookups en la Sheet ====== */
function lookupWhatsAppPriceRow(rows: string[][], subsidiary: string, destCountry: string) {
  return rows.find(
    (r) =>
      (r[0] ?? "").trim().toUpperCase() === subsidiary.trim().toUpperCase() &&
      (r[1] ?? "").trim().toUpperCase() === destCountry.trim().toUpperCase()
  );
}
function lookupMinutesPriceRow(
  rows: string[][],
  subsidiary: string,
  destCountry: string,
  expectedType: "Saliente" | "Entrante"
) {
  return rows.find(
    (r) =>
      (r[0] ?? "").trim().toUpperCase() === subsidiary.trim().toUpperCase() &&
      (r[1] ?? "").trim().toUpperCase() === destCountry.trim().toUpperCase() &&
      (r[2] ?? "").trim().toUpperCase() === expectedType.toUpperCase()
  );
}

/* ===================== Handler ===================== */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return bad("Unauthorized", 401);

    const SHEET_ID = assertEnv("GOOGLE_SHEET_ID");
    assertEnv("GOOGLE_SHEET_TAB");
    const WHATS_RANGE = assertEnv("SHEETS_WHATSAPP_RANGE");
    const OUT_RANGE = assertEnv("SHEETS_MINUTES_OUT_RANGE");
    const IN_RANGE = assertEnv("SHEETS_MINUTES_IN_RANGE");

    const body = (await req.json()) as AnyPayload;
    if (!body || typeof body !== "object" || !("kind" in body)) {
      return bad("Missing kind");
    }

    const sheets = await getSheetsClientForUser();

    /* ------------------- WhatsApp ------------------- */
    if (body.kind === "whatsapp") {
      const wres = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: WHATS_RANGE,
      });
      const rows = (wres.data.values ?? []) as string[][];

      if (isWhatsAppNew(body)) {
        const { subsidiary, destCountry, variant } = body;
        const qty = Math.max(0, Number(body.qty) || 0);
        if (!subsidiary || !destCountry) return bad("Bad whatsapp payload");
        if (qty <= 0) return bad("Total qty is zero");

        const row = lookupWhatsAppPriceRow(rows, subsidiary, destCountry);
        if (!row) return bad("No price row for WhatsApp");

        const pMarketing = parseMoney(row[3]);
        const pUtility = parseMoney(row[4]);
        const pAuth = parseMoney(row[5]);

        const unit = variant === "marketing" ? pMarketing : variant === "utility" ? pUtility : pAuth;
        const totalAmount = qty * unit;
        const ok: PricingOk = { ok: true, totalQty: qty, totalAmount, unitPrice: unit };
        return NextResponse.json(ok);
      }

      if (isWhatsAppOld(body)) {
        const subsidiary = body.subsidiary;
        const dest = body.destCountry ?? body.subsidiary;
        const row = lookupWhatsAppPriceRow(rows, subsidiary, dest);
        if (!row) return bad("No price row for WhatsApp");

        const pMarketing = parseMoney(row[3]);
        const pUtility = parseMoney(row[4]);
        const pAuth = parseMoney(row[5]);

        const mQty = Math.max(0, Number(body.marketingQty) || 0);
        const uQty = Math.max(0, Number(body.utilityQty) || 0);
        const aQty = Math.max(0, Number(body.authQty) || 0);

        const totalQty = mQty + uQty + aQty;
        if (totalQty === 0) return bad("Total qty is zero");

        const totalAmount = mQty * pMarketing + uQty * pUtility + aQty * pAuth;
        const unitPrice = totalAmount / totalQty;

        const ok: PricingOk = { ok: true, totalQty, totalAmount, unitPrice };
        return NextResponse.json(ok);
      }

      return bad("Invalid whatsapp payload");
    }

    /* ------------------- Minutos ------------------- */
    if (body.kind === "minutes") {
      if (isMinutesNew(body)) {
        const { subsidiary, destCountry, variant } = body;
        const qty = Math.max(0, Number(body.qty) || 0);
        if (!subsidiary || !destCountry) return bad("Bad minutes payload");
        if (qty <= 0) return bad("Total qty is zero");

        if (variant === "out") {
          const o = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: OUT_RANGE });
          const orows = (o.data.values ?? []) as string[][];
          const orow = lookupMinutesPriceRow(orows, subsidiary, destCountry, "Saliente");
          if (!orow) return bad("No price row for Outgoing");
          const ppmOut = parseMoney(orow[3]);
          const totalAmount = qty * ppmOut;
          const ok: PricingOk = { ok: true, totalQty: qty, totalAmount, unitPrice: ppmOut };
          return NextResponse.json(ok);
        } else {
          const i = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: IN_RANGE });
          const irows = (i.data.values ?? []) as string[][];
          const irow = lookupMinutesPriceRow(irows, subsidiary, destCountry, "Entrante");
          if (!irow) return bad("No price row for Incoming");
          const ppmIn = parseMoney(irow[3]);
          const totalAmount = qty * ppmIn;
          const ok: PricingOk = { ok: true, totalQty: qty, totalAmount, unitPrice: ppmIn };
          return NextResponse.json(ok);
        }
      }

      if (isMinutesOld(body)) {
        const { subsidiary, destCountry } = body;
        if (!subsidiary || !destCountry) return bad("Bad minutes payload");

        let totalQty = 0;
        let totalAmount = 0;

        const outQ = Math.max(0, Number(body.outQty) || 0);
        if (outQ > 0) {
          const o = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: OUT_RANGE });
          const orows = (o.data.values ?? []) as string[][];
          const orow = lookupMinutesPriceRow(orows, subsidiary, destCountry, "Saliente");
          if (!orow) return bad("No price row for Outgoing");
          const ppmOut = parseMoney(orow[3]);
          totalQty += outQ;
          totalAmount += outQ * ppmOut;
        }

        const inQ = Math.max(0, Number(body.inQty) || 0);
        if (inQ > 0) {
          const i = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: IN_RANGE });
          const irows = (i.data.values ?? []) as string[][];
          const irow = lookupMinutesPriceRow(irows, subsidiary, destCountry, "Entrante");
          if (!irow) return bad("No price row for Incoming");
          const ppmIn = parseMoney(irow[3]);
          totalQty += inQ;
          totalAmount += inQ * ppmIn;
        }

        if (totalQty === 0) return bad("Total qty is zero");
        const unitPrice = totalAmount / totalQty;
        const ok: PricingOk = { ok: true, totalQty, totalAmount, unitPrice };
        return NextResponse.json(ok);
      }

      return bad("Invalid minutes payload");
    }

    return bad("Invalid kind");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
