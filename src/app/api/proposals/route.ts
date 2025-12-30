// src/app/api/proposals/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import { isFeatureEnabled } from "@/lib/feature-flags";
import prisma from "@/lib/prisma";
import { buildProposalWhere, normalizeProposalStatus } from "./query";

const proposalItemSchema = z.object({
  itemId: z.string().min(1, { message: "itemId requerido" }),
  quantity: z.number().int().positive({ message: "quantity debe ser mayor a cero" }),
  unitPrice: z.number().nonnegative({ message: "unitPrice debe ser mayor o igual a cero" }),
  devHours: z.number().nonnegative({ message: "devHours debe ser mayor o igual a cero" }),
});

const proposalPayloadSchema = z.object({
  companyName: z.string().min(1),
  country: z.string().min(1),
  countryId: z.string().min(1),
  subsidiary: z.string().min(1),
  subsidiaryId: z.string().min(1),
  totalAmount: z.number(),
  totalHours: z.number(),
  oneShot: z.number(),
  docUrl: z.string().url().nullable().optional(),
  docId: z.string().min(1).nullable().optional(),
  userId: z.string().min(1).optional(),
  userEmail: z.string().email().optional(),
  items: z.array(proposalItemSchema).min(1),
});

function parseBooleanParam(value: string | null, defaultValue: boolean) {
  if (value === null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
}

function resolveOrderBy(
  sortKey: string | null,
  sortDir: string | null
): Prisma.ProposalOrderByWithRelationInput {
  const dir = sortDir === "asc" ? "asc" : "desc";
  switch (sortKey) {
    case "id":
      return { id: dir };
    case "company":
      return { companyName: dir };
    case "country":
      return { country: dir };
    case "email":
      return { userEmail: dir };
    case "monthly":
      return { totalAmount: dir };
    case "status":
      return { status: dir };
    case "created":
    default:
      return { createdAt: "desc" };
  }
}

async function fetchCountryFacets(where: Prisma.ProposalWhereInput): Promise<string[]> {
  const rows = await prisma.proposal.findMany({
    where,
    distinct: ["country"],
    select: { country: true },
    orderBy: { country: "asc" },
  });
  return rows.map((row) => row.country).filter(Boolean);
}

/** GET /api/proposals */
export async function GET(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;

  const url = new URL(request.url);
  const aggregate = url.searchParams.get("aggregate");
  const userEmail = url.searchParams.get("userEmail")?.trim() ?? null;
  const statusParam = url.searchParams.get("status")?.trim() ?? null;
  const fromParam = url.searchParams.get("from")?.trim() ?? null;
  const toParam = url.searchParams.get("to")?.trim() ?? null;
  const idQuery = url.searchParams.get("id")?.trim() ?? null;
  const companyQuery = url.searchParams.get("company")?.trim() ?? null;
  const emailQuery = url.searchParams.get("email")?.trim() ?? null;
  const team = url.searchParams.get("team")?.trim() ?? null;
  const country = url.searchParams.get("country")?.trim() ?? null;
  const sku = url.searchParams.get("sku")?.trim() ?? null;

  const includeItems = parseBooleanParam(url.searchParams.get("includeItems"), true);
  const includeFacets = parseBooleanParam(url.searchParams.get("includeFacets"), false);

  const where = await buildProposalWhere({
    userEmail,
    status: statusParam,
    from: fromParam,
    to: toParam,
    idQuery,
    companyQuery,
    emailQuery,
    team,
    country,
  });

  if (sku) {
    const andFilters = Array.isArray(where.AND) ? [...where.AND] : [];
    andFilters.push({
      items: {
        some: {
          item: {
            sku: { equals: sku, mode: "insensitive" },
          },
        },
      },
    });
    where.AND = andFilters;
  }

  if (aggregate === "sum") {
    const normalizedStatus = normalizeProposalStatus(statusParam);
    if (normalizedStatus) {
      where.status = normalizedStatus;
    }
    const aggregateResult = await prisma.proposal.aggregate({
      where,
      _sum: { totalAmount: true },
      _count: { _all: true },
    });

    const totalAmount = Number(aggregateResult._sum?.totalAmount ?? 0);
    const count = aggregateResult._count?._all ?? 0;

    return NextResponse.json({ totalAmount, count });
  }

  if (aggregate === "activeUsers") {
    const activeUsersWhere: Prisma.ProposalWhereInput = { ...where };

    if (!userEmail) {
      activeUsersWhere.userEmail = { not: null };
    }

    const groups = await prisma.proposal.groupBy({
      where: activeUsersWhere,
      by: ["userEmail"],
    });

    const activeUsers = groups.filter((group) => group.userEmail).length;

    return NextResponse.json({ activeUsers });
  }

  const sortKey = url.searchParams.get("sortKey");
  const sortDir = url.searchParams.get("sortDir");
  const orderBy = resolveOrderBy(sortKey, sortDir);
  const itemSelect = includeItems
    ? {
        items: {
          select: {
            quantity: true,
            item: { select: { sku: true, name: true } },
          },
        },
      }
    : {};

  if (!isFeatureEnabled("proposalsPagination")) {
    const rows = await prisma.proposal.findMany({
      where,
      orderBy,
      select: {
        id: true,
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
        wonType: true,
        ...itemSelect,
      },
    });

    const data = rows.map((p) => ({
      id: p.id,
      companyName: p.companyName,
      country: p.country,
      countryId: p.countryId,
      subsidiary: p.subsidiary,
      subsidiaryId: p.subsidiaryId,
      totalAmount: Number(p.totalAmount),
      totalHours: Number(p.totalHours),
      oneShot: Number(p.oneShot),
      docUrl: p.docUrl,
      docId: p.docId,
      userId: p.userId,
      userEmail: p.userEmail,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      status: p.status,
      wonAt: p.wonAt,
      wonType: p.wonType ?? null,
      items: includeItems
        ? (
            p.items as Array<{ quantity: number; item?: { sku?: string | null; name?: string | null } }>
          ).map((pi) => ({
            sku: pi.item?.sku ?? "",
            name: pi.item?.name ?? "",
            quantity: Number(pi.quantity),
          }))
        : undefined,
    }));

    return NextResponse.json(data);
  }

  const page = Math.max(parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1);
  const pageSizeParam = parseInt(url.searchParams.get("pageSize") ?? "20", 10);
  const pageSize = Math.min(Math.max(pageSizeParam || 20, 1), 100);
  const skip = (page - 1) * pageSize;

  const [rows, totalItems] = await Promise.all([
    prisma.proposal.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
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
        wonType: true,
        ...itemSelect,
      },
    }),
    prisma.proposal.count({ where }),
  ]);

  const data = rows.map((p) => ({
    id: p.id,
    companyName: p.companyName,
    country: p.country,
    countryId: p.countryId,
    subsidiary: p.subsidiary,
    subsidiaryId: p.subsidiaryId,
    totalAmount: Number(p.totalAmount),
    totalHours: Number(p.totalHours),
    oneShot: Number(p.oneShot),
    docUrl: p.docUrl,
    docId: p.docId,
    userId: p.userId,
    userEmail: p.userEmail,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    status: p.status,
    wonAt: p.wonAt,
    wonType: p.wonType ?? null,
    items: includeItems
      ? (
          p.items as Array<{ quantity: number; item?: { sku?: string | null; name?: string | null } }>
        ).map((pi) => ({
          sku: pi.item?.sku ?? "",
          name: pi.item?.name ?? "",
          quantity: Number(pi.quantity),
        }))
      : undefined,
  }));

  const facets = includeFacets ? { countries: await fetchCountryFacets(where) } : undefined;

  return NextResponse.json({
    data,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
    ...(facets ? { facets } : {}),
  });
}

