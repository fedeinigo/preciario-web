// src/app/components/features/proposals/lib/errors.ts
export type ProposalErrorCode =
  | "catalog.loadFailed"
  | "catalog.createFailed"
  | "catalog.updateFailed"
  | "catalog.deleteFailed"
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
