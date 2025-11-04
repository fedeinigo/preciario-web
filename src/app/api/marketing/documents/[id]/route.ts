"use server";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/constants/teams";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function sanitize(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

async function getAccessTokenForUser(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { refresh_token: true },
  });
  if (!account?.refresh_token) {
    return { token: null };
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
    return { token: null };
  }

  const accessToken =
    typeof tokenJson === "object" && tokenJson !== null
      ? (tokenJson as Record<string, unknown>).access_token
      : undefined;
  return typeof accessToken === "string" && accessToken.length > 0 ? { token: accessToken } : { token: null };
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reportId } = await context.params;
    if (!reportId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const role = (session.user.role ?? "usuario") as AppRole;
    const isAdmin = role === "admin" || role === "superadmin";
    const leaderTeam = sanitize(session.user.team);

    const report = await prisma.marketingReport.findUnique({
      where: { id: reportId },
      include: {
        createdBy: { select: { id: true, team: true } },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }

    const isOwner = report.createdById === session.user.id;
    const sameTeam = leaderTeam ? report.createdBy.team === leaderTeam : false;

    if (!(isOwner || isAdmin || (role === "lider" && sameTeam))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { token } = await getAccessTokenForUser(report.createdById);
    if (token) {
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(report.documentId)}?supportsAllDrives=true`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      ).catch(() => undefined);
    }

    await prisma.marketingReport.delete({ where: { id: report.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
