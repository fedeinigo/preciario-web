// src/app/api/goals/wins/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { Role, WonDealType } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quarterRange } from "@/lib/quarter";

const quarterSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

type Quarter = z.infer<typeof quarterSchema>;

type Viewer = {
  id: string;
  role: Role;
  team: string | null;
};

type Target = {
  id: string;
  team: string | null;
};

function parseIntParam(value: string | null, fallback: number): number {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function getViewer(): Promise<Viewer | null> {
  const session = await auth();
  const id = session?.user?.id as string | undefined;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, team: true },
  });
  if (!user) return null;
  return { id: user.id, role: user.role, team: user.team ?? null };
}

async function resolveTarget(viewer: Viewer, opts: { userId?: string | null; email?: string | null }): Promise<Target | null> {
  const { userId, email } = opts;
  if (!userId && !email) {
    const team = viewer.team ?? null;
    return { id: viewer.id, team };
  }

  const target = await prisma.user.findFirst({
    where: userId ? { id: userId } : { email: email ?? undefined },
    select: { id: true, team: true },
  });
  if (!target) return null;

  if (canManageTarget(viewer, { id: target.id, team: target.team ?? null })) {
    return { id: target.id, team: target.team ?? null };
  }

  return null;
}

function canManageTarget(viewer: Viewer, target: Target): boolean {
  if (viewer.id === target.id) return true;
  if (viewer.role === Role.admin) return true;
  if (viewer.role === Role.lider && viewer.team && viewer.team === target.team) return true;
  return false;
}

function toCurrency(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

type DealResponse = {
  id: string;
  type: "auto" | "manual";
  companyName: string;
  monthlyFee: number;
  billedAmount: number;
  pendingAmount: number;
  billingPct: number;
  link: string | null;
  createdAt: string;
  proposalId?: string;
  manualDealId?: string;
  docId?: string | null;
  docUrl?: string | null;
  wonType: WonDealType;
};

function buildDealResponse(params: {
  id: string;
  type: "auto" | "manual";
  companyName?: string | null;
  monthlyFee?: unknown;
  billedAmount?: unknown;
  link?: string | null;
  createdAt: Date;
  proposalId?: string;
  manualDealId?: string;
  docId?: string | null;
  docUrl?: string | null;
  wonType?: WonDealType | null;
}): DealResponse {
  const monthlyFee = Math.max(0, toCurrency(params.monthlyFee));
  const billedAmount = Math.max(0, toCurrency(params.billedAmount));
  const pendingAmount = Math.max(0, monthlyFee - billedAmount);
  const billingPct = monthlyFee > 0 ? (billedAmount / monthlyFee) * 100 : 0;
  const wonType = params.wonType ?? WonDealType.NEW_CUSTOMER;
  return {
    id: params.id,
    type: params.type,
    companyName: (params.companyName ?? "").trim() || "—",
    monthlyFee,
    billedAmount,
    pendingAmount,
    billingPct,
    link: params.link ?? null,
    createdAt: params.createdAt.toISOString(),
    proposalId: params.proposalId,
    manualDealId: params.manualDealId,
    docId: params.docId,
    docUrl: params.docUrl,
    wonType,
  };
}

export async function GET(req: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const year = parseIntParam(url.searchParams.get("year"), new Date().getFullYear());
  const quarterParam = parseIntParam(url.searchParams.get("quarter"), 1) as Quarter;
  const quarter = quarterSchema.safeParse(quarterParam).success ? (quarterParam as Quarter) : 1;
  const target = await resolveTarget(viewer, {
    userId: url.searchParams.get("userId"),
    email: url.searchParams.get("email"),
  });

  if (!target) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { from, to } = quarterRange(year, quarter);

  const [proposals, manualDeals] = await Promise.all([
    prisma.proposal.findMany({
      where: {
        userId: target.id,
        status: "WON",
        deletedAt: null,
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        companyName: true,
        totalAmount: true,
        docId: true,
        docUrl: true,
        createdAt: true,
        wonType: true,
        billing: { select: { billedAmount: true } },
      },
    }),
    prisma.manualWonDeal.findMany({
      where: { userId: target.id, year, quarter },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        companyName: true,
        monthlyFee: true,
        proposalUrl: true,
        createdAt: true,
        wonType: true,
        billing: { select: { billedAmount: true } },
      },
    }),
  ]);

  const deals: DealResponse[] = [];

  for (const proposal of proposals) {
    deals.push(
      buildDealResponse({
        id: `proposal-${proposal.id}`,
        type: "auto",
        companyName: proposal.companyName,
        monthlyFee: proposal.totalAmount,
        billedAmount: proposal.billing?.billedAmount,
        link: proposal.docUrl ?? null,
        createdAt: proposal.createdAt,
        proposalId: proposal.id,
        docId: proposal.docId,
        docUrl: proposal.docUrl,
        wonType: proposal.wonType ?? null,
      })
    );
  }

  for (const manual of manualDeals) {
    deals.push(
      buildDealResponse({
        id: `manual-${manual.id}`,
        type: "manual",
        companyName: manual.companyName,
        monthlyFee: manual.monthlyFee,
        billedAmount: manual.billing?.billedAmount,
        link: manual.proposalUrl ?? null,
        createdAt: manual.createdAt,
        manualDealId: manual.id,
        wonType: manual.wonType,
      })
    );
  }

  deals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const progress = deals.reduce((sum, deal) => sum + deal.monthlyFee, 0);
  const totalBilled = deals.reduce((sum, deal) => sum + deal.billedAmount, 0);
  const totalPending = deals.reduce((sum, deal) => sum + deal.pendingAmount, 0);

  return NextResponse.json({
    year,
    quarter,
    userId: target.id,
    progress,
    totals: {
      monthlyFees: progress,
      billed: totalBilled,
      pending: totalPending,
    },
    deals,
  });
}

