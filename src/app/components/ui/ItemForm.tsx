// src/app/components/ui/ItemForm.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/app/components/ui/toast";

import { useTranslations } from "@/app/LanguageProvider";

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
  const formT = useTranslations("proposals.itemForm");
  const fieldsT = useTranslations("proposals.itemForm.fields");
  const toastT = useTranslations("proposals.itemForm.toast");
  const managementT = useTranslations("proposals.itemForm.management");
  const actionsT = useTranslations("proposals.itemForm.actions");
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

  const loadCats = useCallback(async () => {
    try {
      const r = await fetch("/api/items/categories", { cache: "no-store" });
      setCategories(r.ok ? ((await r.json()) as string[]) : []);
    } catch {
      setCategories([]);
      toast(toastT("loadCategoriesError"));
    }
  }, [toastT]);

  useEffect(() => {
    if (open) void loadCats();
  }, [loadCats, open]);

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
        toast(toastT("createCategoryError"));
        return;
      }
      setNewCat("");
      await loadCats();
      setCategory(name);
      toast(toastT("createCategorySuccess"));
    } catch {
      toast(toastT("createCategoryError"));
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
        toast(toastT("renameCategoryError"));
        return;
      }
      setRenameFrom("");
      setRenameTo("");
      await loadCats();
      if (category === from) setCategory(to);
      toast(toastT("renameCategorySuccess"));
    } catch {
      toast(toastT("renameCategoryError"));
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
        toast(toastT("deleteCategoryError"));
        return;
      }
      setDelFrom("");
      setDelTo("");
      await loadCats();
      if (category === name) setCategory(replaceWith ?? "general");
      toast(toastT("deleteCategorySuccess"));
    } catch {
      toast(toastT("deleteCategoryError"));
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
      toast(toastT("nameRequired"));
      return;
    }
    if (dupSku) {
      toast(toastT("skuDuplicate"));
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
      const message = err instanceof Error ? err.message : toastT("unknown");
      toast(toastT("saveError", { message }));
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
          {mode === "create" ? formT("title.create") : formT("title.edit")}
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          {/* SKU / Categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                {fieldsT("sku.label")} <span className="text-gray-400">{fieldsT("sku.optional")}</span>
              </label>
              <input
                className={`input w-full ${dupSku ? "border-red-400 ring-1 ring-red-400" : ""}`}
                placeholder={fieldsT("sku.placeholder")}
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              {dupSku && (
                <p className="mt-1 text-[12px] text-red-600">
                  {fieldsT("sku.duplicate")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">{fieldsT("category.label")}</label>
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
                {showCatMgmt
                  ? fieldsT("category.hideManagement")
                  : fieldsT("category.showManagement")}
              </button>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">{fieldsT("name.label")}</label>
            <input
              className="input w-full"
              placeholder={fieldsT("name.placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">{fieldsT("description.label")}</label>
            <textarea
              className="input w-full min-h-[96px] resize-y"
              placeholder={fieldsT("description.placeholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Horas / Precio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">{fieldsT("devHours.label")}</label>
              <input
                type="number"
                min={0}
                className="input w-full"
                value={devHours}
                onChange={(e) => setDevHours(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">{fieldsT("unitPrice.label")}</label>
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
              <div className="text-[12px] font-semibold mb-2">{managementT("title")}</div>

              {/* FILA 1: Crear / Renombrar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Crear */}
                <div className="rounded bg-white p-3 border">
                  <div className="text-xs text-gray-600 mb-2">{managementT("create.title")}</div>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      placeholder={managementT("create.placeholder")}
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={createCategory}
                      disabled={!newCat.trim() || catsBusy}
                    >
                      {catsBusy ? "…" : managementT("create.action")}
                    </button>
                  </div>
                </div>

                {/* Renombrar */}
                <div className="rounded bg-white p-3 border">
                  <div className="text-xs text-gray-600 mb-2">{managementT("rename.title")}</div>
                  <div className="flex gap-2">
                    <select
                      className="select flex-1"
                      value={renameFrom}
                      onChange={(e) => setRenameFrom(e.target.value)}
                    >
                      <option value="">{managementT("selectPlaceholder")}</option>
                      {orderedCats.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input flex-1"
                      placeholder={managementT("rename.placeholder")}
                      value={renameTo}
                      onChange={(e) => setRenameTo(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={renameCategory}
                      disabled={!renameFrom || !renameTo.trim() || catsBusy}
                    >
                      {catsBusy ? "…" : managementT("rename.action")}
                    </button>
                  </div>
                </div>
              </div>

              {/* FILA 2: Eliminar / mover */}
              <div className="grid grid-cols-1 gap-3 mt-3">
                <div className="rounded bg-white p-3 border">
                  <div className="text-xs text-gray-600 mb-2">{managementT("delete.title")}</div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="select"
                      value={delFrom}
                      onChange={(e) => setDelFrom(e.target.value)}
                    >
                      <option value="">{managementT("selectPlaceholder")}</option>
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
                      <option value="">{managementT("delete.keepPlaceholder")}</option>
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
                      {catsBusy ? "…" : managementT("delete.action")}
                    </button>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-2">{managementT("delete.note")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
              {actionsT("cancel")}
            </button>
            <button type="submit" className="btn-primary" disabled={dupSku || saving}>
              {saving ? actionsT("saving") : actionsT("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
