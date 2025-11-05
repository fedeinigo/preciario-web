"use server";

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/constants/teams";
import type { Prisma } from "@prisma/client";

type CreateMarketingDocPayload = {
  companyName: string;
  segment: string;
  introduction: string;
  analysis: string;
  comparative: string;
  recommendations: string;
  country?: string;
};

type MarketingReportItem = {
  id: string;
  documentId: string;
  name: string;
  companyName: string;
  country: string | null;
  segment: string | null;
  url: string;
  createdAt: string;
  creator: {
    id: string;
    email: string | null;
    name: string | null;
    team: string | null;
  };
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getStr(value: unknown, key: string): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const raw = (value as Record<string, unknown>)[key];
  return typeof raw === "string" ? raw : undefined;
}

const DEFAULT_MARKETING_TZ = "America/Argentina/Buenos_Aires";
const CALENDAR_ICON_TOKEN = "__MARKETING_CALENDAR_ICON__";
const LINKEDIN_ICON_TOKEN = "__MARKETING_LINKEDIN_ICON__";
const SEGMENT_LINK_TOKEN = "__MARKETING_SEGMENT_LINK__";
const CALENDAR_FALLBACK_LABEL = "Agenda";
const LINKEDIN_FALLBACK_LABEL = "LinkedIn";
const SEGMENT_LINK_LABEL = "Recursos del segmento";
const ICON_SIZE_PT = 20;
const DEFAULT_ICON_BASE_URL = "https://preciario-web.vercel.app";

function normalizeKey(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

function formatWithTimeZone(now: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const map = Object.create(null) as Record<string, string>;
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }
  const dateLabel = `${map.day ?? "00"}/${map.month ?? "00"}/${map.year ?? "0000"}`;
  const timeLabel = `${map.hour ?? "00"}:${map.minute ?? "00"}`;
  return { dateLabel, timeLabel };
}

