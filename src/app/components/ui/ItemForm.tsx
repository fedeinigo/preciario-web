// src/app/components/ui/ItemForm.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/app/components/ui/toast";

import { useLanguage, useTranslations } from "@/app/LanguageProvider";
import {
  createItemCategory,
  deleteItemCategory,
  fetchItemCategories,
  renameItemCategory,
} from "@/app/components/features/proposals/lib/categories";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";
import {
  isProposalError,
  type ProposalErrorCode,
} from "@/app/components/features/proposals/lib/errors";

export type ItemFormTranslation = {
  name: string;
  description: string;
  category: string;
};

export type ItemFormData = {
  sku?: string;
  devHours: number;
  unitPrice: number;
  translations: Record<Locale, ItemFormTranslation>;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: ItemFormData;
  onClose: () => void;
  onSave: (data: ItemFormData) => void | Promise<void>;
  existingSkus?: string[];
};

function createEmptyTranslations(): Record<Locale, ItemFormTranslation> {
  return Object.fromEntries(
    locales.map((code) => [code, { name: "", description: "", category: "" }])
  ) as Record<Locale, ItemFormTranslation>;
}

function hydrateTranslations(initial?: Record<Locale, ItemFormTranslation>) {
  const base = createEmptyTranslations();
  if (!initial) return base;
  for (const locale of locales) {
    if (initial[locale]) {
      base[locale] = { ...initial[locale] };
    }
  }
  return base;
}

function sanitizeTranslations(
  source: Record<Locale, ItemFormTranslation>
): Record<Locale, ItemFormTranslation> {
  const sanitized = createEmptyTranslations();
  const base = source[defaultLocale];
  const baseCategory = base?.category?.trim() || "general";
  const baseName = base?.name?.trim() ?? "";
  const baseDescription = base?.description?.trim() ?? "";

  for (const locale of locales) {
    const current = source[locale] ?? { name: "", description: "", category: "" };
    sanitized[locale] = {
      name: (current.name ?? "").trim() || (locale === defaultLocale ? baseName : baseName),
      category: (current.category ?? "").trim() || baseCategory,
      description: (current.description ?? "").trim() || baseDescription,
    };
  }

  if (!sanitized[defaultLocale].name) {
    sanitized[defaultLocale].name = baseName;
  }
  if (!sanitized[defaultLocale].category) {
    sanitized[defaultLocale].category = baseCategory;
  }

  return sanitized;
}

