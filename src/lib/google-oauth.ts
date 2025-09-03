// src/lib/google-oauth.ts
import { google, docs_v1, drive_v3 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve clientes autenticados de Google Docs y Google Drive
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

  const oauth2 = new google.auth.OAuth2({ clientId, clientSecret });

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
 * OAuth2 para Sheets (tokens de usuario o ADC)
 */
export async function getOAuthClient(userId?: string | null): Promise<OAuth2Client> {
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

      const oauth2 = new google.auth.OAuth2({ clientId, clientSecret });

      oauth2.setCredentials({
        access_token: account.access_token ?? undefined,
        refresh_token: account.refresh_token ?? undefined,
        expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
      });

      return oauth2;
    }
  }

  const scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
  const auth = (await google.auth.getClient({ scopes })) as OAuth2Client;
  return auth;
}
