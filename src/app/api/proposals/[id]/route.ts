// src/app/api/proposals/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProposalStatus } from "@prisma/client";

function getIdFromUrl(req: Request): string | null {
  try {
    const { pathname } = new URL(req.url);
    const parts = pathname.split("/").filter(Boolean);
    const i = parts.findIndex((p) => p === "proposals");
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
    return null;
  } catch {
    return null;
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = getIdFromUrl(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { status } = (await req.json().catch(() => ({}))) as {
    status?: ProposalStatus;
  };
  if (!status || !["OPEN", "WON", "LOST"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const p = await prisma.proposal.findUnique({
    where: { id },
    select: { id: true, userId: true, deletedAt: true },
  });
  if (!p || p.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = p.userId && p.userId === session.user.id;
  const isSuper = session.user.role === "superadmin";

  if (!isOwner && !isSuper) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.proposal.update({
    where: { id },
    data: {
      status,
      wonAt: status === "WON" ? new Date() : null,
    },
    select: {
      id: true,
      status: true,
      wonAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = getIdFromUrl(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const p = await prisma.proposal.findUnique({
    where: { id },
    select: { id: true, userId: true, deletedAt: true },
  });
  if (!p || p.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = p.userId && p.userId === session.user.id;
  const isSuper = session.user.role === "superadmin";

  if (!isOwner && !isSuper) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.proposal.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
