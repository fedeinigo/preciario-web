// src/app/api/pricing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";

/* ===================== Tipos de payloads soportados ===================== */
type WhatsAppNewPayload = {
  kind: "whatsapp";
  subsidiary: string;              // mostrado, no se usa para el precio de WhatsApp
  destCountry: string;             // país destino (col A)
  variant: "marketing" | "utility" | "auth";
  qty: number;
};
type WhatsAppOldPayload = {
  kind: "whatsapp";
  subsidiary: string;              // mostrado, no se usa para el precio de WhatsApp
  marketingQty: number;
  utilityQty: number;
  authQty: number;
  destCountry?: string;            // si no viene, usamos subsidiary como antes
};
type MinutesNewPayload = {
  kind: "minutes";
  subsidiary: string;              // usado para mapear columna (C..G)
  destCountry?: string;            // requerido si variant = "out"
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

type PricingOk = { ok: true; totalQty: number; totalAmount: number; unitPrice: number; sheetCell?: string };
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

/* ====== Utilidades de la hoja “costos” ====== */

const TAB = "costos";

// WhatsApp
const RANGE_WPP_COUNTRIES = `${TAB}!A3:A54`; // países
const RANGE_WPP_HEADERS   = `${TAB}!H2:J2`;  // "Marketing | Utility | Authentication"
const RANGE_WPP_VALUES    = `${TAB}!H3:J54`; // precios

// Minutos salientes
const RANGE_OUT_COUNTRIES = `${TAB}!A3:A54`;
const RANGE_OUT_HEADERS   = `${TAB}!C2:G2`;  // ARGENTINA | COLOMBIA | ESPAÑA | USA | BRASIL
const RANGE_OUT_VALUES    = `${TAB}!C3:G54`;

// Minutos entrantes
const RANGE_IN_FILIALES   = `${TAB}!A58:A62`; // ARGENTINA..ESPAÑA
const RANGE_IN_VALUES     = `${TAB}!B58:B62`; // PPM

const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

function findRowIndex(arr: string[], target: string): number {
  const t = norm(target);
  return arr.findIndex((x) => norm(x) === t);
}
function wppCol(kind: "marketing" | "utility" | "auth"): number {
  return kind === "marketing" ? 0 : kind === "utility" ? 1 : 2; // H/I/J
}
function outColFromSubsidiary(subsidiary: string): number {
  const s = norm(subsidiary);
  if (s.includes("arg")) return 0; // C
  if (s.includes("col")) return 1; // D
  if (s.includes("esp")) return 2; // E
  if (s.includes("usa") || s.includes("estados")) return 3; // F
  if (s.includes("bra")) return 4; // G
  return 3; // fallback USA
}

/* ====== Lecturas ====== */
async function readWhatsAppMatrix(sheets: sheets_v4.Sheets) {
  const batch = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: assertEnv("GOOGLE_SHEET_ID"),
    ranges: [RANGE_WPP_COUNTRIES, RANGE_WPP_HEADERS, RANGE_WPP_VALUES],
  });
  const countries = (batch.data.valueRanges?.[0]?.values ?? []).flat() as string[];
  const matrix = batch.data.valueRanges?.[2]?.values ?? [];
  return { countries, matrix };
}

async function readOutMinutesMatrix(sheets: sheets_v4.Sheets) {
  const batch = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: assertEnv("GOOGLE_SHEET_ID"),
    ranges: [RANGE_OUT_COUNTRIES, RANGE_OUT_HEADERS, RANGE_OUT_VALUES],
  });
  const countries = (batch.data.valueRanges?.[0]?.values ?? []).flat() as string[];
  const matrix = batch.data.valueRanges?.[2]?.values ?? [];
  return { countries, matrix };
}

async function readInMinutesVectors(sheets: sheets_v4.Sheets) {
  const batch = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: assertEnv("GOOGLE_SHEET_ID"),
    ranges: [RANGE_IN_FILIALES, RANGE_IN_VALUES],
  });
  const filiales = (batch.data.valueRanges?.[0]?.values ?? []).flat() as string[];
  const values = (batch.data.valueRanges?.[1]?.values ?? []).flat() as string[];
  return { filiales, values };
}

