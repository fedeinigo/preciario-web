// src/app/components/features/proposals/hooks/useFiliales.ts
"use client";

import { useEffect, useState } from "react";
import { readFiliales, saveFiliales, type FilialGroup } from "../lib/storage";

export function useFiliales() {
  const [filiales, setFiliales] = useState<FilialGroup[]>([]);

  useEffect(() => {
    setFiliales(readFiliales());
  }, []);

  const persist = (list: FilialGroup[]) => {
    setFiliales(list);
    saveFiliales(list);
  };

  /** Crear SIN window.prompt; el título llega del componente (modal) */
  const addFilial = (title: string) => {
    const t = title.trim();
    if (!t) return;
    const n: FilialGroup = { id: `F-${Date.now()}`, title: t, countries: [] };
    persist([n, ...filiales]);
  };

  const editFilialTitle = (id: string, newTitle: string) => {
    persist(filiales.map((f) => (f.id === id ? { ...f, title: newTitle } : f)));
  };

  const removeFilial = (id: string) => {
    persist(filiales.filter((f) => f.id !== id));
  };

  const addCountry = (filialId: string, name: string) => {
    persist(
      filiales.map((f) =>
        f.id === filialId ? { ...f, countries: [...f.countries, name] } : f
      )
    );
  };

  const editCountry = (filialId: string, idx: number, name: string) => {
    persist(
      filiales.map((f) =>
        f.id === filialId
          ? {
              ...f,
              countries: f.countries.map((c, i) => (i === idx ? name : c)),
            }
          : f
      )
    );
  };

  const removeCountry = (filialId: string, idx: number) => {
    persist(
      filiales.map((f) =>
        f.id === filialId
          ? { ...f, countries: f.countries.filter((_, i) => i !== idx) }
          : f
      )
    );
  };

  return {
    filiales,
    addFilial,
    editFilialTitle,
    removeFilial,
    addCountry,
    editCountry,
    removeCountry,
  };
}
