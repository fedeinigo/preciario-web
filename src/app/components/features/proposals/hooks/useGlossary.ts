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

  const addLink = () => {
    const label = prompt("Título del enlace");
    if (!label) return;
    const url = prompt("URL (https://...)");
    if (!url) return;
    const list = [{ id: `L-${Date.now()}`, label: label.trim(), url: url.trim() }, ...glossary];
    setGlossary(list);
    saveGlossary(list);
  };

  const editLink = (id: string) => {
    const cur = glossary.find((g) => g.id === id);
    if (!cur) return;
    const label = prompt("Editar título", cur.label) ?? cur.label;
    const url = prompt("Editar URL", cur.url) ?? cur.url;
    const list = glossary.map((g) =>
      g.id === id ? { ...g, label: label.trim(), url: url.trim() } : g
    );
    setGlossary(list);
    saveGlossary(list);
  };

  const removeLink = (id: string) => {
    const list = glossary.filter((g) => g.id !== id);
    setGlossary(list);
    saveGlossary(list);
  };

  return { glossary, addLink, editLink, removeLink };
}
