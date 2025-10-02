// src/app/components/features/proposals/hooks/useFiliales.ts
"use client";

import { useCallback, useState } from "react";

import {
  createProposalCodeError,
  parseProposalErrorResponse,
  type ProposalActionResult,
} from "../lib/errors";

/** Tipos locales (coinciden con la API /api/filiales) */
export type FilialCountry = {
  id: string;
  name: string;
  groupId: string;
};

export type FilialGroup = {
  id: string;
  title: string;
  countries: FilialCountry[];
};

const filialesCache: { data: FilialGroup[] | null } = { data: null };

function cloneFiliales(data: FilialGroup[]): FilialGroup[] {
  return structuredClone(data);
}

function invalidateFilialesCache() {
  filialesCache.data = null;
}

export function useFiliales() {
  const [filiales, setFiliales] = useState<FilialGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (options?: { force?: boolean }): Promise<ProposalActionResult> => {
      if (!options?.force && filialesCache.data) {
        setFiliales(cloneFiliales(filialesCache.data));
        return { ok: true };
      }

      setLoading(true);
      try {
        const response = await fetch("/api/filiales", { cache: "no-store" });
        if (!response.ok) {
          setFiliales([]);
          return {
            ok: false,
            error: await parseProposalErrorResponse(response, "filiales.loadFailed"),
          };
        }
        const data = (await response.json()) as FilialGroup[];
        filialesCache.data = cloneFiliales(data);
        setFiliales(cloneFiliales(data));
        return { ok: true };
      } catch {
        setFiliales([]);
        return { ok: false, error: createProposalCodeError("filiales.loadFailed") };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reload = useCallback(async () => {
    invalidateFilialesCache();
    return load({ force: true });
  }, [load]);

  const addFilial = useCallback(
    async (title: string): Promise<ProposalActionResult> => {
      try {
        const response = await fetch(`/api/filiales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (!response.ok) {
          return {
            ok: false,
            error: await parseProposalErrorResponse(response, "filiales.createGroupFailed"),
          };
        }
        return reload();
      } catch {
        return { ok: false, error: createProposalCodeError("filiales.createGroupFailed") };
      }
    },
    [reload]
  );

  const editFilialTitle = useCallback(
    async (id: string, title: string): Promise<ProposalActionResult> => {
      try {
        const response = await fetch(`/api/filiales/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (!response.ok) {
          return {
            ok: false,
            error: await parseProposalErrorResponse(response, "filiales.renameGroupFailed"),
          };
        }
        return reload();
      } catch {
        return { ok: false, error: createProposalCodeError("filiales.renameGroupFailed") };
      }
    },
    [reload]
  );

  const removeFilial = useCallback(
    async (id: string): Promise<ProposalActionResult> => {
      try {
        const response = await fetch(`/api/filiales/${id}`, { method: "DELETE" });
        if (!response.ok) {
          return {
            ok: false,
            error: await parseProposalErrorResponse(response, "filiales.deleteGroupFailed"),
          };
        }
        return reload();
      } catch {
        return { ok: false, error: createProposalCodeError("filiales.deleteGroupFailed") };
      }
    },
    [reload]
  );

  const addCountry = useCallback(
    async (groupId: string, name: string): Promise<ProposalActionResult> => {
      try {
        const response = await fetch(`/api/filiales/${groupId}/countries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!response.ok) {
          return {
            ok: false,
            error: await parseProposalErrorResponse(response, "filiales.createCountryFailed"),
          };
        }
        return reload();
      } catch {
        return { ok: false, error: createProposalCodeError("filiales.createCountryFailed") };
      }
    },
    [reload]
  );

  const editCountry = useCallback(
    async (groupId: string, id: string, name: string): Promise<ProposalActionResult> => {
      try {
        const response = await fetch(`/api/filiales/${groupId}/countries`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, name }),
        });
        if (!response.ok) {
          return {
            ok: false,
            error: await parseProposalErrorResponse(response, "filiales.renameCountryFailed"),
          };
        }
        return reload();
      } catch {
        return { ok: false, error: createProposalCodeError("filiales.renameCountryFailed") };
      }
    },
    [reload]
  );

  const removeCountry = useCallback(
    async (groupId: string, id: string): Promise<ProposalActionResult> => {
      try {
        const response = await fetch(`/api/filiales/${groupId}/countries`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!response.ok) {
          return {
            ok: false,
            error: await parseProposalErrorResponse(response, "filiales.deleteCountryFailed"),
          };
        }
        return reload();
      } catch {
        return { ok: false, error: createProposalCodeError("filiales.deleteCountryFailed") };
      }
    },
    [reload]
  );

  return {
    filiales,
    loading,
    load,
    addFilial,
    editFilialTitle,
    removeFilial,
    addCountry,
    editCountry,
    removeCountry,
  };
}

export default useFiliales;
