// src/app/components/ui/ItemForm.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "@/app/components/ui/toast";

export type ItemFormData = {
  sku?: string;
  name: string;
  description: string;
  devHours: number;
  unitPrice: number;
  category?: string;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: ItemFormData;
  onClose: () => void;
  onSave: (data: ItemFormData) => void | Promise<void>;
  /** Lista de SKUs existentes para validar duplicados (case-insensitive) */
  existingSkus?: string[];
};

export default function ItemForm({
  open,
  mode,
  initial,
  onClose,
  onSave,
  existingSkus = [],
}: Props) {
  // -------- Form state
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [devHours, setDevHours] = useState<number>(initial?.devHours ?? 1);
  const [unitPrice, setUnitPrice] = useState<number>(initial?.unitPrice ?? 100);
  const [category, setCategory] = useState<string>(initial?.category ?? "general");

  useEffect(() => {
    if (!open) return;
    setSku(initial?.sku ?? "");
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setDevHours(initial?.devHours ?? 1);
    setUnitPrice(initial?.unitPrice ?? 100);
    setCategory(initial?.category ?? "general");
  }, [open, initial]);

  // -------- Categories
  const [categories, setCategories] = useState<string[]>([]);
  const [catsBusy, setCatsBusy] = useState(false);

  const loadCats = async () => {
    try {
      const r = await fetch("/api/items/categories", { cache: "no-store" });
      setCategories(r.ok ? ((await r.json()) as string[]) : []);
    } catch {
      setCategories([]);
      toast("No se pudieron cargar las categorías");
    }
  };

  useEffect(() => {
    if (open) loadCats();
  }, [open]);

  // Gestión
  const [showCatMgmt, setShowCatMgmt] = useState(false);

  const [newCat, setNewCat] = useState("");
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [delFrom, setDelFrom] = useState("");
  const [delTo, setDelTo] = useState("");

  const orderedCats = useMemo(
    () => Array.from(new Set(["general", ...categories])).sort((a, b) => a.localeCompare(b)),
    [categories]
  );

  const createCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    setCatsBusy(true);
    try {
      const r = await fetch("/api/items/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!r.ok) {
        toast("No se pudo crear la categoría");
        return;
      }
      setNewCat("");
      await loadCats();
      setCategory(name);
      toast("Categoría creada");
    } catch {
      toast("No se pudo crear la categoría");
    } finally {
      setCatsBusy(false);
    }
  };

  const renameCategory = async () => {
    const from = renameFrom;
    const to = renameTo.trim();
    if (!from || !to) return;
    setCatsBusy(true);
    try {
      const r = await fetch("/api/items/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      });
      if (!r.ok) {
        toast("No se pudo renombrar la categoría");
        return;
      }
      setRenameFrom("");
      setRenameTo("");
      await loadCats();
      if (category === from) setCategory(to);
      toast("Categoría renombrada");
    } catch {
      toast("No se pudo renombrar la categoría");
    } finally {
      setCatsBusy(false);
    }
  };

  const deleteOrMove = async () => {
    const name = delFrom;
    const replaceWith = delTo || null;
    if (!name) return;
    setCatsBusy(true);
    try {
      // ⚠️ Server-side espera { name, replaceWith? } (ver /api/items/categories/route.ts)
      const r = await fetch("/api/items/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, replaceWith }),
      });
      if (!r.ok) {
        toast("No se pudo eliminar/mover la categoría");
        return;
      }
      setDelFrom("");
      setDelTo("");
      await loadCats();
      if (category === name) setCategory(replaceWith ?? "general");
      toast("Categoría eliminada / ítems movidos");
    } catch {
      toast("No se pudo eliminar/mover la categoría");
    } finally {
      setCatsBusy(false);
    }
  };

  // -------- SKU duplicate validation
  const originalSku = (initial?.sku ?? "").trim().toLowerCase();
  const skuLower = (sku ?? "").trim().toLowerCase();
  const dupSku =
    skuLower !== "" &&
    skuLower !== originalSku &&
    existingSkus.map((s) => (s ?? "").toLowerCase()).includes(skuLower);

  // -------- Submit
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("El nombre es requerido");
      return;
    }
    if (dupSku) {
      toast("El SKU ya existe. Por favor, elige otro.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim(),
        devHours: Number(devHours) || 0,
        unitPrice: Number(unitPrice) || 0,
        category: category || "general",
      });
    } catch (err) {
      toast(
        `No se pudo guardar el ítem${
          err instanceof Error ? `: ${err.message}` : ""
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-md bg-white shadow-xl">
        {/* Header */}
        <div className="bg-primary text-white font-semibold px-4 py-3">
          {mode === "create" ? "Nuevo ítem" : "Editar ítem"}
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          {/* SKU / Categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                SKU <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                className={`input w-full ${dupSku ? "border-red-400 ring-1 ring-red-400" : ""}`}
                placeholder="ABC-123"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              {dupSku && (
                <p className="mt-1 text-[12px] text-red-600">
                  Ya existe un ítem con este SKU.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Categoría</label>
              <select
                className="select w-full"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {orderedCats.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="mt-1 text-xs text-primary underline"
                onClick={() => setShowCatMgmt((p) => !p)}
              >
                {showCatMgmt ? "Ocultar gestión de categorías" : "Mostrar gestión de categorías"}
              </button>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nombre</label>
            <input
              className="input w-full"
              placeholder="Nombre del ítem"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Descripción</label>
            <textarea
              className="input w-full min-h-[96px] resize-y"
              placeholder="Descripción corta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Horas / Precio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Horas de desarrollo</label>
              <input
                type="number"
                min={0}
                className="input w-full"
                value={devHours}
                onChange={(e) => setDevHours(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Precio unitario (USD)</label>
              <input
                type="number"
                min={0}
                className="input w-full"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Gestión de categorías (2 filas) */}
          {showCatMgmt && (
            <div className="mt-2 rounded-md border bg-gray-50 p-3">
              <div className="text-[12px] font-semibold mb-2">Gestión de categorías</div>

              {/* FILA 1: Crear / Renombrar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Crear */}
                <div className="rounded bg-white p-3 border">
                  <div className="text-xs text-gray-600 mb-2">Crear nueva</div>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      placeholder="Nombre de la categoría"
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={createCategory}
                      disabled={!newCat.trim() || catsBusy}
                    >
                      {catsBusy ? "…" : "Crear"}
                    </button>
                  </div>
                </div>

                {/* Renombrar */}
                <div className="rounded bg-white p-3 border">
                  <div className="text-xs text-gray-600 mb-2">Renombrar existente</div>
                  <div className="flex gap-2">
                    <select
                      className="select flex-1"
                      value={renameFrom}
                      onChange={(e) => setRenameFrom(e.target.value)}
                    >
                      <option value="">(elige)</option>
                      {orderedCats.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input flex-1"
                      placeholder="Nuevo nombre"
                      value={renameTo}
                      onChange={(e) => setRenameTo(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={renameCategory}
                      disabled={!renameFrom || !renameTo.trim() || catsBusy}
                    >
                      {catsBusy ? "…" : "Aplicar"}
                    </button>
                  </div>
                </div>
              </div>

              {/* FILA 2: Eliminar / mover */}
              <div className="grid grid-cols-1 gap-3 mt-3">
                <div className="rounded bg-white p-3 border">
                  <div className="text-xs text-gray-600 mb-2">Eliminar / mover a</div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="select"
                      value={delFrom}
                      onChange={(e) => setDelFrom(e.target.value)}
                    >
                      <option value="">(elige)</option>
                      {orderedCats.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <span className="self-center text-sm text-gray-500">→</span>
                    <select
                      className="select"
                      value={delTo}
                      onChange={(e) => setDelTo(e.target.value)}
                    >
                      <option value="">(sin mover)</option>
                      {orderedCats.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={deleteOrMove}
                      disabled={!delFrom || catsBusy}
                    >
                      {catsBusy ? "…" : "Eliminar / Mover"}
                    </button>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-2">
                    * Si elegís destino, se mueven los ítems y se elimina la categoría origen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={dupSku || saving}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
