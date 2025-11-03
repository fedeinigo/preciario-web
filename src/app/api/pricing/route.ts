// src/app/api/pricing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  detectWhatsAppVariantColumns,
  normalizeWhatsAppRows,
  resolveWhatsAppCell,
  type VariantColumnMap,
} from "@/lib/sheets/whatsapp";
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
type WhatsAppPrices = { marketing: number; utility: number; auth: number };

/* ===================== Helpers ===================== */

function bad(reason: string, status = 400): NextResponse<PricingErr> {
  return NextResponse.json({ ok: false, error: reason }, { status });
}
function assertEnv(name: string): string {
  const v = process.env[name];
  if (!v || !`${v}`.trim()) throw new Error(`Missing ${name}`);
  return v;
}
/** Lee env con default (no rompe si falta). */
function envOr(name: string, fallback: string): string {
  const v = process.env[name];
  return v && `${v}`.trim().length > 0 ? `${v}`.trim() : fallback;
}

/** Normaliza (mayúsculas, trim, sin acentos) para comparar valores de hoja */
function canon(input: unknown): string {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita diacríticos
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/** Convierte strings tipo "$0,095790" | "1.234,56" | "1,234.56" a número */
function parseMoney(input: unknown): number {
  if (typeof input !== "string") return Number(input) || 0;

  // Quitar espacios, símbolos de moneda y cualquier texto adicional (p. ej. "USD")
  let s = input.replace(/\s+/g, "").replace(/\$/g, "");
  s = s.replace(/[^0-9,.-]/g, "");

  if (!s) return 0;

  if (s.includes(",") && !s.includes(".")) {
    // Formato latino: "1.234,56" => "1234.56"
    s = s.replace(/\./g, "");
    const lastComma = s.lastIndexOf(",");
    if (lastComma >= 0) {
      s = `${s.slice(0, lastComma).replace(/,/g, "")}.${s.slice(lastComma + 1)}`;
    }
  } else {
    // Formato en-US: "1,234.56" => "1234.56"
    s = s.replace(/,/g, "");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/* ====== Type guards sin any ====== */
function isObject(o: unknown): o is Record<string, unknown> {
  return typeof o === "object" && o !== null;
}
function has<K extends string>(o: unknown, key: K): o is Record<K, unknown> {
  return isObject(o) && key in o;
}
function isWhatsAppNew(p: AnyPayload): p is WhatsAppNewPayload {
  return p.kind === "whatsapp" && has(p, "variant") && has(p, "qty");
}
function isWhatsAppOld(p: AnyPayload): p is WhatsAppOldPayload {
  return (
    p.kind === "whatsapp" &&
    (has(p, "marketingQty") || has(p, "utilityQty") || has(p, "authQty"))
  );
}
function isMinutesNew(p: AnyPayload): p is MinutesNewPayload {
  return p.kind === "minutes" && has(p, "variant") && has(p, "qty");
}
function isMinutesOld(p: AnyPayload): p is MinutesOldPayload {
  return p.kind === "minutes" && has(p, "outQty") && has(p, "inQty");
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
    if (!isObject(json)) return {};
    return {
      access_token: typeof json.access_token === "string" ? json.access_token : undefined,
      expires_in: typeof json.expires_in === "number" ? json.expires_in : undefined,
      refresh_token: typeof json.refresh_token === "string" ? json.refresh_token : undefined,
      scope: typeof json.scope === "string" ? json.scope : undefined,
      token_type: typeof json.token_type === "string" ? json.token_type : undefined,
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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const accessToken = await refreshAccessTokenForUser(session.user.id as string);
  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth: oauth2 });
}

/* ====== Lookups en la Sheet ====== */
function lookupWhatsAppPriceRow(rows: string[][], subsidiary: string, destCountry: string) {
  const sub = canon(subsidiary);
  const dst = canon(destCountry);

  const matchesDest = (row: string[]) => canon(row[1]) === dst || canon(row[0]) === dst;

  const matchBySubsidiary = rows.find((r) => canon(r[0]) === sub && matchesDest(r));
  if (matchBySubsidiary) return matchBySubsidiary;

  const matchByCountry = rows.find(matchesDest);
  if (matchByCountry) return matchByCountry;

  return null;
}

function resolveWhatsAppPrices(row: string[], variantColumns: VariantColumnMap): WhatsAppPrices {
  return {
    marketing: parseMoney(resolveWhatsAppCell(row, "marketing", variantColumns)),
    utility: parseMoney(resolveWhatsAppCell(row, "utility", variantColumns)),
    auth: parseMoney(resolveWhatsAppCell(row, "auth", variantColumns)),
  };
}

function detectVariantFromHeader(value: unknown): "marketing" | "utility" | "auth" | null {
  const key = canon(value);
  if (!key) return null;
  if (key.includes("MARK")) return "marketing";
  if (key.includes("UTIL") || key.includes("SERVIC") || key.includes("SERVICE")) return "utility";
  if (key.includes("AUTH") || key.includes("AUTENT")) return "auth";
  return null;
}

async function lookupWhatsAppPricesByCountryRanges(
  sheets: sheets_v4.Sheets,
  sheetId: string,
  destCountry: string
): Promise<WhatsAppPrices | null> {
  const countriesRange = envOr("SHEETS_WPP_COUNTRIES", "");
  const headersRange = envOr("SHEETS_WPP_HEADERS", "");
  const valuesRange = envOr("SHEETS_WPP_VALUES", "");

  if (!countriesRange || !headersRange || !valuesRange) return null;

  const [cres, hres, vres] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: countriesRange }),
    sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: headersRange }),
    sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: valuesRange }),
  ]);

  const countries = (cres.data.values ?? []) as string[][];
  if (countries.length === 0) return null;

  const dstKey = canon(destCountry);
  const rowIdx = countries.findIndex((row) => canon(row[0]) === dstKey);
  if (rowIdx < 0) return null;

  const headers = (hres.data.values ?? []) as string[][];
  const headerRow = headers[0] ?? [];
  const indices: Record<"marketing" | "utility" | "auth", number> = {
    marketing: -1,
    utility: -1,
    auth: -1,
  };

  for (let idx = 0; idx < headerRow.length; idx++) {
    const variant = detectVariantFromHeader(headerRow[idx]);
    if (variant && indices[variant] === -1) {
      indices[variant] = idx;
    }
  }

  const values = (vres.data.values ?? []) as string[][];
  if (rowIdx >= values.length) return null;
  const rowValues = values[rowIdx] ?? [];

  const fallbackOrder: Record<"marketing" | "utility" | "auth", number[]> = {
    marketing: [0],
    utility: [1],
    auth: [2],
  };

  for (const variant of ["marketing", "utility", "auth"] as const) {
    if (indices[variant] >= 0) continue;
    for (const fallbackIdx of fallbackOrder[variant]) {
      if (fallbackIdx < rowValues.length) {
        indices[variant] = fallbackIdx;
        break;
      }
    }
  }

  const pick = (idx: number) => (idx >= 0 && idx < rowValues.length ? rowValues[idx] : "");

  return {
    marketing: parseMoney(pick(indices.marketing)),
    utility: parseMoney(pick(indices.utility)),
    auth: parseMoney(pick(indices.auth)),
  };
}

