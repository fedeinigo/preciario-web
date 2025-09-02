// src/app/components/features/proposals/hooks/useGlossary.ts
"use client";

import { useEffect, useState } from "react";
import {
  readGlossary,
  saveGlossary,
  type GlossaryLink,
} from "../lib/storage";

export function useGlossary() {
  const [glossary, setGlossary] = useState<GlossaryLink[]>([]);

  useEffect(() => {
    setGlossary(readGlossary());
  }, []);

  const persist = (list: GlossaryLink[]) => {
    setGlossary(list);
    saveGlossary(list);
  };

  const addLink = (label: string, url: string) => {
    const n: GlossaryLink = { id: `L-${Date.now()}`, label, url };
    persist([n, ...glossary]);
  };

  const editLink = (id: string, label: string, url: string) => {
    persist(glossary.map((g) => (g.id === id ? { ...g, label, url } : g)));
  };

  const removeLink = (id: string) => {
    persist(glossary.filter((g) => g.id !== id));
  };

  return { glossary, addLink, editLink, removeLink };
}
