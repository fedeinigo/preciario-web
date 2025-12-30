import type { Prisma } from "@prisma/client";
import { ProposalStatus } from "@prisma/client";

import prisma from "@/lib/prisma";

export type ProposalFilters = {
  from?: string | null;
  to?: string | null;
  userEmail?: string | null;
  country?: string | null;
  status?: string | null;
  team?: string | null;
  idQuery?: string | null;
  companyQuery?: string | null;
  emailQuery?: string | null;
};

export function parseDate(value: string): Date | undefined {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export function parseEndOfDay(value: string): Date | undefined {
  const parsed = parseDate(value);
  if (!parsed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    parsed.setUTCHours(23, 59, 59, 999);
  }
  return parsed;
}

function normalizeContains(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeEquals(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeProposalStatus(value: string | null | undefined): ProposalStatus | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toUpperCase();
  const valid = new Set<string>(Object.values(ProposalStatus));
  if (!valid.has(normalized)) return undefined;
  return normalized as ProposalStatus;
}

async function buildTeamFilter(team: string): Promise<Prisma.ProposalWhereInput | null> {
  const normalized = team.trim();
  if (!normalized) return null;
  const users = await prisma.user.findMany({
    where: { team: normalized },
    select: { id: true, email: true },
  });
  const ids = users.map((u) => u.id).filter((id): id is string => Boolean(id));
  const emails = users.map((u) => u.email).filter((email): email is string => Boolean(email));
  if (ids.length === 0 && emails.length === 0) {
    return { id: "__none__" };
  }
  const orFilters: Prisma.ProposalWhereInput[] = [];
  if (ids.length > 0) {
    orFilters.push({ userId: { in: ids } });
  }
  if (emails.length > 0) {
    orFilters.push({ userEmail: { in: emails } });
  }
  return orFilters.length > 0 ? { OR: orFilters } : null;
}

export async function buildProposalWhere(filters: ProposalFilters): Promise<Prisma.ProposalWhereInput> {
  const where: Prisma.ProposalWhereInput = { deletedAt: null };
  const userEmail = normalizeEquals(filters.userEmail ?? undefined);
  const country = normalizeEquals(filters.country ?? undefined);
  const status = normalizeProposalStatus(filters.status);
  const idQuery = normalizeContains(filters.idQuery ?? undefined);
  const companyQuery = normalizeContains(filters.companyQuery ?? undefined);
  const emailQuery = normalizeContains(filters.emailQuery ?? undefined);
  const team = normalizeEquals(filters.team ?? undefined);

  if (userEmail === "__null__") {
    where.userEmail = null;
  } else if (userEmail) {
    where.userEmail = userEmail;
  }
  if (country) {
    where.country = country;
  }
  if (status) {
    where.status = status;
  }

  const createdAtFilter: Prisma.DateTimeFilter = {};
  if (filters.from) {
    const fromDate = parseDate(filters.from);
    if (fromDate) {
      createdAtFilter.gte = fromDate;
    }
  }
  if (filters.to) {
    const toDate = parseEndOfDay(filters.to);
    if (toDate) {
      createdAtFilter.lte = toDate;
    }
  }
  if (Object.keys(createdAtFilter).length > 0) {
    where.createdAt = createdAtFilter;
  }

  const andFilters: Prisma.ProposalWhereInput[] = [];
  if (idQuery) {
    andFilters.push({ id: { contains: idQuery, mode: "insensitive" } });
  }
  if (companyQuery) {
    andFilters.push({ companyName: { contains: companyQuery, mode: "insensitive" } });
  }
  if (emailQuery) {
    andFilters.push({ userEmail: { contains: emailQuery, mode: "insensitive" } });
  }
  if (team) {
    const teamFilter = await buildTeamFilter(team);
    if (teamFilter) {
      andFilters.push(teamFilter);
    }
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  return where;
}
