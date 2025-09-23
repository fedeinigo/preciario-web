// src/lib/google-system.ts
import { google, docs_v1, drive_v3 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { JWT } from "google-auth-library";

export type LineItem = {
  name: string;
  quantity: number;
  unitPrice: number; // neto
  devHours: number;
};

type SystemAuth =
  | { kind: "oauth2"; client: OAuth2Client }
  | { kind: "sa"; client: JWT };

function has(str?: string | null): str is string {
  return typeof str === "string" && str.trim().length > 0;
}

/** Elige OAuth (con refresh token) o Service Account según envs. */
export function getSystemAuth(): SystemAuth {
  const cid = process.env.GOOGLE_OAUTH_CLIENT_ID ?? "";
  const csec = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "";
  const refresh = process.env.GOOGLE_OAUTH_REFRESH_TOKEN ?? "";

  if (has(cid) && has(csec) && has(refresh)) {
    const oauth2 = new google.auth.OAuth2(cid, csec);
    oauth2.setCredentials({ refresh_token: refresh });
    return { kind: "oauth2", client: oauth2 };
  }

  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "";
  const saPkRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "";
  const saPk = saPkRaw.replace(/\\n/g, "\n");
  const subject = process.env.GOOGLE_IMPERSONATE_SUBJECT;

  if (has(saEmail) && has(saPk)) {
    const jwt = new JWT({
      email: saEmail,
      key: saPk,
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/documents",
      ],
      subject: subject && subject.trim().length > 0 ? subject : undefined,
    });
    return { kind: "sa", client: jwt };
  }

  throw new Error(
    "Config de Google inválida: defina OAUTH (CLIENT_ID/SECRET/REFRESH_TOKEN) o Service Account (EMAIL/PRIVATE_KEY)."
  );
}

export async function getSystemGoogleClients(): Promise<{
  docs: docs_v1.Docs;
  drive: drive_v3.Drive;
}> {
  const auth = getSystemAuth();
  const client: OAuth2Client | JWT = auth.client;
  const docs = google.docs({ version: "v1", auth: client });
  const drive = google.drive({ version: "v3", auth: client });
  return { docs, drive };
}

export function pickTemplateIdByCountry(country: string): string {
  const main = process.env.GOOGLE_DOCS_TEMPLATE_ID ?? "";
  const br = process.env.GOOGLE_DOCS_TEMPLATE_ID_BR ?? main;
  const c = (country ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toUpperCase();
  if (c === "BRASIL" || c === "BRAZIL") return br;
  return main;
}

export async function copyTemplateDoc(
  drive: drive_v3.Drive,
  templateId: string,
  title: string
): Promise<{ docId: string; webViewLink: string }> {
  const folderId = process.env.GOOGLE_DRIVE_PROPOSALS_FOLDER_ID ?? undefined;

  const copyResp = await drive.files.copy({
    fileId: templateId,
    requestBody: {
      name: title,
      parents: folderId ? [folderId] : undefined,
    },
    fields: "id, webViewLink",
  });
  const docId = copyResp.data.id;
  if (!docId) throw new Error("No se pudo copiar la plantilla de Google Docs.");

  // Link compartible (si aplica)
  await drive.permissions.create({
    fileId: docId,
    requestBody: {
      role: "reader",
      type: "anyone",
      allowFileDiscovery: false,
    },
  });

  const meta = await drive.files.get({
    fileId: docId,
    fields: "webViewLink",
  });

  return {
    docId,
    webViewLink:
      meta.data.webViewLink ?? `https://docs.google.com/document/d/${docId}/edit`,
  };
}

export async function fillDocPlaceholders(
  docs: docs_v1.Docs,
  docId: string,
  replacements: Record<string, string>
): Promise<void> {
  const requests: docs_v1.Schema$Request[] = [];

  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{{${key}}}`;
    requests.push({
      replaceAllText: {
        containsText: { text: placeholder, matchCase: true },
        replaceText: value,
      },
    });
  }

  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests },
    });
  }
}

export async function insertItemsTable(
  docs: docs_v1.Docs,
  docId: string,
  items: LineItem[],
  anchorPlaceholder = "{{ITEMS_TABLE}}"
): Promise<void> {
  // Buscamos placeholder; si no está, insertamos al final.
  const doc = await docs.documents.get({ documentId: docId });
  const content = doc.data.body?.content ?? [];

  // obtener endIndex sin usar .at(-1) (compatibilidad TS/Node)
  const lastEl =
    content.length > 0 ? content[content.length - 1] : undefined;
  const bodyEndIndex = (lastEl?.endIndex ?? 1) - 1;

  let insertIndex = bodyEndIndex;

  for (const el of content) {
    const elements = el.paragraph?.elements ?? [];
    for (const r of elements) {
      const t = r.textRun?.content ?? "";
      if (t.includes(anchorPlaceholder)) {
        insertIndex = (el.startIndex ?? bodyEndIndex);
        break;
      }
    }
  }

  const header = ["SKU / Ítem", "Cant.", "Horas", "Precio Unit.", "Subtotal"];
  const rows = [
    header,
    ...items.map((it) => [
      it.name,
      String(it.quantity),
      String(it.devHours),
      it.unitPrice.toFixed(2),
      (it.unitPrice * it.quantity).toFixed(2),
    ]),
  ];

  const nRows = rows.length;
  const nCols = header.length;

  const reqs: docs_v1.Schema$Request[] = [];

  reqs.push({
    insertTable: {
      rows: nRows,
      columns: nCols,
      location: { index: insertIndex },
    },
  });

  // Nota: poblar celdas con Docs API requiere segment IDs para precisión.
  // Para mantenerlo simple, insertamos el texto secuencialmente.
  // (Funciona para plantillas básicas; si después querés estilos, lo mejor es usar batch con segmentIds.)
  let textIndexOffset = insertIndex + 1;
  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      const text = rows[r][c] ?? "";
      reqs.push({
        insertText: {
          text,
          location: { index: textIndexOffset },
        },
      });
      textIndexOffset += text.length;
    }
  }

  if (reqs.length > 0) {
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests: reqs },
    });
  }
}

export async function createProposalDocSystem(args: {
  companyName: string;
  country: string;
  subsidiary: string;
  items: LineItem[];
  totalAmount: number;
  totalHours: number;
  oneShot: number;
}): Promise<{ docId: string; docUrl: string }> {
  const { docs, drive } = await getSystemGoogleClients();
  const templateId = pickTemplateIdByCountry(args.country);
  const title = `${args.companyName} - Propuesta`;
  const { docId, webViewLink } = await copyTemplateDoc(drive, templateId, title);

  await fillDocPlaceholders(docs, docId, {
    COMPANY_NAME: args.companyName,
    COUNTRY: args.country,
    SUBSIDIARY: args.subsidiary,
    TOTAL_AMOUNT: args.totalAmount.toFixed(2),
    TOTAL_HOURS: String(args.totalHours),
    ONESHOT: args.oneShot.toFixed(2),
    DATE: new Date().toLocaleDateString("es-AR"),
  });

  await insertItemsTable(docs, docId, args.items);

  return { docId, docUrl: webViewLink };
}