// LEGACY: minutos salientes
function findMinutesOutPriceLegacy(
  countries: string[][], headers: string[][], values: string[][], subsidiary: string, destCountry: string
): number | null {
  const countryList = countries.map((r) => canon(r[0]));
  const headerList = (headers[0] ?? []).map((c) => canon(c));
  const rowIdx = countryList.indexOf(canon(destCountry));
  const colIdx = headerList.indexOf(canon(subsidiary));
  if (rowIdx < 0 || colIdx < 0) return null;
  const cell = values[rowIdx]?.[colIdx];
  const price = parseMoney(cell);
  return Number.isFinite(price) && price > 0 ? price : null;
}

// LEGACY: minutos entrantes
function findMinutesInPriceLegacy(filiales: string[][], values: string[][], subsidiary: string): number | null {
  const filas = filiales.map((r) => canon(r[0]));
  const idx = filas.indexOf(canon(subsidiary));
  if (idx < 0) return null;
  const price = parseMoney(values[idx]?.[0]);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function lookupMinutesPriceRow(
  rows: string[][],
  subsidiary: string,
  destCountry: string,
  expectedType: "Saliente" | "Entrante"
) {
  const sub = canon(subsidiary);
  const dst = canon(destCountry);
  const typ = canon(expectedType);
  return rows.find((r) => canon(r[0]) === sub && canon(r[1]) === dst && canon(r[2]) === typ);
}

/* ===================== Handler ===================== */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) return bad("Unauthorized", 401);

    // Requeridos SIEMPRE
    const SHEET_ID = assertEnv("GOOGLE_SHEET_ID");

    // Rango WhatsApp: si falta en env, usamos el default de tu .env.local
    const WHATS_RANGE = envOr("SHEETS_WHATSAPP_RANGE", "costos!A1:Z200");

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
      const rows = normalizeWhatsAppRows((wres.data.values ?? []) as string[][]);
      const variantColumns = detectWhatsAppVariantColumns(rows);

      if (isWhatsAppNew(body)) {
        const { subsidiary, destCountry, variant } = body;
        const qty = Math.max(0, Number(body.qty) || 0);
        if (!subsidiary || !destCountry) return bad("Bad whatsapp payload");
        if (qty <= 0) return bad("Total qty is zero");

        let prices: WhatsAppPrices | null = null;
        const row = lookupWhatsAppPriceRow(rows, subsidiary, destCountry);
        if (row) {
          prices = resolveWhatsAppPrices(row, variantColumns);
        } else {
          prices = await lookupWhatsAppPricesByCountryRanges(sheets, SHEET_ID, destCountry);
        }
        if (!prices) return bad("No price row for WhatsApp");

        const unit =
          variant === "marketing"
            ? prices.marketing
            : variant === "utility"
            ? prices.utility
            : prices.auth;
        const totalAmount = qty * unit;
        const ok: PricingOk = { ok: true, totalQty: qty, totalAmount, unitPrice: unit };
        return NextResponse.json(ok);
      }

      if (isWhatsAppOld(body)) {
        const subsidiary = body.subsidiary;
        const dest = body.destCountry ?? body.subsidiary;
        let prices: WhatsAppPrices | null = null;
        const row = lookupWhatsAppPriceRow(rows, subsidiary, dest);
        if (row) {
          prices = resolveWhatsAppPrices(row, variantColumns);
        } else {
          prices = await lookupWhatsAppPricesByCountryRanges(sheets, SHEET_ID, dest);
        }
        if (!prices) return bad("No price row for WhatsApp");

        const { marketing: pMarketing, utility: pUtility, auth: pAuth } = prices;

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

        // Intentar esquema NUEVO solo si están definidos (y no vacíos)
        const OUT_RANGE = envOr("SHEETS_MINUTES_OUT_RANGE", "");
        const IN_RANGE = envOr("SHEETS_MINUTES_IN_RANGE", "");

        if (variant === "out" && OUT_RANGE) {
          const o = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: OUT_RANGE });
          const orows = (o.data.values ?? []) as string[][];
          const orow = lookupMinutesPriceRow(orows, subsidiary, destCountry, "Saliente");
          if (!orow) return bad("No price row for Outgoing");
          const ppmOut = parseMoney(orow[3]);
          const totalAmount = qty * ppmOut;
          const ok: PricingOk = { ok: true, totalQty: qty, totalAmount, unitPrice: ppmOut };
          return NextResponse.json(ok);
        }
        if (variant === "in" && IN_RANGE) {
          const i = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: IN_RANGE });
          const irows = (i.data.values ?? []) as string[][];
          const irow = lookupMinutesPriceRow(irows, subsidiary, destCountry, "Entrante");
          if (!irow) return bad("No price row for Incoming");
          const ppmIn = parseMoney(irow[3]);
          const totalAmount = qty * ppmIn;
          const ok: PricingOk = { ok: true, totalQty: qty, totalAmount, unitPrice: ppmIn };
          return NextResponse.json(ok);
        }

        // Fallback LEGACY (pestaña "costos")
        if (variant === "out") {
          const OC = envOr("SHEETS_OUT_COUNTRIES", "costos!A3:A54");
          const OH = envOr("SHEETS_OUT_HEADERS", "costos!C2:G2");
          const OV = envOr("SHEETS_OUT_VALUES", "costos!C3:G54");

          const [cres, hres, vres] = await Promise.all([
            sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: OC }),
            sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: OH }),
            sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: OV }),
          ]);
          const countries = (cres.data.values ?? []) as string[][];
          const headers = (hres.data.values ?? []) as string[][];
          const values = (vres.data.values ?? []) as string[][];
          const ppmOut = findMinutesOutPriceLegacy(countries, headers, values, subsidiary, destCountry);
          if (ppmOut == null) return bad("No price row for Outgoing (legacy)");
          const totalAmount = qty * ppmOut;
          const ok: PricingOk = { ok: true, totalQty: qty, totalAmount, unitPrice: ppmOut };
          return NextResponse.json(ok);
        } else {
          const IF = envOr("SHEETS_IN_FILIALES", "costos!A58:A62");
          const IV = envOr("SHEETS_IN_VALUES", "costos!B58:B62");

          const [fres, vres] = await Promise.all([
            sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: IF }),
            sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: IV }),
          ]);
          const filiales = (fres.data.values ?? []) as string[][];
          const values = (vres.data.values ?? []) as string[][];
          const ppmIn = findMinutesInPriceLegacy(filiales, values, subsidiary);
          if (ppmIn == null) return bad("No price row for Incoming (legacy)");
          const totalAmount = qty * ppmIn;
          const ok: PricingOk = { ok: true, totalQty: qty, totalAmount, unitPrice: ppmIn };
          return NextResponse.json(ok);
        }
      }

      if (isMinutesOld(body)) {
        const { subsidiary, destCountry } = body;
        if (!subsidiary || !destCountry) return bad("Bad minutes payload");

        const OUT_RANGE = envOr("SHEETS_MINUTES_OUT_RANGE", "");
        const IN_RANGE = envOr("SHEETS_MINUTES_IN_RANGE", "");

        let totalQty = 0;
        let totalAmount = 0;

        const outQ = Math.max(0, Number(body.outQty) || 0);
        if (outQ > 0) {
          if (OUT_RANGE) {
            const o = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: OUT_RANGE });
            const orows = (o.data.values ?? []) as string[][];
            const orow = lookupMinutesPriceRow(orows, subsidiary, destCountry, "Saliente");
            if (!orow) return bad("No price row for Outgoing");
            const ppmOut = parseMoney(orow[3]);
            totalQty += outQ;
            totalAmount += outQ * ppmOut;
          } else {
            const OC = envOr("SHEETS_OUT_COUNTRIES", "costos!A3:A54");
            const OH = envOr("SHEETS_OUT_HEADERS", "costos!C2:G2");
            const OV = envOr("SHEETS_OUT_VALUES", "costos!C3:G54");

            const [cres, hres, vres] = await Promise.all([
              sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: OC }),
              sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: OH }),
              sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: OV }),
            ]);
            const countries = (cres.data.values ?? []) as string[][];
            const headers = (hres.data.values ?? []) as string[][];
            const values = (vres.data.values ?? []) as string[][];
            const ppmOut = findMinutesOutPriceLegacy(countries, headers, values, subsidiary, destCountry);
            if (ppmOut == null) return bad("No price row for Outgoing (legacy)");
            totalQty += outQ;
            totalAmount += outQ * ppmOut;
          }
        }

        const inQ = Math.max(0, Number(body.inQty) || 0);
        if (inQ > 0) {
          if (IN_RANGE) {
            const i = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: IN_RANGE });
            const irows = (i.data.values ?? []) as string[][];
            const irow = lookupMinutesPriceRow(irows, subsidiary, destCountry, "Entrante");
            if (!irow) return bad("No price row for Incoming");
            const ppmIn = parseMoney(irow[3]);
            totalQty += inQ;
            totalAmount += inQ * ppmIn;
          } else {
            const IF = envOr("SHEETS_IN_FILIALES", "costos!A58:A62");
            const IV = envOr("SHEETS_IN_VALUES", "costos!B58:B62");

            const [fres, vres] = await Promise.all([
              sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: IF }),
              sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: IV }),
            ]);
            const filiales = (fres.data.values ?? []) as string[][];
            const values = (vres.data.values ?? []) as string[][];
            const ppmIn = findMinutesInPriceLegacy(filiales, values, subsidiary);
            if (ppmIn == null) return bad("No price row for Incoming (legacy)");
            totalQty += inQ;
            totalAmount += inQ * ppmIn;
          }
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