function getDateTimeLabels(now: Date, timeZone: string) {
  try {
    return formatWithTimeZone(now, timeZone);
  } catch {
    return formatWithTimeZone(now, DEFAULT_MARKETING_TZ);
  }
}

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function sanitize(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function normalizeBaseUrl(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  return trimmed.replace(/\/+$/, "");
}

function normalizeDriveLink(value: string) {
  try {
    const url = new URL(value);
    if (!url.hostname.includes("drive.google.com")) return value;
    const idFromPath = url.pathname.match(/\/d\/([^/]+)/)?.[1];
    const id = idFromPath || url.searchParams.get("id");
    if (!id) return value;
    return `https://drive.google.com/uc?export=view&id=${id}`;
  } catch {
    return value;
  }
}

function resolveIconUri(envValue: string | undefined, fileName: string) {
  const override = sanitize(envValue);
  if (override) return normalizeDriveLink(override);

  const base =
    normalizeBaseUrl(process.env.MARKETING_ICON_BASE_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeBaseUrl(process.env.NEXTAUTH_URL) ??
    normalizeBaseUrl(DEFAULT_ICON_BASE_URL);

  if (!base) return undefined;
  return `${base}/${fileName.replace(/^\/+/, "")}`;
}

let cachedCalendarIconUri: string | undefined;
let cachedLinkedinIconUri: string | undefined;

function getCalendarIconUri() {
  if (cachedCalendarIconUri === undefined) {
    cachedCalendarIconUri = resolveIconUri(
      process.env.MARKETING_CALENDAR_ICON_URI,
      "calendar_icon.png",
    );
  }
  return cachedCalendarIconUri;
}

function getLinkedinIconUri() {
  if (cachedLinkedinIconUri === undefined) {
    cachedLinkedinIconUri = resolveIconUri(
      process.env.MARKETING_LINKEDIN_ICON_URI,
      "linkedin_icon.png",
    );
  }
  return cachedLinkedinIconUri;
}

type MarketingSheetMaps = {
  segmentLinkByKey: Map<string, string>;
  calendarByKey: Map<string, string>;
  linkedinByKey: Map<string, string>;
};

function buildMarketingSheetMaps(rows: string[][]): MarketingSheetMaps {
  const segmentLinkByKey = new Map<string, string>();
  const calendarByKey = new Map<string, string>();
  const linkedinByKey = new Map<string, string>();

  for (const row of rows) {
    const [nameRaw, calendarRaw, linkedinRaw, , segmentRaw, linkRaw] = row;
    const segment = sanitize(segmentRaw);
    const link = sanitize(linkRaw);
    if (segment && link) {
      segmentLinkByKey.set(normalizeKey(segment), link);
    }

    const name = sanitize(nameRaw);
    if (name) {
      const key = normalizeKey(name);
      const calendar = sanitize(calendarRaw);
      const linkedin = sanitize(linkedinRaw);
      if (calendar) {
        calendarByKey.set(key, calendar);
      }
      if (linkedin) {
        linkedinByKey.set(key, linkedin);
      }
    }
  }

  return { segmentLinkByKey, calendarByKey, linkedinByKey };
}

type DocsTextRange = { startIndex: number; endIndex: number };

type GoogleDoc = {
  body?: {
    content?: Array<{
      startIndex?: number;
      endIndex?: number;
      paragraph?: {
        elements?: Array<{
          startIndex?: number;
          endIndex?: number;
          textRun?: { content?: string };
        }>;
      };
    }>;
  };
};

function findTextRange(doc: GoogleDoc, token: string): DocsTextRange | null {
  const content = doc.body?.content;
  if (!Array.isArray(content)) return null;

  for (const element of content) {
    const textElements = element.paragraph?.elements;
    if (!Array.isArray(textElements)) continue;

    for (const textElement of textElements) {
      const text = textElement.textRun?.content;
      if (typeof text !== "string") continue;
      const relativeIndex = text.indexOf(token);
      if (relativeIndex === -1) continue;

      const elementStart = textElement.startIndex ?? 0;
      const startIndex = elementStart + relativeIndex;
      return { startIndex, endIndex: startIndex + token.length };
    }
  }
  return null;
}

type IconRequestParams = {
  range: DocsTextRange;
  objectId: string;
  iconUri: string | undefined;
  link: string;
  fallbackLabel: string;
};

function buildIconRequests({
  range,
  objectId,
  iconUri,
  link,
  fallbackLabel,
}: IconRequestParams): Array<Record<string, unknown>> {
  const requests: Array<Record<string, unknown>> = [
    { deleteContentRange: { range } },
  ];

  if (iconUri) {
    requests.push({
      insertInlineImage: {
        location: { index: range.startIndex },
        objectId,
        uri: iconUri,
        objectSize: {
          height: { magnitude: ICON_SIZE_PT, unit: "PT" },
          width: { magnitude: ICON_SIZE_PT, unit: "PT" },
        },
      },
    });
    requests.push({
      updateImageProperties: {
        objectId,
        fields: "link",
        imageProperties: { link: { url: link } },
      },
    });
  } else {
    requests.push({
      insertText: { location: { index: range.startIndex }, text: fallbackLabel },
    });
    requests.push({
      updateTextStyle: {
        range: {
          startIndex: range.startIndex,
          endIndex: range.startIndex + fallbackLabel.length,
        },
        textStyle: { link: { url: link } },
        fields: "link",
      },
    });
  }

  return requests;
}

function buildHyperlinkTextRequests(
  range: DocsTextRange,
  label: string,
  url: string,
): Array<Record<string, unknown>> {
  return [
    { deleteContentRange: { range } },
    { insertText: { location: { index: range.startIndex }, text: label } },
    {
      updateTextStyle: {
        range: {
          startIndex: range.startIndex,
          endIndex: range.startIndex + label.length,
        },
        textStyle: { link: { url } },
        fields: "link",
      },
    },
  ];
}

type ExecuteBatchResult =
  | { ok: true }
  | { ok: false; status: number; details: unknown };

async function executeDocsBatch(
  token: string,
  documentId: string,
  requests: Array<Record<string, unknown>>,
): Promise<ExecuteBatchResult> {
  if (requests.length === 0) return { ok: true };

  const batchRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    },
  );

  const batchRaw = await batchRes.text();
  if (batchRes.ok) {
    return { ok: true };
  }

  let batchJson: unknown;
  try {
    batchJson = JSON.parse(batchRaw) as unknown;
  } catch {
    batchJson = batchRaw;
  }

  return {
    ok: false,
    status: batchRes.status || 502,
    details: batchJson,
  };
}

