import type { SaveProposalInput, ProposalRecord } from "./types";

/** Persiste la propuesta en la DB vía API */
export async function saveProposal(input: SaveProposalInput): Promise<ProposalRecord> {
  const res = await fetch("/api/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "No se pudo guardar la propuesta");
  }
  const data = (await res.json()) as ProposalRecord;
  return data;
}
