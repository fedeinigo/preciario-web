// src/app/components/features/proposals/lib/errors.ts
export type ProposalErrorCode =
  | "catalog.loadFailed"
  | "catalog.createFailed"
  | "catalog.updateFailed"
  | "catalog.deleteFailed"
  | "catalog.categories.loadFailed"
  | "catalog.categories.createFailed"
  | "catalog.categories.renameFailed"
  | "catalog.categories.deleteFailed"
  | "filiales.loadFailed"
  | "filiales.createGroupFailed"
  | "filiales.renameGroupFailed"
  | "filiales.deleteGroupFailed"
  | "filiales.createCountryFailed"
  | "filiales.renameCountryFailed"
  | "filiales.deleteCountryFailed"
  | "glossary.loadFailed"
  | "glossary.createFailed"
  | "glossary.updateFailed"
  | "glossary.deleteFailed"
  | "pricing.whatsAppFailed"
  | "pricing.minutesFailed"
  | "proposal.saveFailed";

export type ProposalError =
  | { kind: "code"; code: ProposalErrorCode }
  | { kind: "message"; message: string };

export type ProposalActionResult = { ok: true } | { ok: false; error: ProposalError };

export function createProposalCodeError(code: ProposalErrorCode): ProposalError {
  return { kind: "code", code };
}

export async function parseProposalErrorResponse(
  res: Response,
  fallbackCode: ProposalErrorCode
): Promise<ProposalError> {
  try {
    const data = (await res.clone().json()) as {
      error?: unknown;
      message?: unknown;
    };
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
    // ignore JSON parsing errors and fall back to text body
  }
  const text = await res.text().catch(() => "");
  if (text) return { kind: "message", message: text };
  return createProposalCodeError(fallbackCode);
}

export function isProposalError(value: unknown): value is ProposalError {
  if (typeof value !== "object" || value === null) return false;
  const kind = (value as { kind?: unknown }).kind;
  if (kind === "code") {
    return typeof (value as { code?: unknown }).code === "string";
  }
  if (kind === "message") {
    return typeof (value as { message?: unknown }).message === "string";
  }
  return false;
}