async function fetchMarketingSheetVariables(
  token: string,
): Promise<{ data: MarketingSheetMaps } | { error: NextResponse }> {
  const spreadsheetId =
    process.env.GOOGLE_MARKETING_VARIABLES_SPREADSHEET_ID?.trim() ??
    process.env.GOOGLE_SHEET_ID?.trim();

  if (!spreadsheetId) {
    return {
      error: NextResponse.json(
        {
          error:
            "No se configur�� GOOGLE_MARKETING_VARIABLES_SPREADSHEET_ID ni GOOGLE_SHEET_ID",
        },
        { status: 500 },
      ),
    };
  }

  const range =
    process.env.GOOGLE_MARKETING_VARIABLES_RANGE?.trim() ??
    "variablesMkt!A2:F100";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?majorDimension=ROWS`;

  const sheetRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const sheetRaw = await sheetRes.text();
  let sheetJson: unknown;
  try {
    sheetJson = JSON.parse(sheetRaw) as unknown;
  } catch {
    return {
      error: NextResponse.json(
        {
          error: "Sheets variables: respuesta no-JSON",
          details: sheetRaw,
        },
        { status: 502 },
      ),
    };
  }

  if (!sheetRes.ok) {
    return {
      error: NextResponse.json(
        {
          error: "Sheets variables: error al leer datos",
          details: sheetJson,
        },
        { status: sheetRes.status || 502 },
      ),
    };
  }

  const valuesRaw = (sheetJson as { values?: unknown }).values;
  const rows = Array.isArray(valuesRaw)
    ? valuesRaw
        .filter((row): row is unknown[] => Array.isArray(row))
        .map((row) =>
          row.map((cell) => (typeof cell === "string" ? cell : "")),
        )
    : [];

  return { data: buildMarketingSheetMaps(rows as string[][]) };
}

type RichPlaceholderPayload = {
  token: string;
  documentId: string;
  calendarLink?: string;
  linkedinLink?: string;
  segmentLink: string;
};

type PlaceholderModification =
  | {
      kind: "calendar";
      range: DocsTextRange;
      link: string;
      iconUri?: string;
    }
  | {
      kind: "linkedin";
      range: DocsTextRange;
      link: string;
      iconUri?: string;
    }
  | { kind: "segment"; range: DocsTextRange; link: string };

async function applyRichPlaceholders({
  token,
  documentId,
  calendarLink,
  linkedinLink,
  segmentLink,
}: RichPlaceholderPayload): Promise<{ error: NextResponse } | { success: true }> {
  const docRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const docRaw = await docRes.text();
  let docJson: unknown;
  try {
    docJson = JSON.parse(docRaw) as unknown;
  } catch {
    return {
      error: NextResponse.json(
        { error: "Docs detail: respuesta no-JSON", details: docRaw },
        { status: 502 },
      ),
    };
  }

  if (!docRes.ok) {
    return {
      error: NextResponse.json(
        { error: "Docs detail: error al consultar documento", details: docJson },
        { status: docRes.status || 502 },
      ),
    };
  }

  const doc = docJson as GoogleDoc;

  const modifications: PlaceholderModification[] = [];

  const calendarUri = getCalendarIconUri();
  if (calendarLink) {
    const range = findTextRange(doc, CALENDAR_ICON_TOKEN);
    if (range) {
      modifications.push({
        kind: "calendar",
        range,
        iconUri: calendarUri,
        link: calendarLink,
      });
    }
  }

  const linkedinUri = getLinkedinIconUri();
  if (linkedinLink) {
    const range = findTextRange(doc, LINKEDIN_ICON_TOKEN);
    if (range) {
      modifications.push({
        kind: "linkedin",
        range,
        iconUri: linkedinUri,
        link: linkedinLink,
      });
    }
  }

  const segmentRange = findTextRange(doc, SEGMENT_LINK_TOKEN);
  if (segmentRange) {
    modifications.push({
      kind: "segment",
      range: segmentRange,
      link: segmentLink,
    });
  }

  if (modifications.length === 0) {
    return { success: true };
  }

  modifications.sort((a, b) => b.range.startIndex - a.range.startIndex);

  const buildRequests = (preferIcons: boolean) => {
    const requests: Array<Record<string, unknown>> = [];
    for (const modification of modifications) {
      switch (modification.kind) {
        case "calendar": {
          if (preferIcons && modification.iconUri) {
            requests.push(
              ...buildIconRequests({
                range: modification.range,
                objectId: `calendarIcon_${randomUUID().replace(/-/g, "")}`,
                iconUri: modification.iconUri,
                link: modification.link,
                fallbackLabel: CALENDAR_FALLBACK_LABEL,
              }),
            );
          } else {
            requests.push(
              ...buildHyperlinkTextRequests(
                modification.range,
                CALENDAR_FALLBACK_LABEL,
                modification.link,
              ),
            );
          }
          break;
        }
        case "linkedin": {
          if (preferIcons && modification.iconUri) {
            requests.push(
              ...buildIconRequests({
                range: modification.range,
                objectId: `linkedinIcon_${randomUUID().replace(/-/g, "")}`,
                iconUri: modification.iconUri,
                link: modification.link,
                fallbackLabel: LINKEDIN_FALLBACK_LABEL,
              }),
            );
          } else {
            requests.push(
              ...buildHyperlinkTextRequests(
                modification.range,
                LINKEDIN_FALLBACK_LABEL,
                modification.link,
              ),
            );
          }
          break;
        }
        case "segment": {
          requests.push(
            ...buildHyperlinkTextRequests(
              modification.range,
              SEGMENT_LINK_LABEL,
              modification.link,
            ),
          );
          break;
        }
        default:
          break;
      }
    }
    return requests;
  };

  const primaryRequests = buildRequests(true);
  const primaryResult = await executeDocsBatch(token, documentId, primaryRequests);
  if (primaryResult.ok) {
    return { success: true };
  }

  const fallbackRequests = buildRequests(false);
  const fallbackResult = await executeDocsBatch(token, documentId, fallbackRequests);
  if (fallbackResult.ok) {
    return { success: true };
  }

  return {
    error: NextResponse.json(
      {
        error: "Docs rich placeholders: no se pudieron aplicar cambios",
        details: {
          primary: primaryResult.details,
          fallback: fallbackResult.details,
        },
      },
      { status: fallbackResult.status || primaryResult.status || 502 },
    ),
  };
}

async function getAccessTokenForUser(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { refresh_token: true },
  });
  if (!account?.refresh_token) {
    return { error: NextResponse.json(
      {
        error:
          "No hay refresh_token de Google. Cierra sesión y vuelve a entrar aceptando permisos.",
      },
      { status: 401 },
    ) };
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
  try {
    tokenJson = JSON.parse(tokenRaw) as unknown;
  } catch {
    return {
      error: NextResponse.json(
        { error: "Respuesta no-JSON al refrescar token", details: tokenRaw },
        { status: 502 },
      ),
    };
  }

  const accessToken = getStr(tokenJson, "access_token");
  if (!tokenRes.ok || !accessToken) {
    return {
      error: NextResponse.json(
        { error: "Error al refrescar token", details: tokenJson },
        { status: tokenRes.status || 502 },
      ),
    };
  }

  return { token: accessToken };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bodyRaw = await req.text();
    let body: CreateMarketingDocPayload;
    try {
      body = JSON.parse(bodyRaw) as CreateMarketingDocPayload;
    } catch {
      return NextResponse.json(
        { error: "Body inválido (no es JSON)", body: bodyRaw?.slice?.(0, 2000) ?? bodyRaw },
        { status: 400 },
      );
    }

    const required: Array<[keyof CreateMarketingDocPayload, string]> = [
      ["companyName", "Nombre de la empresa"],
      ["segment", "Segmento"],
      ["introduction", "Introducción"],
      ["analysis", "Análisis de la empresa"],
      ["comparative", "Benchmark / comparativa"],
      ["recommendations", "Recomendaciones personalizadas"],
    ];

    const missing = required.filter(([key]) => !isNonEmptyString(body[key])).map(([, label]) => label);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Faltan campos obligatorios: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    const { token, error } = await getAccessTokenForUser(session.user.id);
    if (!token) return error!;

    const templateId =
      process.env.GOOGLE_MARKETING_TEMPLATE_ID?.trim() ||
      "1RaZ8c-SUtWesxNaBzcxY7b2KGUkWwpPclQE4D9V9SEI";

    const marketingTimeZone =
      process.env.MARKETING_PORTAL_TIMEZONE?.trim() ?? DEFAULT_MARKETING_TZ;
    const now = new Date();
    const { dateLabel, timeLabel } = getDateTimeLabels(now, marketingTimeZone);
    const cleanCompanyName = body.companyName.trim();
    const cleanSegment = body.segment.trim();
    const cleanCountry = sanitize(body.country);
    const cleanIntroduction = body.introduction.trim();
    const cleanAnalysis = body.analysis.trim();
    const cleanComparative = body.comparative.trim();
    const cleanRecommendations = body.recommendations.trim();
    const newName = `Análisis de ${cleanCompanyName} - ${dateLabel} - ${timeLabel}`;

    const copyRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(templateId)}/copy?supportsAllDrives=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      },
    );
    const copyRaw = await copyRes.text();
    let copyJson: unknown;
    try {
      copyJson = JSON.parse(copyRaw) as unknown;
    } catch {
      return NextResponse.json(
        { error: "Drive copy: respuesta no-JSON", details: copyRaw },
        { status: 502 },
      );
    }

    if (!copyRes.ok) {
      return NextResponse.json(
        { error: "No se pudo copiar la plantilla", details: copyJson },
        { status: copyRes.status },
      );
    }

    const newFileId = getStr(copyJson, "id");
    if (!newFileId) {
      return NextResponse.json(
        { error: "Drive copy no devolvió id", details: copyJson },
        { status: 502 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });
    const signer =
      (dbUser?.name && dbUser.name.trim()) ||
      (session.user.name && session.user.name.trim()) ||
      dbUser?.email ||
      session.user.email ||
      "Equipo WiseCX";

    const sheetVariables = await fetchMarketingSheetVariables(token);
    if ("error" in sheetVariables) {
      return sheetVariables.error;
    }

    const { segmentLinkByKey, calendarByKey, linkedinByKey } =
      sheetVariables.data;

    const segmentLink = sanitize(
      segmentLinkByKey.get(normalizeKey(cleanSegment)) ?? undefined,
    );
    if (!segmentLink) {
      return NextResponse.json(
        {
          error: `No se encontr\u00f3 valor en variablesMkt!F para el segmento "${cleanSegment}"`,
        },
        { status: 422 },
      );
    }

    const preferredName =
      sanitize(dbUser?.name) ?? sanitize(session.user.name);
    const userKey = preferredName ? normalizeKey(preferredName) : undefined;
    const calendarLink = userKey
      ? sanitize(calendarByKey.get(userKey) ?? undefined)
      : undefined;
    const linkedinLink = userKey
      ? sanitize(linkedinByKey.get(userKey) ?? undefined)
      : undefined;

    const replacements: Array<Record<string, unknown>> = [
      { replaceAllText: { containsText: { text: "<-empresa->", matchCase: false }, replaceText: cleanCompanyName } },
      { replaceAllText: { containsText: { text: "<-introduccion->", matchCase: false }, replaceText: cleanIntroduction } },
      { replaceAllText: { containsText: { text: "<-analisis->", matchCase: false }, replaceText: cleanAnalysis } },
      { replaceAllText: { containsText: { text: "<-comparativa->", matchCase: false }, replaceText: cleanComparative } },
      { replaceAllText: { containsText: { text: "<-recomendaciones->", matchCase: false }, replaceText: cleanRecommendations } },
      { replaceAllText: { containsText: { text: "<-segmento->", matchCase: false }, replaceText: cleanSegment } },
      { replaceAllText: { containsText: { text: "<-datetime->", matchCase: false }, replaceText: dateLabel } },
      { replaceAllText: { containsText: { text: "<-firma->", matchCase: false }, replaceText: signer } },
      { replaceAllText: { containsText: { text: "<-link->", matchCase: false }, replaceText: SEGMENT_LINK_TOKEN } },
    ];

    if (calendarLink) {
      replacements.push({
        replaceAllText: {
          containsText: { text: "<-calendar->", matchCase: false },
          replaceText: CALENDAR_ICON_TOKEN,
        },
      });
    } else {
      replacements.push({
        replaceAllText: {
          containsText: { text: "<-calendar->", matchCase: false },
          replaceText: "",
        },
      });
    }

    if (linkedinLink) {
      replacements.push({
        replaceAllText: {
          containsText: { text: "<-linkedin->", matchCase: false },
          replaceText: LINKEDIN_ICON_TOKEN,
        },
      });
    } else {
      replacements.push({
        replaceAllText: {
          containsText: { text: "<-linkedin->", matchCase: false },
          replaceText: "",
        },
      });
    }

    if (cleanCountry) {
      replacements.push({
        replaceAllText: {
          containsText: { text: "<-pais->", matchCase: false },
          replaceText: cleanCountry,
        },
      });
    }

    const docsRes = await fetch(
      `https://docs.googleapis.com/v1/documents/${encodeURIComponent(newFileId)}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests: replacements }),
      },
    );
    const docsRaw = await docsRes.text();
    if (!docsRes.ok) {
      let docsJson: unknown;
      try {
        docsJson = JSON.parse(docsRaw) as unknown;
      } catch {
        docsJson = docsRaw;
      }
      return NextResponse.json(
        { error: "No se pudo actualizar el documento", details: docsJson },
        { status: docsRes.status },
      );
    }

    const richResult = await applyRichPlaceholders({
      token,
      documentId: newFileId,
      calendarLink,
      linkedinLink,
      segmentLink,
    });
    if ("error" in richResult) {
      return richResult.error;
    }

    const url = `https://docs.google.com/document/d/${newFileId}/edit`;

    const record = await prisma.marketingReport.create({
      data: {
        documentId: newFileId,
        name: newName,
        companyName: cleanCompanyName,
        country: cleanCountry ?? null,
        segment: cleanSegment,
        url,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ id: newFileId, url, name: newName, reportId: record.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user.role ?? "usuario") as AppRole;
    const isAdmin = role === "admin" || role === "superadmin";
    const isLeader = role === "lider";
    const leaderTeam = sanitize(session.user.team);

    const { searchParams } = new URL(req.url);
    const nameQuery = sanitize(searchParams.get("name"));
    const companyQuery = sanitize(searchParams.get("company"));
    const countryFilter = sanitize(searchParams.get("country"));
    const segmentFilter = sanitize(searchParams.get("segment"));
    const emailQuery = sanitize(searchParams.get("email"));
    const teamFilter = isAdmin ? sanitize(searchParams.get("team")) : undefined;
    const fromDate = parseDateParam(searchParams.get("from"));
    const toDate = parseDateParam(searchParams.get("to"));

    const conditions: Prisma.MarketingReportWhereInput[] = [];

    if (isAdmin) {
      if (teamFilter) {
        conditions.push({ createdBy: { team: teamFilter } });
      }
    } else if (isLeader && leaderTeam) {
      conditions.push({
        OR: [
          { createdById: session.user.id },
          { createdBy: { team: leaderTeam } },
        ],
      });
    } else {
      conditions.push({ createdById: session.user.id });
    }

    if (nameQuery) {
      conditions.push({
        name: { contains: nameQuery, mode: "insensitive" },
      });
    }

    if (companyQuery) {
      conditions.push({
        companyName: { contains: companyQuery, mode: "insensitive" },
      });
    }

    if (countryFilter) {
      conditions.push({ country: countryFilter });
    }

    if (segmentFilter) {
      conditions.push({ segment: segmentFilter });
    }

    if (emailQuery) {
      conditions.push({
        createdBy: { email: { contains: emailQuery, mode: "insensitive" } },
      });
    }

    if (fromDate) {
      conditions.push({ createdAt: { gte: fromDate } });
    }
    if (toDate) {
      conditions.push({ createdAt: { lte: toDate } });
    }

    const where: Prisma.MarketingReportWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    const reports = await prisma.marketingReport.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, email: true, name: true, team: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data: MarketingReportItem[] = reports.map((report) => ({
      id: report.id,
      documentId: report.documentId,
      name: report.name,
      companyName: report.companyName,
      country: report.country,
      segment: report.segment,
      url: report.url,
      createdAt: report.createdAt.toISOString(),
      creator: {
        id: report.createdBy.id,
        email: report.createdBy.email,
        name: report.createdBy.name,
        team: report.createdBy.team,
      },
    }));

    const countryOptions = Array.from(
      new Set(data.map((item) => item.country).filter((value): value is string => Boolean(value))),
    ).sort((a, b) => a.localeCompare(b));

    const segmentOptions = Array.from(
      new Set(data.map((item) => item.segment).filter((value): value is string => Boolean(value))),
    ).sort((a, b) => a.localeCompare(b));

    const teamOptions =
      isAdmin || isLeader
        ? Array.from(
            new Set(
              data
                .map((item) => item.creator.team)
                .filter((value): value is string => Boolean(value)),
            ),
          ).sort((a, b) => a.localeCompare(b))
        : [];

    return NextResponse.json({
      data,
      meta: {
        isAdmin,
        isLeader,
        countryOptions,
        segmentOptions,
        teamOptions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
