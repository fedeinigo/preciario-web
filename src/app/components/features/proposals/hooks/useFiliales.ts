import { useEffect, useState } from "react";
import {
  readFiliales,
  saveFiliales,
  type FilialGroup,
} from "../lib/storage";

export function useFiliales() {
  const [filiales, setFiliales] = useState<FilialGroup[]>([]);

  useEffect(() => {
    setFiliales(readFiliales());
  }, []);

  const addFilial = () => {
    const title = prompt("Nombre de la filial");
    if (!title) return;
    const n: FilialGroup = { id: `F-${Date.now()}`, title: title.trim(), countries: [] };
    const list = [n, ...filiales];
    setFiliales(list);
    saveFiliales(list);
  };

  const editFilialTitle = (id: string) => {
    const cur = filiales.find((f) => f.id === id);
    if (!cur) return;
    const title = prompt("Editar nombre de la filial", cur.title);
    if (!title) return;
    const list = filiales.map((f) => (f.id === id ? { ...f, title: title.trim() } : f));
    setFiliales(list);
    saveFiliales(list);
  };

  const removeFilial = (id: string) => {
    const list = filiales.filter((f) => f.id !== id);
    setFiliales(list);
    saveFiliales(list);
  };

  const addCountry = (id: string) => {
    const name = prompt("Agregar país");
    if (!name) return;
    const list = filiales.map((f) =>
      f.id === id ? { ...f, countries: [...f.countries, name.trim()] } : f
    );
    setFiliales(list);
    saveFiliales(list);
  };

  const editCountry = (id: string, idx: number) => {
    const f = filiales.find((x) => x.id === id);
    if (!f) return;
    const name = prompt("Editar país", f.countries[idx]);
    if (!name) return;
    const list = filiales.map((g) =>
      g.id === id
        ? { ...g, countries: g.countries.map((c, i) => (i === idx ? name.trim() : c)) }
        : g
    );
    setFiliales(list);
    saveFiliales(list);
  };

  const removeCountry = (id: string, idx: number) => {
    const list = filiales.map((g) =>
      g.id === id ? { ...g, countries: g.countries.filter((_, i) => i !== idx) } : g
    );
    setFiliales(list);
    saveFiliales(list);
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
