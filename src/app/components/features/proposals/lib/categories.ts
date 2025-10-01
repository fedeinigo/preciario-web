// src/app/components/features/proposals/lib/categories.ts
import {
  createProposalCodeError,
  isProposalError,
  parseProposalErrorResponse,
  type ProposalError,
  type ProposalErrorCode,
} from "./errors";

async function parseCategoryError(
  res: Response,
  fallbackCode: ProposalErrorCode
): Promise<ProposalError> {
  try {
    const data = (await res.clone().json()) as { error?: unknown; message?: unknown };
    const message =
      typeof data?.error === "string"
        ? data.error
        : typeof data?.message === "string"
        ? data.message
        : undefined;
    if (message) {
      return { kind: "message", message };
    }
  } catch {
    // ignore parsing errors
  }
  return parseProposalErrorResponse(res, fallbackCode);
}

export async function fetchItemCategories(): Promise<string[]> {
  try {
    const res = await fetch("/api/items/categories", { cache: "no-store" });
    if (!res.ok) {
      throw await parseCategoryError(res, "catalog.categories.loadFailed");
    }
    return (await res.json()) as string[];
  } catch (error) {
    if (isProposalError(error)) throw error;
    throw createProposalCodeError("catalog.categories.loadFailed");
  }
}

export async function createItemCategory(name: string): Promise<void> {
  try {
    const res = await fetch("/api/items/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      throw await parseCategoryError(res, "catalog.categories.createFailed");
    }
  } catch (error) {
    if (isProposalError(error)) throw error;
    throw createProposalCodeError("catalog.categories.createFailed");
  }
}

export async function renameItemCategory(from: string, to: string): Promise<void> {
  try {
    const res = await fetch("/api/items/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to }),
    });
    if (!res.ok) {
      throw await parseCategoryError(res, "catalog.categories.renameFailed");
    }
  } catch (error) {
    if (isProposalError(error)) throw error;
    throw createProposalCodeError("catalog.categories.renameFailed");
  }
}

export async function deleteItemCategory(
  name: string,
  replaceWith: string | null
): Promise<string | null> {
  try {
    const res = await fetch("/api/items/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, replaceWith: replaceWith ?? undefined }),
    });
    if (!res.ok) {
      throw await parseCategoryError(res, "catalog.categories.deleteFailed");
    }
    const data = (await res.json()) as { to?: string };
    return typeof data?.to === "string" ? data.to : replaceWith;
  } catch (error) {
    if (isProposalError(error)) throw error;
    throw createProposalCodeError("catalog.categories.deleteFailed");
  }
}
