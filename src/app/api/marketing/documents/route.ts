"use server";

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

function formatDate(now: Date) {
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  return `${day}/${month}/${year}`;
}

function formatTime(now: Date) {
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
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

    const now = new Date();
    const dateLabel = formatDate(now);
    const timeLabel = formatTime(now);
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

    const replacements: Array<Record<string, unknown>> = [
      { replaceAllText: { containsText: { text: "<-empresa->", matchCase: false }, replaceText: cleanCompanyName } },
      { replaceAllText: { containsText: { text: "<-introduccion->", matchCase: false }, replaceText: cleanIntroduction } },
      { replaceAllText: { containsText: { text: "<-analisis->", matchCase: false }, replaceText: cleanAnalysis } },
      { replaceAllText: { containsText: { text: "<-comparativa->", matchCase: false }, replaceText: cleanComparative } },
      { replaceAllText: { containsText: { text: "<-recomendaciones->", matchCase: false }, replaceText: cleanRecommendations } },
      { replaceAllText: { containsText: { text: "<-segmento->", matchCase: false }, replaceText: cleanSegment } },
      { replaceAllText: { containsText: { text: "<-datetime->", matchCase: false }, replaceText: dateLabel } },
      { replaceAllText: { containsText: { text: "<-firma->", matchCase: false }, replaceText: signer } },
    ];

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
