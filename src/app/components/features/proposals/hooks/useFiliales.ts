// src/app/components/features/proposals/hooks/useFiliales.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FilialGroup } from "@/lib/types";

export function useFiliales() {
  const [filiales, setFiliales] = useState<FilialGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/filiales", { cache: "no-store" });
      if (!r.ok) throw new Error("No se pudo cargar filiales");
      const data = (await r.json()) as FilialGroup[];
      setFiliales(data);
    } catch {
      setFiliales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ======= Mutaciones (sólo superadmin autorizado por el backend) =======
  async function addFilial(title: string) {
    const r = await fetch("/api/filiales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!r.ok) throw new Error(await r.text());
    await load();
  }

  async function editFilialTitle(id: string, title: string) {
    const r = await fetch(`/api/filiales/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!r.ok) throw new Error(await r.text());
    await load();
  }

  async function removeFilial(id: string) {
    const r = await fetch(`/api/filiales/${id}`, { method: "DELETE" });
    if (!r.ok) throw new Error(await r.text());
    await load();
  }

  async function addCountry(groupId: string, name: string) {
    const r = await fetch(`/api/filiales/${groupId}/countries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) throw new Error(await r.text());
    await load();
  }

  async function editCountry(groupId: string, oldName: string, newName: string) {
    const r = await fetch(`/api/filiales/${groupId}/countries`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName, newName }),
    });
    if (!r.ok) throw new Error(await r.text());
    await load();
  }

  async function removeCountry(groupId: string, name: string) {
    const r = await fetch(`/api/filiales/${groupId}/countries`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) throw new Error(await r.text());
    await load();
  }

  return {
    filiales,
    loading,
    reload: load,
    addFilial,
    editFilialTitle,
    removeFilial,
    addCountry,
    editCountry,
    removeCountry,
  };
}
