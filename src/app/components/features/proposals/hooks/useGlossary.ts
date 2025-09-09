// src/app/components/features/proposals/hooks/useGlossary.ts
"use client";

import { useCallback, useEffect, useState } from "react";

/** Tipo local que coincide con /api/glossary */
export type GlossaryLink = {
  id: string;
  label: string;
  url: string;
};

export function useGlossary() {
  const [glossary, setGlossary] = useState<GlossaryLink[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/glossary", { cache: "no-store" });
      if (!r.ok) throw new Error("No se pudo cargar glosario");
      const data = (await r.json()) as GlossaryLink[];
      setGlossary(data);
    } catch {
      setGlossary([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addLink(label: string, url: string) {
    const r = await fetch("/api/glossary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, url }),
    });
    if (!r.ok) throw new Error(await r.text());
    await load();
  }

  async function editLink(id: string, label: string, url: string) {
    const r = await fetch(`/api/glossary/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, url }),
    });
    if (!r.ok) throw new Error(await r.text());
    await load();
  }

  async function removeLink(id: string) {
    const r = await fetch(`/api/glossary/${id}`, { method: "DELETE" });
    if (!r.ok) throw new Error(await r.text());
    await load();
  }

  return { glossary, loading, reload: load, addLink, editLink, removeLink };
}

export default useGlossary;
