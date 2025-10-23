// src/lib/google-system.ts
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppRows } from "@/lib/sheets/whatsapp";

/** ===================== Tipos de entrada ===================== */
export type SkuItemInput = { sku: string; quantity: number };
export type NamedItemInput = { name: string; unitPrice: number; devHours: number; quantity: number };
export type AnyItemInput = SkuItemInput | NamedItemInput;

export interface CreateProposalInput {
  companyName: string;
  country: string;
  subsidiary?: string;     // si no viene, se infiere del country
  creatorEmail?: string | null;
  items: AnyItemInput[];
}

/** ===================== Tipos Google (subset) ===================== */
interface SheetsValuesResponse { values?: string[][]; }

interface TextRun { content?: string; }
interface ParagraphElement { textRun?: TextRun; }
interface Paragraph { elements?: ParagraphElement[]; }
interface TableCell { content?: StructuralElement[]; }
interface TableRow { tableCells?: TableCell[]; }
interface Table { tableRows?: TableRow[]; }
interface StructuralElement {
  startIndex?: number;
  endIndex?: number;
  paragraph?: Paragraph;
  table?: Table;
}
interface DocumentBody { content?: StructuralElement[]; }
interface DocumentGetResponse { body?: DocumentBody; }

/** ===================== Utils ===================== */
function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
function getStr(x: unknown, key: string): string | undefined {
  if (!isObject(x)) return undefined;
  const v = x[key];
  return typeof v === "string" ? v : undefined;
}
function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}
function paragraphText(p?: Paragraph): string {
  if (!p?.elements) return "";
  const parts: string[] = [];
  for (const el of p.elements) {
    const t = el?.textRun?.content;
    if (typeof t === "string") parts.push(t);
  }
  return parts.join("");
}
function cellText(cell?: TableCell): string {
  if (!cell?.content) return "";
  const parts: string[] = [];
  for (const se of cell.content) {
    if (se.paragraph) parts.push(paragraphText(se.paragraph));
  }
  return parts.join("");
}

function formatUSD(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
function formatUSDFlex(n: number) {
  const abs = Math.abs(n);
  const digits = abs >= 1 ? 0 : abs >= 0.1 ? 2 : 3;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}
function formatFechaDia(d = new Date()) {
  const meses = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre",
  ] as const;
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = meses[d.getMonth()];
  const anio = d.getFullYear();
  return `${dia} de ${mes} de ${anio}`;
}

/** ===================== Google helpers ===================== */
async function docsBatchUpdate(docId: string, token: string, requests: Array<Record<string, unknown>>) {
  const res = await fetch(
    `https://docs.googleapis.com/v1/documents/${encodeURIComponent(docId)}:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ requests }),
    }
  );
  const raw = await res.text();
  if (!res.ok) throw new Error(`Docs batchUpdate error: ${raw}`);
}

async function docsGet(docId: string, token: string): Promise<DocumentGetResponse> {
  const res = await fetch(
    `https://docs.googleapis.com/v1/documents/${encodeURIComponent(docId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const raw = await res.text();
  let json: unknown;
  try { json = JSON.parse(raw); } catch {
    throw new Error(`docs.get parse error: ${raw.slice(0, 300)}`);
  }
  if (!res.ok) throw new Error(`docs.get error: ${raw.slice(0, 300)}`);
  return json as DocumentGetResponse;
}

function findTableAfterMarker(
  doc: DocumentGetResponse,
  marker: string
): { table: Table; tableElementIndex: number; tableStartIndex: number } | null {
  const content = doc.body?.content ?? [];
  let markerPos = -1;

  for (let i = 0; i < content.length; i++) {
    const el = content[i];
    if (el.paragraph) {
      const txt = paragraphText(el.paragraph);
      if (txt.includes(marker)) { markerPos = i; break; }
    }
  }
  if (markerPos === -1) return null;

  for (let j = markerPos + 1; j < content.length; j++) {
    const el = content[j];
    if (el.table) {
      const startIndex = typeof el.startIndex === "number" ? el.startIndex : undefined;
      if (startIndex === undefined) return null;
      return { table: el.table, tableElementIndex: j, tableStartIndex: startIndex };
    }
  }
  return null;
}

/** ===================== OAuth (con refresh token del backend) ===================== */
async function getSystemAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "";
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN ?? "";
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Faltan GOOGLE_OAUTH_CLIENT_ID / _SECRET / _REFRESH_TOKEN en .env.local");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const raw = await res.text();
  let json: unknown;
  try { json = JSON.parse(raw); } catch { throw new Error(`OAuth token parse: ${raw}`); }
  const token = getStr(json, "access_token");
  if (!token) throw new Error(`OAuth token error: ${raw}`);
  return token;
}