const createManualSchema = z.object({
  companyName: z.string().min(1),
  monthlyFee: z.number().min(0),
  proposalUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  year: z.number().int().optional(),
  quarter: quarterSchema.optional(),
  userId: z.string().optional(),
  email: z.string().email().optional(),
  wonType: z.enum([WonDealType.NEW_CUSTOMER, WonDealType.UPSELL]),
});

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createManualSchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { companyName, monthlyFee, proposalUrl, year, quarter, userId, email, wonType } = parsed.data;
  const now = new Date();
  const effectiveYear = Number.isFinite(year) ? (year as number) : now.getFullYear();
  const effectiveQuarter = quarter ?? (((Math.floor(now.getMonth() / 3) + 1) as Quarter));

  const target = await resolveTarget(viewer, { userId, email });
  if (!target) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deal = await prisma.manualWonDeal.create({
    data: {
      userId: target.id,
      createdById: viewer.id,
      companyName,
      monthlyFee,
      proposalUrl,
      year: effectiveYear,
      quarter: effectiveQuarter,
      wonType,
    },
  });

  return NextResponse.json(
    buildDealResponse({
      id: `manual-${deal.id}`,
      type: "manual",
      companyName: deal.companyName,
      monthlyFee: deal.monthlyFee,
      billedAmount: 0,
      link: deal.proposalUrl ?? null,
      createdAt: deal.createdAt,
      manualDealId: deal.id,
      wonType: deal.wonType,
    }),
    { status: 201 }
  );
}

const updateBillingSchema = z.object({
  proposalId: z.string().optional(),
  manualDealId: z.string().optional(),
  billedAmount: z.number().min(0),
});

const deleteManualSchema = z.object({
  manualDealId: z.string().min(1),
});

export async function PATCH(req: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = updateBillingSchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { proposalId, manualDealId, billedAmount } = parsed.data;
  if (!proposalId && !manualDealId) {
    return NextResponse.json({ error: "Missing identifiers" }, { status: 400 });
  }
  if (proposalId && manualDealId) {
    return NextResponse.json({ error: "Provide a single identifier" }, { status: 400 });
  }

  let target: Target | null = null;

  if (proposalId) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        userId: true,
      },
    });
    if (!proposal || !proposal.userId) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }
    const proposalOwner = await prisma.user.findUnique({
      where: { id: proposal.userId },
      select: { team: true },
    });
    target = { id: proposal.userId, team: proposalOwner?.team ?? null };
  } else if (manualDealId) {
    const manual = await prisma.manualWonDeal.findUnique({
      where: { id: manualDealId },
      select: { userId: true, user: { select: { team: true } } },
    });
    if (!manual) {
      return NextResponse.json({ error: "Manual deal not found" }, { status: 404 });
    }
    target = { id: manual.userId, team: manual.user?.team ?? null };
  }

  if (!target || !canManageTarget(viewer, target)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: { proposalId?: string | null; manualWonDealId?: string | null; billedAmount: number } = {
    billedAmount,
  };

  if (proposalId) {
    data.proposalId = proposalId;
  }
  if (manualDealId) {
    data.manualWonDealId = manualDealId;
  }

  const where = proposalId
    ? ({ proposalId } as const)
    : ({ manualWonDealId: manualDealId! } as const);

  const record = await prisma.wonDealBilling.upsert({
    where,
    create: data,
    update: { billedAmount },
    select: { billedAmount: true },
  });

  return NextResponse.json({ billedAmount: toCurrency(record.billedAmount) });
}

export async function DELETE(req: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const raw = { manualDealId: url.searchParams.get("manualDealId") };
  const parsed = deleteManualSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing manualDealId" }, { status: 400 });
  }

  const { manualDealId } = parsed.data;
  const manual = await prisma.manualWonDeal.findUnique({
    where: { id: manualDealId },
    select: { userId: true, user: { select: { team: true } } },
  });
  if (!manual) {
    return NextResponse.json({ error: "Manual deal not found" }, { status: 404 });
  }

  if (!canManageTarget(viewer, { id: manual.userId, team: manual.user?.team ?? null })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.manualWonDeal.delete({ where: { id: manualDealId } });

  return NextResponse.json({ ok: true }, { status: 200 });
}
