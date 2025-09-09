// src/app/components/features/proposals/hooks/useFiliales.ts
"use client";

import { useCallback, useEffect, useState } from "react";

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/filiales", { cache: "no-store" });
      setFiliales(r.ok ? ((await r.json()) as FilialGroup[]) : []);
    } catch {
      setFiliales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ======= Grupos =======

  const addFilial = useCallback(
    async (title: string) => {
      const r = await fetch(`/api/filiales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (r.ok) await load();
      else alert("No se pudo crear la filial.");
    },
    [load]
  );

  const editFilialTitle = useCallback(
    async (id: string, title: string) => {
      const r = await fetch(`/api/filiales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (r.ok) await load();
      else alert("No se pudo renombrar la filial.");
    },
    [load]
  );

  const removeFilial = useCallback(
    async (id: string) => {
      const r = await fetch(`/api/filiales/${id}`, {
        method: "DELETE",
      });
      if (r.ok) await load();
      else alert("No se pudo eliminar la filial.");
    },
    [load]
  );

  // ======= Países por grupo =======

  const addCountry = useCallback(
    async (groupId: string, name: string) => {
      const r = await fetch(`/api/filiales/${groupId}/countries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (r.ok) await load();
      else alert("No se pudo agregar el país.");
    },
    [load]
  );

  const editCountry = useCallback(
    async (groupId: string, id: string, name: string) => {
      const r = await fetch(`/api/filiales/${groupId}/countries`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      if (r.ok) await load();
      else alert("No se pudo renombrar el país.");
    },
    [load]
  );

  const removeCountry = useCallback(
    async (groupId: string, id: string) => {
      const r = await fetch(`/api/filiales/${groupId}/countries`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (r.ok) await load();
      else alert("No se pudo eliminar el país.");
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
