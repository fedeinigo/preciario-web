import type { SaveProposalInput, ProposalRecord } from "./types";
import {
  createProposalCodeError,
  isProposalError,
  parseProposalErrorResponse,
} from "./errors";
import {
  createProposalRequestSchema,
  type CreateProposalRequest,
  type ProposalLineItemInput,
} from "@/lib/schemas/proposals";

export type CreateProposalPayload = CreateProposalRequest;
export type CreateProposalItemInput = ProposalLineItemInput;

export type CreateProposalResponse = {
  proposal: ProposalRecord;
  doc: { id: string; url: string };
  meta?: { hourlyRate?: number };
};

export async function createProposal(
  input: CreateProposalPayload
): Promise<CreateProposalResponse> {
  try {
    const payload = createProposalRequestSchema.parse(input);
    const res = await fetch("/api/proposals/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw await parseProposalErrorResponse(res, "proposal.saveFailed");
    }
    const data = (await res.json()) as CreateProposalResponse;
    return data;
  } catch (error) {
    if (isProposalError(error)) throw error;
    throw createProposalCodeError("proposal.saveFailed");
  }
}

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
