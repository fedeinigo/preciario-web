// src/app/api/mapache/statuses/utils.ts
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

import { normalizeMapacheStatusKey } from "../tasks/access";

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function parseStatusKey(
  value: unknown,
  { required }: { required: boolean },
): string | undefined | NextResponse {
  if (value === undefined || value === null) {
    if (required) {
      return badRequest("key is required");
    }
    return undefined;
  }

  const normalized = normalizeMapacheStatusKey(value);
  if (!normalized) {
    return badRequest("key must be a non-empty string");
  }

  return normalized;
}

export function parseLabel(
  value: unknown,
  { required }: { required: boolean },
): string | undefined | NextResponse {
  if (value === undefined || value === null) {
    if (required) {
      return badRequest("label is required");
    }
    return undefined;
  }

  if (typeof value !== "string") {
    return badRequest("label must be a string");
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return badRequest("label must not be empty");
  }

  return trimmed;
}

export function parseOrder(
  value: unknown,
  { required }: { required: boolean },
): number | undefined | NextResponse {
  if (value === undefined || value === null) {
    if (required) {
      return badRequest("order is required");
    }
    return undefined;
  }

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return badRequest("order must be an integer");
  }

  return parsed;
}

export async function getNextOrder() {
  const lastStatus = await prisma.mapacheStatus.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return lastStatus ? lastStatus.order + 1 : 0;
}
