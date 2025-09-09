// src/app/components/features/proposals/lib/ids.ts
export async function getNextProposalId(): Promise<string> {
  try {
    const res = await fetch("/api/proposals/next-id", { cache: "no-store" });
    if (!res.ok) throw new Error("failed");
    const data = (await res.json()) as { id: string; seq: number };
    return data.id;
  } catch {
    // Fallback improbable (si API falla)
    const n = Date.now();
    return `PPT-${String(n).slice(-9)}`;
  }
}
