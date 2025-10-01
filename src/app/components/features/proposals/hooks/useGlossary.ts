// src/app/components/features/proposals/hooks/useGlossary.ts
"use client";

import { useCallback, useState } from "react";

import {
  createProposalCodeError,
  parseProposalErrorResponse,
  type ProposalActionResult,
} from "../lib/errors";

/** Tipo local que coincide con /api/glossary */
export type GlossaryLink = {
  id: string;
  label: string;
  url: string;
};

export function useGlossary() {
  const [glossary, setGlossary] = useState<GlossaryLink[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (): Promise<ProposalActionResult> => {
    setLoading(true);
    try {
      const r = await fetch("/api/glossary", { cache: "no-store" });
      if (!r.ok) {
        setGlossary([]);
        return { ok: false, error: await parseProposalErrorResponse(r, "glossary.loadFailed") };
      }
      const data = (await r.json()) as GlossaryLink[];
      setGlossary(data);
      return { ok: true };
    } catch {
      setGlossary([]);
      return { ok: false, error: createProposalCodeError("glossary.loadFailed") };
    } finally {
      setLoading(false);
    }
  }, []);

  async function addLink(label: string, url: string): Promise<ProposalActionResult> {
    try {
      const r = await fetch("/api/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url }),
      });
      if (!r.ok)
        return {
          ok: false,
          error: await parseProposalErrorResponse(r, "glossary.createFailed"),
        };
      const reload = await load();
      return reload.ok ? { ok: true } : { ok: false, error: reload.error };
    } catch {
      return { ok: false, error: createProposalCodeError("glossary.createFailed") };
    }
  }

  async function editLink(
    id: string,
    label: string,
    url: string
  ): Promise<ProposalActionResult> {
    try {
      const r = await fetch(`/api/glossary/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url }),
      });
      if (!r.ok)
        return {
          ok: false,
          error: await parseProposalErrorResponse(r, "glossary.updateFailed"),
        };
      const reload = await load();
      return reload.ok ? { ok: true } : { ok: false, error: reload.error };
    } catch {
      return { ok: false, error: createProposalCodeError("glossary.updateFailed") };
    }
  }

  async function removeLink(id: string): Promise<ProposalActionResult> {
    try {
      const r = await fetch(`/api/glossary/${id}`, { method: "DELETE" });
      if (!r.ok)
        return {
          ok: false,
          error: await parseProposalErrorResponse(r, "glossary.deleteFailed"),
        };
      const reload = await load();
      return reload.ok ? { ok: true } : { ok: false, error: reload.error };
    } catch {
      return { ok: false, error: createProposalCodeError("glossary.deleteFailed") };
    }
  }

  return { glossary, loading, load, addLink, editLink, removeLink };
}

export default useGlossary;
