// src/app/api/proposals/create/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProposalRequestSchema } from "@/lib/schemas/proposals";
import logger from "@/lib/logger";
import { normalizeWhatsAppRows } from "@/lib/sheets/whatsapp";

import { buildReplaceRequests, resolveHourlyRate, type CreateDocPayload } from "./helpers";

/** ----------------- Tipos (subset) Google APIs ----------------- */
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

function isObject(x: unknown): x is Record<string, unknown> { return typeof x === "object" && x !== null; }
function getStr(x: unknown, key: string): string | undefined {
  if (!isObject(x)) return undefined;
  const v = x[key];
  return typeof v === "string" ? v : undefined;
}

/** Normaliza claves para comparar (quita tildes/acentos, mayúsculas, trim) */
function normalizeKey(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, " ").trim().toUpperCase();
}

/** Selector de template por país */
function pickTemplateIdByCountry(country?: string): string {
  const main =
    process.env.GOOGLE_DOCS_TEMPLATE_ID ??
    process.env.GOOGLE_DOC_TEMPLATE_ID ??
    "";
  if (!main) throw new Error("Falta GOOGLE_DOCS_TEMPLATE_ID (o GOOGLE_DOC_TEMPLATE_ID) en .env.local");

  const br = process.env.GOOGLE_DOCS_TEMPLATE_ID_BR || main;
  const c = (country ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toUpperCase();
  if (c === "BRASIL" || c === "BRAZIL") return br;
  return main;
}

/** ----------------- Sheets helpers ----------------- */
async function getConditionsText(accessToken: string, filial: string): Promise<string> {
  const sheetId = process.env.SHEETS_CONFIG_SPREADSHEET_ID;
  const range = process.env.SHEETS_CONDITIONS_RANGE ?? "Hoja1!A:B";
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

/** ----------------- Docs helpers ----------------- */
async function getDocStructure(docId: string, accessToken: string): Promise<DocumentGetResponse> {
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(docId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text) as unknown; } catch { throw new Error(`docs.get parse error: ${text.slice(0, 300)}`); }
  if (!res.ok) throw new Error(`docs.get error: ${text.slice(0, 300)}`);
  return json as DocumentGetResponse;
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

function findTableAfterMarker(doc: DocumentGetResponse, marker: string) {
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

function cellText(cell?: TableCell): string {
  if (!cell?.content) return "";
  const parts: string[] = [];
  for (const se of cell.content) if (se.paragraph) parts.push(paragraphText(se.paragraph));
  return parts.join("");
}

/** ----------------- Handler ----------------- */
export async function POST(req: Request) {
  const requestId = randomUUID();
  const log = logger.child({ route: "api/proposals/create", requestId });
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      log.warn("unauthorized", {});
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let rawPayload: unknown;
    try {
      rawPayload = await req.json();
    } catch {
      log.error("invalid_json", {});
      return NextResponse.json({ error: "Body inválido (no es JSON)" }, { status: 400 });
    }

    const parsed = createProposalRequestSchema.safeParse(rawPayload);
    if (!parsed.success) {
      log.error("invalid_payload", { issues: parsed.error.format() });
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const cleanPipedriveLink = payload.pipedrive?.link?.trim() || null;
    const cleanPipedriveDealId = payload.pipedrive?.dealId?.trim() || null;

    const totalAmountFromItems = payload.items.reduce(
      (sum, item) => sum + item.unitNet * item.quantity,
      0
    );
    const requestedMonthly = Number.isFinite(payload.totals.monthly)
      ? payload.totals.monthly
      : totalAmountFromItems;
    const monthlyCandidate = Number((requestedMonthly ?? totalAmountFromItems).toFixed(2));
    const monthlyFromItems = Number(totalAmountFromItems.toFixed(2));
    const totalAmount = Math.abs(monthlyCandidate - monthlyFromItems) > 1
      ? monthlyFromItems
      : monthlyCandidate;

    const hoursFromItems = payload.items.reduce(
      (sum, item) => sum + item.devHours * item.quantity,
      0
    );
    const requestedHours = Number.isFinite(payload.totals.hours)
      ? payload.totals.hours
      : hoursFromItems;
    const hoursCandidate = Math.round(requestedHours ?? hoursFromItems);
    const hoursFromItemsRounded = Math.round(hoursFromItems);
    const totalHours = Math.max(
      0,
      Math.abs(hoursCandidate - hoursFromItemsRounded) > 1
        ? hoursFromItemsRounded
        : hoursCandidate
    );

    const hourlyRate = resolveHourlyRate(process.env);
    const oneShot = Number((totalHours * hourlyRate).toFixed(2));

    const resolvedUserId = payload.userId?.trim() || session.user.id;
    const resolvedUserEmail = payload.userEmail?.trim() || session.user.email;

    const body: CreateDocPayload = {
      companyName: payload.companyName,
      country: payload.country,
      subsidiary: payload.subsidiary,
      items: payload.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitNet,
        devHours: item.devHours,
      })),
      totals: {
        monthly: totalAmount,
        oneShot,
        hours: totalHours,
      },
    };


    // 1) refresh token de Google
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "google" },
      select: { refresh_token: true },
    });
    if (!account?.refresh_token) {
      log.error("missing_refresh_token", { userId: session.user.id });
      return NextResponse.json({ error: "No hay refresh_token de Google. Cierra sesión y vuelve a entrar aceptando permisos." }, { status: 401 });
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        grant_type: "refresh_token",
        refresh_token: account.refresh_token,
      }),
    });
    const tokenRaw = await tokenRes.text();
    let tokenJson: unknown;
    try { tokenJson = JSON.parse(tokenRaw) as unknown; } catch {
      return NextResponse.json({ error: "Respuesta no-JSON al refrescar token", tokenRaw }, { status: 502 });
    }
    const accessToken = getStr(tokenJson, "access_token");
    if (!tokenRes.ok || !accessToken) {
      log.error("google_token_refresh_failed", { status: tokenRes.status, body: tokenRaw });
      return NextResponse.json({ error: "Error al refrescar token", details: tokenRaw }, { status: tokenRes.status || 502 });
    }

    /** 2) Datos opcionales desde Sheets — normalizando claves */
    const filialKey = normalizeKey(body.subsidiary);
    const [conditionsText, whatsappRows] = await Promise.all([
      getConditionsText(accessToken, filialKey),
      getWhatsappRows(accessToken, filialKey),
    ]);

    /** 3) Elegir template según país (Brasil usa template BR si está seteado) */
    let templateId: string;
    try { templateId = pickTemplateIdByCountry(body.country); }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }

    /** 4) Copiar plantilla en Drive */
    const newName = `Propuesta Comercial - ${body.companyName} - ${new Date().toLocaleString()}`;
    const copyUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(templateId)}/copy?supportsAllDrives=true`;

    const copyRes = await fetch(copyUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const copyRaw = await copyRes.text();
    let copyJson: unknown;
    try { copyJson = JSON.parse(copyRaw) as unknown; } catch {
      return NextResponse.json({ error: "Drive copy: respuesta no-JSON", copyRaw }, { status: 502 });
    }
    if (!copyRes.ok) {
      return NextResponse.json(
        { error: "No se pudo copiar la plantilla", hint: "Verifica ID y permisos. Si está en Unidad compartida, asegura acceso y supportsAllDrives.", details: copyJson },
        { status: copyRes.status }
      );
    }
    const newFileId = getStr(copyJson, "id");
    if (!newFileId) return NextResponse.json({ error: "Drive copy no devolvió id", details: copyJson }, { status: 502 });

    /** 5) Reemplazos de texto generales */
    const requests = buildReplaceRequests({
      body,
      conditionsText,
      whatsappRows,
      hourlyRate,
    });

    // Aplicar reemplazos
    {
      const docsRes = await fetch(
        `https://docs.googleapis.com/v1/documents/${encodeURIComponent(newFileId)}:batchUpdate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ requests }),
        }
      );
      const docsRaw = await docsRes.text();
      if (!docsRes.ok) {
        let docsJson: unknown;
        try { docsJson = JSON.parse(docsRaw) as unknown; } catch { /* ignore */ }
        return NextResponse.json({ error: "No se pudo actualizar el documento", details: docsJson ?? docsRaw }, { status: docsRes.status });
      }
    }

    /** 6) Recortar tablas/limpiar marcadores (igual que en docs/create) */
    const docStruct = await getDocStructure(newFileId, accessToken);

    const priceRef = findTableAfterMarker(docStruct, "<-tablaprecio>");
    if (priceRef) {
      const { table, tableStartIndex: startIndex } = priceRef;
      const rows: TableRow[] = Array.isArray(table.tableRows) ? table.tableRows : [];
      let totalRowIndex = rows.length - 1;
      for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i];
        const hasTotal = Array.isArray(row.tableCells)
          ? row.tableCells.some((c) => cellText(c).toUpperCase().includes("TOTAL"))
          : false;
        if (hasTotal) { totalRowIndex = i; break; }
      }
      const used = body.items.length;
      const firstDataRow = 1;
      const limit = totalRowIndex - 1;
      const startDelete = firstDataRow + used;
      const deleteRequests: Array<Record<string, unknown>> = [];
      if (startDelete <= limit) {
        for (let r = limit; r >= startDelete; r--) {
          deleteRequests.push({
            deleteTableRow: { tableCellLocation: { tableStartLocation: { index: startIndex }, rowIndex: r } },
          });
        }
      }
      if (deleteRequests.length > 0) {
        const delRes = await fetch(
          `https://docs.googleapis.com/v1/documents/${encodeURIComponent(newFileId)}:batchUpdate`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ requests: deleteRequests }),
          }
        );
        await delRes.text();
      }
    }

    const waRef = findTableAfterMarker(docStruct, "<-whatsapp->");
    if (waRef) {
      const { table, tableStartIndex: startIndex } = waRef;
      const rows: TableRow[] = Array.isArray(table.tableRows) ? table.tableRows : [];
      const used = whatsappRows.length;
      const firstDataRow = 1;
      const limit = rows.length - 1;
      const startDelete = firstDataRow + used;
      const deleteRequests: Array<Record<string, unknown>> = [];
      if (startDelete <= limit) {
        for (let r = limit; r >= startDelete; r--) {
          deleteRequests.push({
            deleteTableRow: { tableCellLocation: { tableStartLocation: { index: startIndex }, rowIndex: r } },
          });
        }
      }
      if (deleteRequests.length > 0) {
        const delRes = await fetch(
          `https://docs.googleapis.com/v1/documents/${encodeURIComponent(newFileId)}:batchUpdate`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ requests: deleteRequests }),
          }
        );
        await delRes.text();
      }
    }

    {
      const cleanupRequests = [
        { replaceAllText: { containsText: { text: "<-tablaprecio>", matchCase: false }, replaceText: "" } },
        { replaceAllText: { containsText: { text: "<-whatsapp->", matchCase: false }, replaceText: "" } },
      ];
      const clRes = await fetch(
        `https://docs.googleapis.com/v1/documents/${encodeURIComponent(newFileId)}:batchUpdate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ requests: cleanupRequests }),
        }
      );
      await clRes.text();
    }

    const url = `https://docs.google.com/document/d/${newFileId}/edit`;

    const created = await prisma.proposal.create({
      // Persist proposal and items
      data: {
        id: randomUUID(),
        companyName: payload.companyName,
        country: payload.country,
        countryId: payload.countryId,
        subsidiary: payload.subsidiary,
        subsidiaryId: payload.subsidiaryId,
        totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
        totalHours,
        oneShot: new Prisma.Decimal(oneShot.toFixed(2)),
        docUrl: url,
        docId: newFileId,
        userId: resolvedUserId,
        userEmail: resolvedUserEmail,
        pipedriveLink: cleanPipedriveLink,
        pipedriveDealId: cleanPipedriveDealId,
        items: {
          create: payload.items.map((item) => ({
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitNet.toFixed(2)),
            devHours: Math.round(item.devHours),
            item: { connect: { id: item.itemId } },
          })),
        },
      },
      select: {
        id: true,
        seq: true,
        companyName: true,
        country: true,
        countryId: true,
        subsidiary: true,
        subsidiaryId: true,
        totalAmount: true,
        totalHours: true,
        oneShot: true,
        docUrl: true,
        docId: true,
        userId: true,
        userEmail: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        wonAt: true,
        pipedriveLink: true,
        pipedriveDealId: true,
      },
    });

    const proposal = {
      ...created,
      totalAmount: Number(created.totalAmount),
      oneShot: Number(created.oneShot),
    };

    return NextResponse.json(
      {
        doc: { id: newFileId, url },
        proposal,
        meta: { hourlyRate },
      },
      { status: 201 }
    );
  } catch (err) {
    log.error("unexpected_error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: (err as Error).message ?? "Unknown error", stack: process.env.NODE_ENV === "development" ? (err as Error).stack : undefined },
      { status: 500 }
    );
  }
}
