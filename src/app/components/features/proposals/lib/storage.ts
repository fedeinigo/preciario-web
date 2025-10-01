import type { SaveProposalInput, ProposalRecord } from "./types";
import {
  createProposalCodeError,
  isProposalError,
  parseProposalErrorResponse,
} from "./errors";

/** Persiste la propuesta en la DB vía API */
export async function saveProposal(input: SaveProposalInput): Promise<ProposalRecord> {
  try {
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw await parseProposalErrorResponse(res, "proposal.saveFailed");
    }
    const data = (await res.json()) as ProposalRecord;
    return data;
  } catch (error) {
    if (isProposalError(error)) throw error;
    throw createProposalCodeError("proposal.saveFailed");
  }
}
