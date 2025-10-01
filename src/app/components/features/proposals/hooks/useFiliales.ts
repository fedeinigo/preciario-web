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

export function useFiliales() {
  const [filiales, setFiliales] = useState<FilialGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (): Promise<ProposalActionResult> => {
    setLoading(true);
    try {
      const r = await fetch("/api/filiales", { cache: "no-store" });
      if (!r.ok) {
        setFiliales([]);
        return { ok: false, error: await parseProposalErrorResponse(r, "filiales.loadFailed") };
      }
      setFiliales((await r.json()) as FilialGroup[]);
      return { ok: true };
    } catch {
      setFiliales([]);
      return { ok: false, error: createProposalCodeError("filiales.loadFailed") };
    } finally {
      setLoading(false);
    }
  }, []);

  // ======= Grupos =======

  const addFilial = useCallback(
    async (title: string): Promise<ProposalActionResult> => {
      try {
        const r = await fetch(`/api/filiales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (!r.ok)
          return {
            ok: false,
            error: await parseProposalErrorResponse(r, "filiales.createGroupFailed"),
          };
        const reload = await load();
        return reload.ok
          ? { ok: true }
          : { ok: false, error: reload.error };
      } catch {
        return { ok: false, error: createProposalCodeError("filiales.createGroupFailed") };
      }
    },
    [load]
  );

  const editFilialTitle = useCallback(
    async (id: string, title: string): Promise<ProposalActionResult> => {
      try {
        const r = await fetch(`/api/filiales/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (!r.ok)
          return {
            ok: false,
            error: await parseProposalErrorResponse(r, "filiales.renameGroupFailed"),
          };
        const reload = await load();
        return reload.ok
          ? { ok: true }
          : { ok: false, error: reload.error };
      } catch {
        return { ok: false, error: createProposalCodeError("filiales.renameGroupFailed") };
      }
    },
    [load]
  );

  const removeFilial = useCallback(
    async (id: string): Promise<ProposalActionResult> => {
      try {
        const r = await fetch(`/api/filiales/${id}`, {
          method: "DELETE",
        });
        if (!r.ok)
          return {
            ok: false,
            error: await parseProposalErrorResponse(r, "filiales.deleteGroupFailed"),
          };
        const reload = await load();
        return reload.ok
          ? { ok: true }
          : { ok: false, error: reload.error };
      } catch {
        return { ok: false, error: createProposalCodeError("filiales.deleteGroupFailed") };
      }
    },
    [load]
  );

  // ======= Países por grupo =======

  const addCountry = useCallback(
    async (groupId: string, name: string): Promise<ProposalActionResult> => {
      try {
        const r = await fetch(`/api/filiales/${groupId}/countries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!r.ok)
          return {
            ok: false,
            error: await parseProposalErrorResponse(r, "filiales.createCountryFailed"),
          };
        const reload = await load();
        return reload.ok
          ? { ok: true }
          : { ok: false, error: reload.error };
      } catch {
        return { ok: false, error: createProposalCodeError("filiales.createCountryFailed") };
      }
    },
    [load]
  );

  const editCountry = useCallback(
    async (groupId: string, id: string, name: string): Promise<ProposalActionResult> => {
      try {
        const r = await fetch(`/api/filiales/${groupId}/countries`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, name }),
        });
        if (!r.ok)
          return {
            ok: false,
            error: await parseProposalErrorResponse(r, "filiales.renameCountryFailed"),
          };
        const reload = await load();
        return reload.ok
          ? { ok: true }
          : { ok: false, error: reload.error };
      } catch {
        return { ok: false, error: createProposalCodeError("filiales.renameCountryFailed") };
      }
    },
    [load]
  );

  const removeCountry = useCallback(
    async (groupId: string, id: string): Promise<ProposalActionResult> => {
      try {
        const r = await fetch(`/api/filiales/${groupId}/countries`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!r.ok)
          return {
            ok: false,
            error: await parseProposalErrorResponse(r, "filiales.deleteCountryFailed"),
          };
        const reload = await load();
        return reload.ok
          ? { ok: true }
          : { ok: false, error: reload.error };
      } catch {
        return { ok: false, error: createProposalCodeError("filiales.deleteCountryFailed") };
      }
    },
    [load]
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
