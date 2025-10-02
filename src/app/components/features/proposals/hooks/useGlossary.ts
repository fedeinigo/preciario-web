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

const glossaryCache: { data: GlossaryLink[] | null } = { data: null };

function cloneGlossary(data: GlossaryLink[]): GlossaryLink[] {
  return structuredClone(data);
}

function invalidateGlossaryCache() {
  glossaryCache.data = null;
}

export function useGlossary() {
  const [glossary, setGlossary] = useState<GlossaryLink[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (options?: { force?: boolean }): Promise<ProposalActionResult> => {
      if (!options?.force && glossaryCache.data) {
        setGlossary(cloneGlossary(glossaryCache.data));
        return { ok: true };
      }

      setLoading(true);
      try {
        const response = await fetch("/api/glossary", { cache: "no-store" });
        if (!response.ok) {
          setGlossary([]);
          return {
            ok: false,
            error: await parseProposalErrorResponse(response, "glossary.loadFailed", {
              unauthorizedCode: "glossary.unauthorized",
            }),
          };
        }
        const data = (await response.json()) as GlossaryLink[];
        glossaryCache.data = cloneGlossary(data);
        setGlossary(cloneGlossary(data));
        return { ok: true };
      } catch {
        setGlossary([]);
        return { ok: false, error: createProposalCodeError("glossary.loadFailed") };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reload = useCallback(async () => {
    invalidateGlossaryCache();
    return load({ force: true });
  }, [load]);

  async function addLink(label: string, url: string): Promise<ProposalActionResult> {
    try {
      const response = await fetch("/api/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url }),
      });
      if (!response.ok) {
        return {
          ok: false,
          error: await parseProposalErrorResponse(response, "glossary.createFailed", {
            unauthorizedCode: "glossary.unauthorized",
          }),
        };
      }
      return reload();
    } catch {
      return { ok: false, error: createProposalCodeError("glossary.createFailed") };
    }
  }

  async function editLink(id: string, label: string, url: string): Promise<ProposalActionResult> {
    try {
      const response = await fetch(`/api/glossary/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url }),
      });
      if (!response.ok) {
        return {
          ok: false,
          error: await parseProposalErrorResponse(response, "glossary.updateFailed", {
            unauthorizedCode: "glossary.unauthorized",
          }),
        };
      }
      return reload();
    } catch {
      return { ok: false, error: createProposalCodeError("glossary.updateFailed") };
    }
  }

  async function removeLink(id: string): Promise<ProposalActionResult> {
    try {
      const response = await fetch(`/api/glossary/${id}`, { method: "DELETE" });
      if (!response.ok) {
        return {
          ok: false,
          error: await parseProposalErrorResponse(response, "glossary.deleteFailed", {
            unauthorizedCode: "glossary.unauthorized",
          }),
        };
      }
      return reload();
    } catch {
      return { ok: false, error: createProposalCodeError("glossary.deleteFailed") };
    }
  }

  return { glossary, loading, load, addLink, editLink, removeLink };
}

export default useGlossary;