/** POST /api/proposals */
export async function POST(req: Request) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const raw = await req.json();
  const parsed = proposalPayloadSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload inválido",
        details: parsed.error.format(),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;

  const resolvedUserId = body.userId?.trim() || session?.user?.id || null;
  const resolvedUserEmail = body.userEmail?.trim() || session?.user?.email || null;

  if (
    isFeatureEnabled("secureApiRoutes") &&
    session?.user?.id &&
    resolvedUserId &&
    resolvedUserId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Prisma.ProposalCreateInput = {
    id: randomUUID(),
    companyName: body.companyName,
    country: body.country,
    countryId: body.countryId,
    subsidiary: body.subsidiary,
    subsidiaryId: body.subsidiaryId,
    totalAmount: body.totalAmount,
    totalHours: body.totalHours,
    oneShot: body.oneShot,
    docUrl: body.docUrl ?? null,
    docId: body.docId ?? null,
    userId: resolvedUserId,
    userEmail: resolvedUserEmail,
    status: "OPEN",
    wonType: null,
    items: {
      create: body.items.map((it) => ({
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        devHours: it.devHours,
        item: { connect: { id: it.itemId } },
      })),
    },
  };

  const created = await prisma.proposal.create({
    data,
    select: {
      id: true,
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
      wonType: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}