/* ===================== Handler ===================== */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return bad("Unauthorized", 401);

    const body = (await req.json()) as AnyPayload;
    if (!body || typeof body !== "object" || !("kind" in body)) {
      return bad("Missing kind");
    }

    const sheets = await getSheetsClientForUser();

    /* ------------------- WhatsApp (usa costos!A/H..J) ------------------- */
    if (body.kind === "whatsapp") {
      const { countries, matrix } = await readWhatsAppMatrix(sheets);

      // NEW payload
      if (isWhatsAppNew(body)) {
        const qty = Math.max(0, Number(body.qty) || 0);
        if (!body.destCountry || qty <= 0) return bad("Bad whatsapp payload");
        const r = findRowIndex(countries, body.destCountry);
        if (r < 0) return bad(`País no encontrado en ${RANGE_WPP_COUNTRIES}`);
        const c = wppCol(body.variant);
        const raw = (matrix[r]?.[c] ?? "") as string;
        const unit = parseMoney(raw);
        const ok: PricingOk = {
          ok: true,
          totalQty: qty,
          totalAmount: qty * unit,
          unitPrice: unit,
          sheetCell: `costos!${String.fromCharCode(72 + c)}${3 + r}`, // H=72
        };
        return NextResponse.json(ok);
      }

      // OLD payload (tres cantidades)
      if (isWhatsAppOld(body)) {
        const dest = body.destCountry ?? body.subsidiary; // compat anterior
        const r = findRowIndex(countries, dest);
        if (r < 0) return bad(`País no encontrado en ${RANGE_WPP_COUNTRIES}`);

        const pMarketing = parseMoney((matrix[r]?.[0] ?? "") as string);
        const pUtility   = parseMoney((matrix[r]?.[1] ?? "") as string);
        const pAuth      = parseMoney((matrix[r]?.[2] ?? "") as string);

        const mQty = Math.max(0, Number(body.marketingQty) || 0);
        const uQty = Math.max(0, Number(body.utilityQty)   || 0);
        const aQty = Math.max(0, Number(body.authQty)      || 0);
        const totalQty = mQty + uQty + aQty;
        if (totalQty === 0) return bad("Total qty is zero");

        const totalAmount = mQty * pMarketing + uQty * pUtility + aQty * pAuth;
        const unitPrice = totalAmount / totalQty;
        const ok: PricingOk = { ok: true, totalQty, totalAmount, unitPrice };
        return NextResponse.json(ok);
      }

      return bad("Invalid whatsapp payload");
    }

    /* ------------------- Minutos (usa costos!A/C..G y A/B entradas) ---- */
    if (body.kind === "minutes") {
      // NEW payload
      if (isMinutesNew(body)) {
        const qty = Math.max(0, Number(body.qty) || 0);
        if (qty <= 0) return bad("Total qty is zero");
        if (body.variant === "out") {
          if (!body.destCountry) return bad("Bad minutes payload (missing destCountry)");
          const { countries, matrix } = await readOutMinutesMatrix(sheets);
          const r = findRowIndex(countries, body.destCountry);
          if (r < 0) return bad(`País no encontrado en ${RANGE_OUT_COUNTRIES}`);
          const c = outColFromSubsidiary(body.subsidiary);
          const raw = (matrix[r]?.[c] ?? "") as string;
          const ppmOut = parseMoney(raw);
          const ok: PricingOk = {
            ok: true,
            totalQty: qty,
            totalAmount: qty * ppmOut,
            unitPrice: ppmOut,
            sheetCell: `costos!${String.fromCharCode(67 + c)}${3 + r}`, // C=67
          };
          return NextResponse.json(ok);
        } else {
          // Entrantes: solo filial
          const { filiales, values } = await readInMinutesVectors(sheets);
          const fIdx = findRowIndex(filiales, body.subsidiary);
          if (fIdx < 0) return bad(`Filial no encontrada en ${RANGE_IN_FILIALES}`);
          const ppmIn = parseMoney(values[fIdx] ?? "");
          const ok: PricingOk = {
            ok: true,
            totalQty: qty,
            totalAmount: qty * ppmIn,
            unitPrice: ppmIn,
            sheetCell: `costos!B${58 + fIdx}`,
          };
          return NextResponse.json(ok);
        }
      }

      // OLD payload
      if (isMinutesOld(body)) {
        const outQ = Math.max(0, Number(body.outQty) || 0);
        const inQ  = Math.max(0, Number(body.inQty)  || 0);
        if (outQ + inQ === 0) return bad("Total qty is zero");

        let totalQty = 0;
        let totalAmount = 0;

        if (outQ > 0) {
          const { countries, matrix } = await readOutMinutesMatrix(sheets);
          const r = findRowIndex(countries, body.destCountry);
          if (r < 0) return bad(`País no encontrado en ${RANGE_OUT_COUNTRIES}`);
          const c = outColFromSubsidiary(body.subsidiary);
          const ppmOut = parseMoney((matrix[r]?.[c] ?? "") as string);
          totalQty += outQ;
          totalAmount += outQ * ppmOut;
        }

        if (inQ > 0) {
          const { filiales, values } = await readInMinutesVectors(sheets);
          const fIdx = findRowIndex(filiales, body.subsidiary);
          if (fIdx < 0) return bad(`Filial no encontrada en ${RANGE_IN_FILIALES}`);
          const ppmIn = parseMoney(values[fIdx] ?? "");
          totalQty += inQ;
          totalAmount += inQ * ppmIn;
        }

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