export default function ItemForm({
  open,
  mode,
  initial,
  onClose,
  onSave,
  existingSkus = [],
}: Props) {
  const { locale: currentLocale } = useLanguage();
  const formT = useTranslations("proposals.itemForm");
  const fieldsT = useTranslations("proposals.itemForm.fields");
  const toastT = useTranslations("proposals.itemForm.toast");
  const managementT = useTranslations("proposals.itemForm.management");
  const actionsT = useTranslations("proposals.itemForm.actions");
  const proposalErrorsT = useTranslations("proposals.errors");
  const languageT = useTranslations("common.language");

  const [sku, setSku] = useState(initial?.sku ?? "");
  const [devHours, setDevHours] = useState<number>(initial?.devHours ?? 1);
  const [unitPrice, setUnitPrice] = useState<number>(initial?.unitPrice ?? 100);
  const [translations, setTranslations] = useState<Record<Locale, ItemFormTranslation>>(
    () => hydrateTranslations(initial?.translations)
  );
  const [activeLocale, setActiveLocale] = useState<Locale>(currentLocale);

  const [categories, setCategories] = useState<string[]>([]);
  const [catsBusy, setCatsBusy] = useState(false);
  const [showCatMgmt, setShowCatMgmt] = useState(false);

  const [newCat, setNewCat] = useState("");
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [delFrom, setDelFrom] = useState("");
  const [delTo, setDelTo] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSku(initial?.sku ?? "");
    setDevHours(initial?.devHours ?? 1);
    setUnitPrice(initial?.unitPrice ?? 100);
    setTranslations(hydrateTranslations(initial?.translations));
    setActiveLocale(currentLocale);
  }, [open, initial, currentLocale]);

  const resolveProposalErrorMessage = useCallback(
    (error: unknown, fallback: ProposalErrorCode) => {
      if (isProposalError(error)) {
        return error.kind === "message"
          ? error.message
          : proposalErrorsT(error.code);
      }
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return proposalErrorsT(fallback);
    },
    [proposalErrorsT]
  );

  const loadCats = useCallback(async () => {
    try {
      const data = await fetchItemCategories(currentLocale);
      setCategories(data);
    } catch (error) {
      setCategories([]);
      const message = resolveProposalErrorMessage(
        error,
        "catalog.categories.loadFailed"
      );
      toast.error(message);
    }
  }, [currentLocale, resolveProposalErrorMessage]);

  useEffect(() => {
    if (open) void loadCats();
  }, [loadCats, open]);

  const updateTranslation = useCallback(
    (locale: Locale, field: keyof ItemFormTranslation, value: string) => {
      setTranslations((prev) => ({
        ...prev,
        [locale]: {
          ...prev[locale],
          [field]: value,
        },
      }));
    },
    []
  );

  const currentTranslation = translations[activeLocale] ?? {
    name: "",
    description: "",
    category: "",
  };

  const originalSku = (initial?.sku ?? "").trim().toLowerCase();
  const skuLower = sku.trim().toLowerCase();
  const dupSku =
    skuLower !== "" &&
    skuLower !== originalSku &&
    existingSkus.map((s) => (s ?? "").toLowerCase()).includes(skuLower);

  const orderedCats = useMemo(
    () => Array.from(new Set(["general", ...categories])).sort((a, b) => a.localeCompare(b)),
    [categories]
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (dupSku) {
      toast(toastT("skuDuplicate"));
      return;
    }

    setSaving(true);
    try {
      const normalized = sanitizeTranslations(translations);
      await onSave({
        sku: sku.trim(),
        devHours: Number(devHours) || 0,
        unitPrice: Number(unitPrice) || 0,
        translations: normalized,
      });
      onClose();
    } catch (error) {
      const fallback: ProposalErrorCode =
        mode === "create" ? "catalog.createFailed" : "catalog.updateFailed";
      const message = resolveProposalErrorMessage(error, fallback);
      toast.error(toastT("saveError", { message }));
      return;
    } finally {
      setSaving(false);
    }
  };

  const createCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    setCatsBusy(true);
    try {
      await createItemCategory(name);
      setNewCat("");
      await loadCats();
      toast.success(toastT("createCategorySuccess"));
    } catch (error) {
      const message = resolveProposalErrorMessage(
        error,
        "catalog.categories.createFailed"
      );
      toast.error(message);
    } finally {
      setCatsBusy(false);
    }
  };

  const renameCategoryAction = async () => {
    const from = renameFrom.trim();
    const to = renameTo.trim();
    if (!from || !to || from === to) return;
    setCatsBusy(true);
    try {
      await renameItemCategory(from, to);
      setRenameFrom("");
      setRenameTo("");
      await loadCats();
      toast.success(toastT("renameCategorySuccess"));
    } catch (error) {
      const message = resolveProposalErrorMessage(
        error,
        "catalog.categories.renameFailed"
      );
      toast.error(message);
    } finally {
      setCatsBusy(false);
    }
  };

  const deleteOrMoveCategory = async () => {
    const from = delFrom.trim();
    if (!from) return;
    setCatsBusy(true);
    try {
      await deleteItemCategory(from, delTo.trim() || null);
      setDelFrom("");
      setDelTo("");
      await loadCats();
      toast.success(toastT("deleteCategorySuccess"));
    } catch (error) {
      const message = resolveProposalErrorMessage(
        error,
        "catalog.categories.deleteFailed"
      );
      toast.error(message);
    } finally {
      setCatsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "create" ? formT("title.create") : formT("title.edit")}
          </h2>
          <button type="button" className="btn-ghost" onClick={onClose}>
            {actionsT("cancel")}
          </button>
        </div>

        <div className="px-6 py-5">
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">{fieldsT("sku.label")} {fieldsT("sku.optional")}</label>
                <input
                  className={`input w-full ${dupSku ? "border-red-400 ring-1 ring-red-400" : ""}`}
                  placeholder={fieldsT("sku.placeholder")}
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
                {dupSku && (
                  <p className="mt-1 text-[12px] text-red-600">{fieldsT("sku.duplicate")}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">{fieldsT("devHours.label")}</label>
                <input
                  className="input w-full"
                  type="number"
                  min={0}
                  value={devHours}
                  onChange={(e) => setDevHours(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">{fieldsT("unitPrice.label")}</label>
                <input
                  className="input w-full"
                  type="number"
                  min={0}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="rounded-md border border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-semibold uppercase text-gray-600">
                  {languageT("label")}
                </span>
                {locales.map((locale) => (
                  <button
                    key={locale}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      locale === activeLocale
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setActiveLocale(locale)}
                  >
                    {locale.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    {fieldsT("name.label")} ({activeLocale.toUpperCase()})
                  </label>
                  <input
                    className="input w-full"
                    placeholder={fieldsT("name.placeholder")}
                    value={currentTranslation.name}
                    onChange={(e) =>
                      updateTranslation(activeLocale, "name", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    {fieldsT("category.label")} ({activeLocale.toUpperCase()})
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      list="item-form-categories"
                      value={currentTranslation.category}
                      onChange={(e) =>
                        updateTranslation(activeLocale, "category", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => setShowCatMgmt((prev) => !prev)}
                    >
                      {showCatMgmt
                        ? fieldsT("category.hideManagement")
                        : fieldsT("category.showManagement")}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    {fieldsT("description.label")} ({activeLocale.toUpperCase()})
                  </label>
                  <textarea
                    className="textarea w-full"
                    rows={3}
                    placeholder={fieldsT("description.placeholder")}
                    value={currentTranslation.description}
                    onChange={(e) =>
                      updateTranslation(activeLocale, "description", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {showCatMgmt && (
              <div className="mt-2 rounded-md border bg-gray-50 p-3 space-y-3">
                <div className="text-[12px] font-semibold text-gray-700">
                  {managementT("title")}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded bg-white p-3 border">
                    <div className="text-xs text-gray-600 mb-2">
                      {managementT("create.title")}
                    </div>
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
                        {catsBusy ? "..." : managementT("create.action")}
                      </button>
                    </div>
                  </div>

                  <div className="rounded bg-white p-3 border">
                    <div className="text-xs text-gray-600 mb-2">
                      {managementT("rename.title")}
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="select flex-1"
                        value={renameFrom}
                        onChange={(e) => setRenameFrom(e.target.value)}
                      >
                        <option value="">{managementT("selectPlaceholder")}</option>
                        {orderedCats.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
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
                        onClick={renameCategoryAction}
                        disabled={!renameFrom || !renameTo.trim() || catsBusy}
                      >
                        {catsBusy ? "..." : managementT("rename.action")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded bg-white p-3 border">
                  <div className="text-xs text-gray-600 mb-2">
                    {managementT("delete.title")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="select"
                      value={delFrom}
                      onChange={(e) => setDelFrom(e.target.value)}
                    >
                      <option value="">{managementT("selectPlaceholder")}</option>
                      {orderedCats.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <span className="self-center text-sm text-gray-500">?</span>
                    <select
                      className="select"
                      value={delTo}
                      onChange={(e) => setDelTo(e.target.value)}
                    >
                      <option value="">{managementT("delete.keepPlaceholder")}</option>
                      {orderedCats.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={deleteOrMoveCategory}
                      disabled={!delFrom || catsBusy}
                    >
                      {catsBusy ? "..." : managementT("delete.action")}
                    </button>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-2">
                    {managementT("delete.note")}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
                {actionsT("cancel")}
              </button>
              <button type="submit" className="btn-primary" disabled={dupSku || saving}>
                {saving ? actionsT("saving") : actionsT("save")}
              </button>
            </div>
          </form>
        </div>

        <datalist id="item-form-categories">
          {orderedCats.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </div>
    </div>
  );
}






