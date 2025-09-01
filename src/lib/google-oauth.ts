// src/lib/google-oauth.ts
import { google, docs_v1, drive_v3 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve clientes autenticados de Google Docs y Google Drive
 * usando los tokens almacenados por NextAuth (proveedor: "google")
 * para el usuario actual.
 */
export async function getGoogleClientsForUser(
  userId: string
): Promise<{ docs: docs_v1.Docs; drive: drive_v3.Drive }> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account) {
    throw new Error("Tu cuenta no está vinculada con Google.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en el entorno.");
  }

  const oauth2 = new google.auth.OAuth2({
    clientId,
    clientSecret,
  });

  oauth2.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  const docs = google.docs({ version: "v1", auth: oauth2 });
  const drive = google.drive({ version: "v3", auth: oauth2 });

  return { docs, drive };
}

/**
 * Devuelve un OAuth2Client para consumir Google Sheets.
 *
 * - Si se pasa `userId`, intenta usar los tokens del usuario (NextAuth).
 * - Si no hay tokens válidos o no se pasa `userId`, cae a
 *   Application Default Credentials (Service Account, Workload Identity, etc.).
 *
 * Esto permite que /api/pricing funcione tanto con tokens de usuario
 * como con credenciales de servidor.
 */
export async function getOAuthClient(userId?: string | null): Promise<OAuth2Client> {
  // 1) Intentar con la cuenta Google del usuario (si se pasó userId)
  if (userId) {
    const account = await prisma.account.findFirst({
      where: { userId, provider: "google" },
    });

    if (account) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new Error("Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en el entorno.");
      }

      const oauth2 = new google.auth.OAuth2({
        clientId,
        clientSecret,
      });

      oauth2.setCredentials({
        access_token: account.access_token ?? undefined,
        refresh_token: account.refresh_token ?? undefined,
        expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
      });

      return oauth2;
    }
  }

  // 2) Fallback: Application Default Credentials (ADC)
  // Requiere que el entorno tenga GOOGLE_APPLICATION_CREDENTIALS
  // o equivalente (Workload Identity, etc.)
  const scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
  const auth = (await google.auth.getClient({ scopes })) as OAuth2Client;
  return auth;
}
