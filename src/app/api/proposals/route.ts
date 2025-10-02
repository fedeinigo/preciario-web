// src/app/api/proposals/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { Prisma, ProposalStatus } from "@prisma/client";

import { requireApiSession } from "@/app/api/_utils/require-auth";
import { isFeatureEnabled } from "@/lib/feature-flags";
import prisma from "@/lib/prisma";

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

function parseDate(value: string): Date | undefined {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function parseEndOfDay(value: string): Date | undefined {
  const parsed = parseDate(value);
  if (!parsed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    parsed.setUTCHours(23, 59, 59, 999);
  }
  return parsed;
}

/** GET /api/proposals */
export async function GET(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;

  const url = new URL(request.url);
  const aggregate = url.searchParams.get("aggregate");
  const userEmail = url.searchParams.get("userEmail")?.trim();
  const statusParam = url.searchParams.get("status")?.trim();
  const fromParam = url.searchParams.get("from")?.trim();
  const toParam = url.searchParams.get("to")?.trim();

  const where: Prisma.ProposalWhereInput = { deletedAt: null };
  if (userEmail) {
    where.userEmail = userEmail;
  }

  if (statusParam) {
    const normalizedStatus = statusParam.toUpperCase();
    const validStatuses = new Set<string>(Object.values(ProposalStatus));
    if (validStatuses.has(normalizedStatus)) {
      where.status = normalizedStatus as ProposalStatus;
    }
  }

  const createdAtFilter: Prisma.DateTimeFilter = {};
  if (fromParam) {
    const fromDate = parseDate(fromParam);
    if (fromDate) {
      createdAtFilter.gte = fromDate;
    }
  }

  if (toParam) {
    const toDate = parseEndOfDay(toParam);
    if (toDate) {
      createdAtFilter.lte = toDate;
    }
  }

  if (Object.keys(createdAtFilter).length > 0) {
    where.createdAt = createdAtFilter;
  }

  if (aggregate === "sum") {
    const aggregateResult = await prisma.proposal.aggregate({
      where,
      _sum: { totalAmount: true },
      _count: { _all: true },
    });

    const totalAmount = Number(aggregateResult._sum?.totalAmount ?? 0);
    const count = aggregateResult._count?._all ?? 0;

    return NextResponse.json({ totalAmount, count });
  }

  const orderBy: Prisma.ProposalOrderByWithRelationInput = { createdAt: "desc" };

  if (!isFeatureEnabled("proposalsPagination")) {
    const rows = await prisma.proposal.findMany({
      where,
      orderBy,
      include: {
        items: {
          include: {
            item: { select: { sku: true, name: true } },
          },
        },
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
      items: p.items.map((pi) => ({
        sku: pi.item?.sku ?? "",
        name: pi.item?.name ?? "",
        quantity: Number(pi.quantity),
      })),
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
        items: {
          select: {
            quantity: true,
            item: { select: { sku: true, name: true } },
          },
        },
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
    items: p.items.map((pi) => ({
      sku: pi.item?.sku ?? "",
      name: pi.item?.name ?? "",
      quantity: Number(pi.quantity),
    })),
  }));

  return NextResponse.json({
    data,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
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
    },
  });

  return NextResponse.json(created, { status: 201 });
}










