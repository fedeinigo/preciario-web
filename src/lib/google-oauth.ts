// src/lib/google-oauth.ts
import { google, docs_v1, drive_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve clientes autenticados de Docs y Drive usando los tokens
 * almacenados por NextAuth (cuenta de Google del usuario actual).
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

  const oauth2 = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