/** ===================== Drive helpers ===================== */
async function driveCopyTemplate(templateId: string, folderId: string | null, name: string, token: string) {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(templateId)}/copy?supportsAllDrives=true`;
  const body: Record<string, unknown> = { name };
  if (folderId) body.parents = [folderId];

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  let json: unknown;
  try { json = JSON.parse(raw); } catch { throw new Error(`Drive copy parse: ${raw}`); }
  if (!res.ok) throw new Error(`Drive copy error: ${raw}`);
  const id = getStr(json, "id");
  return { id: id! };
}

/** ===================== Sheets helpers (variables) ===================== */
async function getConditionsText(accessToken: string, filial: string): Promise<string> {
  const sheetId = process.env.SHEETS_CONFIG_SPREADSHEET_ID;
  const range = process.env.SHEETS_CONDITIONS_RANGE ?? "variables!A2:B6";
  if (!sheetId) return "";

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const raw = await res.text();

  let json: unknown;
  try { json = JSON.parse(raw) as unknown; } catch { return ""; }

  const values = normalizeWhatsAppRows(
    Array.isArray((json as SheetsValuesResponse).values)
      ? ((json as SheetsValuesResponse).values as string[][])
      : []
  );

  const needle = normalizeKey(filial);

  for (const row of values) {
    const colA = typeof row[0] === "string" ? normalizeKey(row[0]) : "";
    const colB = typeof row[1] === "string" ? row[1] : "";
    if (colA && colA === needle) return colB;
  }
  return "";
}

/** WhatsApp rows por FILIAL: retorna hasta 7 filas de 5 columnas (B..F) */
async function getWhatsappRows(accessToken: string, filial: string): Promise<string[][]> {
  const sheetId = process.env.SHEETS_CONFIG_SPREADSHEET_ID;
  const range = process.env.SHEETS_WHATSAPP_RANGE ?? "costos!A1:Z200";
  if (!sheetId) return [];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const raw = await res.text();

  let json: unknown;
  try { json = JSON.parse(raw) as unknown; } catch { return []; }

  const values = normalizeWhatsAppRows(
    Array.isArray((json as SheetsValuesResponse).values)
      ? ((json as SheetsValuesResponse).values as string[][])
      : []
  );

  const needle = normalizeKey(filial);
  const out: string[][] = [];

  for (const row of values) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const colA = typeof row[0] === "string" ? normalizeKey(row[0]) : "";
    if (colA === needle) {
      const slice = row.slice(1, 6).map((v) => (typeof v === "string" ? v : String(v ?? "")));
      while (slice.length < 5) slice.push("");
      out.push(slice);
      if (out.length >= 7) break;
    }
  }
  return out;
}

/** ===================== LÃ³gica auxiliar ===================== */
function pickTemplateIdByCountry(country?: string): string {
  const main = process.env.GOOGLE_DOCS_TEMPLATE_ID ?? process.env.GOOGLE_DOC_TEMPLATE_ID ?? "";
  if (!main) throw new Error("Falta GOOGLE_DOCS_TEMPLATE_ID en .env.local");
  const br = process.env.GOOGLE_DOCS_TEMPLATE_ID_BR || main;
  const c = (country ?? "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toUpperCase();
  if (c === "BRASIL" || c === "BRAZIL") return br;
  return main;
}

function autoSubsidiaryForCountry(countryName: string): string {
  const catalog: Record<string, string> = {
    argentina: "ARGENTINA",
    bolivia: "COLOMBIA",
    brasil: "BRASIL",
    chile: "USA",
    colombia: "COLOMBIA",
    "costa rica": "ESPANA",
    ecuador: "ESPANA",
    "el salvador": "ESPANA",
    espana: "ESPANA",
    guatemala: "USA",
    haiti: "USA",
    honduras: "USA",
    jamaica: "ESPANA",
    mexico: "USA",
    nicaragua: "USA",
    panama: "ESPANA",
    paraguay: "ESPANA",
    peru: "COLOMBIA",
    "puerto rico": "USA",
    "republica dominicana": "ESPANA",
    uruguay: "ESPANA",
    venezuela: "ESPANA",
  };
  const normalized = countryName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
  return catalog[normalized] ?? "ARGENTINA";
}


/** Convierte la lista de items (puede venir con SKUs) a [{name, unitPrice, devHours, quantity}] usando la DB */
async function expandItemsFromDB(items: AnyItemInput[]): Promise<NamedItemInput[]> {
  if (items.length === 0) return [];

  const normalizedSkuToOriginal = new Map<string, string>();

  for (const it of items) {
    if ("sku" in it && typeof it.sku === "string" && it.sku.trim()) {
      const normalized = it.sku.trim();
      const key = normalized.toLowerCase();
      if (!normalizedSkuToOriginal.has(key)) normalizedSkuToOriginal.set(key, normalized);
    }
  }

  const dbBySku = new Map<string, { name: string; unitPrice: number; devHours: number }>();
  if (normalizedSkuToOriginal.size > 0) {
    const orConditions = Array.from(normalizedSkuToOriginal.values()).map((sku) => ({
      sku: { equals: sku, mode: "insensitive" as const },
    }));
    const rows = await prisma.item.findMany({
      where: { OR: orConditions },
      select: { sku: true, name: true, unitPrice: true, devHours: true },
    });

    rows.forEach((row) => {
      const key = row.sku.trim().toLowerCase();
      dbBySku.set(key, {
        name: row.name,
        unitPrice: Number(row.unitPrice),
        devHours: row.devHours,
      });
    });
  }

  const resolved: NamedItemInput[] = [];
  for (const it of items) {
    if ("sku" in it && typeof it.sku === "string") {
      const normalized = it.sku.trim().toLowerCase();
      const db = dbBySku.get(normalized);
      if (db) {
        resolved.push({
          name: db.name,
          unitPrice: db.unitPrice,
          devHours: db.devHours,
          quantity: it.quantity,
        });
      } else {
        resolved.push({ name: it.sku, unitPrice: 0, devHours: 0, quantity: it.quantity });
      }
    } else {
      const named = it as NamedItemInput;
      resolved.push({
        name: named.name,
        unitPrice: named.unitPrice,
        devHours: named.devHours,
        quantity: named.quantity,
      });
    }
  }

  return resolved;
}

/** ===================== API principal ===================== */
export async function createProposalDocSystem(input: CreateProposalInput) {
  const token = await getSystemAccessToken();

  // 1) Preparar datos
  const subsidiary = input.subsidiary && input.subsidiary.trim()
    ? input.subsidiary
    : autoSubsidiaryForCountry(input.country);

  const expanded = await expandItemsFromDB(input.items);

  const HOURS_RATE = Number(
    process.env.PROPOSAL_ONESHOT_RATE_USD ??
    process.env.PROPOSAL_ONESHOT_RATE ??
    process.env.PROPOSALS_ONESHOT_RATE ??
    process.env.ONESHOT_RATE ??
    50
  );
  const totals = {
    monthly: expanded.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0),
    hours:   expanded.reduce((acc, it) => acc + it.devHours   * it.quantity, 0),
    oneShot: 0,
  };
  totals.oneShot = totals.hours * HOURS_RATE;

  const fechaDia = formatFechaDia();
  const templateId = pickTemplateIdByCountry(input.country);
  const folderId =
    process.env.GOOGLE_DRIVE_TARGET_FOLDER_ID ||
    process.env.GOOGLE_DRIVE_PROPOSALS_FOLDER_ID ||
    process.env.PROPOSALS_FOLDER_ID ||
    null;

  const newName = `Propuesta Comercial - ${input.companyName} - ${fechaDia}`;
  const { id: docId } = await driveCopyTemplate(templateId, folderId, newName, token);

  // 2) Datos de Sheets
  const filialKey = normalizeKey(subsidiary);
  const [conditionsText, whatsappRows] = await Promise.all([
    getConditionsText(token, filialKey),
    getWhatsappRows(token, filialKey),
  ]);

  // 3) Reemplazos
  const requests: Array<Record<string, unknown>> = [
    { replaceAllText: { containsText: { text: "<-cliente->",      matchCase: false }, replaceText: input.companyName } },
    { replaceAllText: { containsText: { text: "<-fecha_dia->",    matchCase: false }, replaceText: fechaDia } },
    { replaceAllText: { containsText: { text: "<-condiciones->",  matchCase: false }, replaceText: conditionsText } },
    { replaceAllText: { containsText: { text: "<-horas->",        matchCase: false }, replaceText: String(totals.hours) } },
    { replaceAllText: { containsText: { text: "<-valor_hora->",   matchCase: false }, replaceText: `US$ ${HOURS_RATE}` } },
    { replaceAllText: { containsText: { text: "<-total_horas->",  matchCase: false }, replaceText: formatUSD(totals.oneShot) } },
    { replaceAllText: { containsText: { text: "<-total-oneshot->",matchCase: false }, replaceText: formatUSD(totals.oneShot) } },
    { replaceAllText: { containsText: { text: "<-totalmensual->", matchCase: false }, replaceText: formatUSD(totals.monthly) } },
  ];

  // Ãtems (tabla de precios)
  expanded.forEach((it, idx) => {
    const n = idx + 1;
    requests.push(
      { replaceAllText: { containsText: { text: `<item${n}>`,     matchCase: false }, replaceText: it.name } },
      { replaceAllText: { containsText: { text: `<cantidad${n}>`, matchCase: false }, replaceText: String(it.quantity) } },
      { replaceAllText: { containsText: { text: `<precio${n}>`,   matchCase: false }, replaceText: formatUSDFlex(it.unitPrice) } },
      { replaceAllText: { containsText: { text: `<total${n}>`,    matchCase: false }, replaceText: formatUSD(it.unitPrice * it.quantity) } },
    );
  });

  // WhatsApp (hasta 7 filas x 5 columnas): <w1c1>.. <w7c5>
  whatsappRows.forEach((row, rIdx) => {
    const rowNum = rIdx + 1;
    for (let c = 0; c < 5; c++) {
      requests.push({
        replaceAllText: {
          containsText: { text: `<w${rowNum}c${c + 1}>`, matchCase: false },
          replaceText: row[c] ?? "",
        },
      });
    }
  });

  await docsBatchUpdate(docId, token, requests);

  // 4) Recortar filas sobrantes
  const struct = await docsGet(docId, token);

  const priceRef = findTableAfterMarker(struct, "<-tablaprecio>");
  if (priceRef) {
    const { table, tableStartIndex: startIndex } = priceRef;
    const rows: TableRow[] = Array.isArray(table.tableRows) ? table.tableRows : [];

    // Buscar fila TOTAL (si existe)
    let totalRowIndex = rows.length - 1;
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      const hasTotal = Array.isArray(r.tableCells)
        ? r.tableCells.some((c) => cellText(c).toUpperCase().includes("TOTAL"))
        : false;
      if (hasTotal) { totalRowIndex = i; break; }
    }

    const used = expanded.length;
    const firstDataRow = 1;
    const limit = totalRowIndex - 1;
    const startDelete = firstDataRow + used;

    const del: Array<Record<string, unknown>> = [];
    if (startDelete <= limit) {
      for (let r = limit; r >= startDelete; r--) {
        del.push({
          deleteTableRow: {
            tableCellLocation: { tableStartLocation: { index: startIndex }, rowIndex: r },
          },
        });
      }
      if (del.length) await docsBatchUpdate(docId, token, del);
    }
  }

  const waRef = findTableAfterMarker(struct, "<-whatsapp->");
  if (waRef) {
    const { table, tableStartIndex: startIndex } = waRef;
    const rows: TableRow[] = Array.isArray(table.tableRows) ? table.tableRows : [];
    const used = whatsappRows.length;
    const firstDataRow = 1;
    const limit = rows.length - 1;
    const startDelete = firstDataRow + used;

    const del: Array<Record<string, unknown>> = [];
    if (startDelete <= limit) {
      for (let r = limit; r >= startDelete; r--) {
        del.push({
          deleteTableRow: {
            tableCellLocation: { tableStartLocation: { index: startIndex }, rowIndex: r },
          },
        });
      }
      if (del.length) await docsBatchUpdate(docId, token, del);
    }
  }

  // Limpiar marcadores visibles
  await docsBatchUpdate(docId, token, [
    { replaceAllText: { containsText: { text: "<-tablaprecio>", matchCase: false }, replaceText: "" } },
    { replaceAllText: { containsText: { text: "<-whatsapp->",   matchCase: false }, replaceText: "" } },
  ]);

  const docUrl = `https://docs.google.com/document/d/${docId}/edit`;
  return {
    docId,
    docUrl,
    totals,
    subsidiary,
    items: expanded,
  };
}
