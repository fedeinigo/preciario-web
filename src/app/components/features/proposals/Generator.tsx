// src/app/components/features/proposals/Generator.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import Combobox from "@/app/components/ui/Combobox";
import ItemForm, { type ItemFormData } from "@/app/components/ui/ItemForm";
import { Plus } from "lucide-react";

import { useTranslations } from "@/app/LanguageProvider";

import { formatUSD } from "./lib/format";
import {
  COUNTRY_NAMES,
  countryIdFromName,
  subsidiaryIdFromName,
  autoSubsidiaryForCountry,
} from "./lib/catalogs";
import { saveProposal } from "./lib/storage";
import type { UIItem, SaveProposalInput } from "./lib/types";

import {
  getInitialItems,
  fetchCatalogItems,
  fetchItemsPopularity,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
} from "./lib/items";

import {
  isWppAuth,
  isWppMarketing,
  isWppUtility,
  isMinutesIn,
  isMinutesOut,
  isWiserPro,
} from "./lib/itemKinds";
import { priceMinutes, priceWhatsApp } from "./lib/pricingClient";

import ItemsTable from "./components/ItemsTable";
import { SummaryModal } from "./components/SummaryModal";
import {
  WhatsAppModal,
  type WppKind,
  type WppForm,
} from "./components/WhatsAppModal";
import {
  MinutesModal,
  type MinutesKind,
  type MinForm,
} from "./components/MinutesModal";
import { WiserModal } from "./components/WiserModal";
import { FilialesSidebar, GlossarySidebar } from "./components/Sidebars";

import { useFiliales } from "./hooks/useFiliales";
import { useGlossary } from "./hooks/useGlossary";
import { useProposalTotals } from "./hooks/useProposalTotals";
import Modal from "@/app/components/ui/Modal";
import { toast } from "@/app/components/ui/toast";
import ProposalCreatedModal from "./components/ProposalCreatedModal";
import {
  isProposalError,
  type ProposalError,
  type ProposalErrorCode,
} from "./lib/errors";

/** ----------------- helpers Pipedrive ----------------- */
function extractDealIdFromLink(s: string): string | null {
  if (!s) return null;
  const t = s.trim();
  // permitir que peguen solo el número
  const onlyNum = /^(\d+)$/.exec(t);
  if (onlyNum) return onlyNum[1];
  // formatos típicos: https://wcx.pipedrive.com/deal/42059  |  .../deal/42059/
  const m = t.match(/\/deal\/(\d+)/i);
  if (m) return m[1];
  return null;
}
function computeUnitNet(unitPrice: number, discountPct?: number) {
  const pct = Math.max(0, Math.min(100, Number(discountPct ?? 0)));
  return Math.max(0, unitPrice * (1 - pct / 100));
}

type Props = {
  isAdmin: boolean;
  userId: string;
  userEmail: string;
  onSaved: (id: string) => void; // mantenido por compatibilidad
};

// Orden
type SortKey = "popular" | "sku" | "unitPrice" | "name" | "category";
type SortDir = "asc" | "desc";

export default function Generator({ isAdmin, userId, userEmail }: Props) {
  const generatorT = useTranslations("proposals.generator");
  const toastT = useTranslations("proposals.generator.toast");
  const confirmResetT = useTranslations("proposals.generator.confirmReset");
  const errorsT = useTranslations("proposals.generator.errors");
  const proposalErrorsT = useTranslations("proposals.errors");
  const pipedriveT = useTranslations("proposals.generator.pipedrive");
  const companyT = useTranslations("proposals.generator.company");
  const filtersT = useTranslations("proposals.generator.filters");
  const orderT = useTranslations("proposals.generator.order");
  const actionsT = useTranslations("proposals.generator.actions");
  const totalsT = useTranslations("proposals.generator.totals");
  const pipedriveExample = pipedriveT("exampleLink");
  const emptyValue = generatorT("emptyValue");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [subsidiary, setSubsidiary] = useState("");

  // NUEVO: Link Pipedrive + dealId parseado
  const [pipedriveLink, setPipedriveLink] = useState("");
  const [pipedriveDealId, setPipedriveDealId] = useState<string>("");

  const resolveProposalActionError = React.useCallback(
    (error: ProposalError) =>
      error.kind === "message" ? error.message : proposalErrorsT(error.code),
    [proposalErrorsT]
  );

  const resolveProposalErrorMessage = React.useCallback(
    (error: unknown, fallbackCode: ProposalErrorCode) => {
      if (isProposalError(error)) {
        return resolveProposalActionError(error);
      }
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return proposalErrorsT(fallbackCode);
    },
    [proposalErrorsT, resolveProposalActionError]
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Ordenamiento
  const [sortKey, setSortKey] = useState<SortKey>("popular");
  const [sortDir] = useState<SortDir>("desc");

  // Paginación local
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, sortKey, sortDir]);

  const [items, setItems] = useState<UIItem[]>(() => getInitialItems());
  const [popularity, setPopularity] = useState<Record<string, number>>({}); // itemId -> totalQty

  useEffect(() => {
    fetchCatalogItems()
      .then(setItems)
      .catch((error) => {
        setItems([]);
        toast.error(resolveProposalErrorMessage(error, "catalog.loadFailed"));
      });
    fetchItemsPopularity()
      .then(setPopularity)
      .catch(() => setPopularity({}));
  }, [resolveProposalErrorMessage]);

  const {
    filiales,
    load: loadFiliales,
    addFilial,
    editFilialTitle,
    removeFilial,
    addCountry,
    editCountry,
    removeCountry,
  } = useFiliales();

  const { glossary, load: loadGlossary, addLink, editLink, removeLink } = useGlossary();

  useEffect(() => {
    loadFiliales().then((result) => {
      if (!result.ok) {
        toast.error(resolveProposalActionError(result.error));
      }
    });
    loadGlossary().then((result) => {
      if (!result.ok) {
        toast.error(resolveProposalActionError(result.error));
      }
    });
  }, [loadFiliales, loadGlossary, resolveProposalActionError]);

  const [openSummary, setOpenSummary] = useState(false);
  const [creatingDoc, setCreatingDoc] = useState(false);

  // Modal de éxito
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [showCreated, setShowCreated] = useState(false);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemFormMode, setItemFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInitial, setEditingInitial] =
    useState<ItemFormData | undefined>(undefined);

  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const [openWpp, setOpenWpp] = useState(false);
  const [wppKind, setWppKind] = useState<WppKind>("marketing");
  const [wppForm, setWppForm] = useState<WppForm>({ qty: 0, destCountry: "" });
  const [wppError, setWppError] = useState("");
  const [applyingWpp, setApplyingWpp] = useState(false);

  const [openMin, setOpenMin] = useState(false);
  const [minKind, setMinKind] = useState<MinutesKind>("out");
  const [minForm, setMinForm] = useState<MinForm>({ qty: 0, destCountry: "" });
  const [minError, setMinError] = useState("");
  const [applyingMin, setApplyingMin] = useState(false);

  const [openWiser, setOpenWiser] = useState(false);

  // Filtro texto+categoría
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return items.filter((it) => {
      const matchesText =
        it.name.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.sku.toLowerCase().includes(q);
      const matchesCat = !categoryFilter || it.category === categoryFilter;
      return matchesText && matchesCat;
    });
  }, [items, searchTerm, categoryFilter]);

  // Orden (popular/sku/unitPrice/name/category)
  const ordered = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "sku":
          return a.sku.localeCompare(b.sku) * dir;
        case "unitPrice":
          return (a.unitPrice - b.unitPrice) * dir;
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "category":
          return a.category.localeCompare(b.category) * dir;
        case "popular":
        default: {
          const pa = popularity[a.dbId ?? a.id] ?? 0;
          const pb = popularity[b.dbId ?? b.id] ?? 0;
          // por defecto queremos "más cotizados primero" => desc
          return (pa - pb) * -1; // siempre desc para popular
        }
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir, popularity]);

  const { selectedItems, totalAmount, totalHours } = useProposalTotals(items);

  const openCreateForm = () => {
    setItemFormMode("create");
    setEditingId(null);
    setEditingInitial({
      sku: "",
      name: "",
      description: "",
      devHours: 1,
      unitPrice: 100,
      category: "general",
    });
    setItemFormOpen(true);
  };

  const openEditForm = (it: UIItem) => {
    setItemFormMode("edit");
    setEditingId(it.id);
    setEditingInitial({
      sku: it.sku,
      name: it.name,
      description: it.description,
      devHours: it.devHours,
      unitPrice: it.unitPrice,
      category: it.category,
    });
    setItemFormOpen(true);
  };

  const handleSaveItem = async (data: ItemFormData) => {
    try {
      if (itemFormMode === "create") {
        const created = await createCatalogItem(data);
        setItems((prev) => [created, ...prev]);
        toast.success(toastT("itemCreated"));
      } else if (itemFormMode === "edit" && editingId != null) {
        const current = items.find((i) => i.id === editingId);
        if (current?.dbId) {
          await updateCatalogItem(current.dbId, data);
        }
        setItems((prev) =>
          prev.map((i) =>
            i.id === editingId
              ? {
                  ...i,
                  sku: data.sku || i.sku,
                  name: data.name,
                  description: data.description ?? i.description,
                  devHours: data.devHours,
                  unitPrice: data.unitPrice,
                  category: data.category ?? i.category,
                }
              : i
          )
        );
        toast.success(toastT("itemUpdated"));
      }
    } catch (e) {
      const fallback: ProposalErrorCode =
        itemFormMode === "create" ? "catalog.createFailed" : "catalog.updateFailed";
      const msg = resolveProposalErrorMessage(e, fallback);
      toast.error(toastT("itemSaveError", { message: msg }));
    } finally {
      setItemFormOpen(false);
    }
  };

  const generate = () => {
    if (selectedItems.length === 0) {
      toast.info(toastT("selectItems"));
      return;
    }
    if (!companyName || !country || !subsidiary) {
      toast.info(toastT("fillCompany"));
      return;
    }
    // NUEVO: validar Link Pipedrive
    const id = extractDealIdFromLink(pipedriveLink);
    if (!pipedriveLink || !id) {
      toast.error(toastT("pipedriveLinkRequired", { example: pipedriveExample }));
      return;
    }
    setPipedriveDealId(id);
    setOpenSummary(true);
  };

  // -------- Reset con confirmación (modal)
  const [confirmReset, setConfirmReset] = useState(false);
  const doReset = () => {
    setCompanyName("");
    setCountry("");
    setSubsidiary("");
    setPipedriveLink("");
    setPipedriveDealId("");
    setSearchTerm("");
    setCategoryFilter("");
    setPage(1);
    setItems((prev) =>
      prev.map((i) => ({ ...i, selected: false, quantity: 1, discountPct: 0 }))
    );
    setOpenSummary(false);
    toast.info(toastT("reset"));
  };

  // Mapa seguro id(UI) -> dbId (o id como fallback)
  const idToDbId = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of items) {
      m.set(it.id, it.dbId ?? it.id);
    }
    return m;
  }, [items]);

  const finalizeProposal = async () => {
    setCreatingDoc(true);
    try {
      // Preparo items para documento: unitario NETO
      const docItems = selectedItems.map(({ name, quantity, unitNet, devHours }) => ({
        name,
        quantity,
        unitPrice: unitNet, // valor neto con descuento
        devHours,
      }));

      const recordBase = {
        companyName,
        country,
        countryId: countryIdFromName(country),
        subsidiary,
        subsidiaryId: subsidiaryIdFromName(subsidiary),
        totalAmount,
        totalHours,
        oneShot: totalHours * 50,
        userId,
        userEmail,
      };

      // Crear documento (usa unitario NETO)
      const res = await fetch("/api/docs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: recordBase.companyName,
          country: recordBase.country,
          subsidiary: recordBase.subsidiary,
          items: docItems,
          totals: {
            monthly: recordBase.totalAmount,
            oneShot: recordBase.oneShot,
            hours: recordBase.totalHours,
          },
        }),
      });

      const parsed = (await res.json()) as { url?: string; docId?: string; error?: string };
      if (!res.ok || !parsed.url)
        throw new Error(parsed.error ?? errorsT("missingDocumentUrl"));

      // Persistir propuesta (unitario NETO) con mapeo SEGURO de dbId
      const payloadItems = selectedItems.map((it) => {
        const dbId = idToDbId.get(it.id);
        if (!dbId) {
          throw new Error(
            errorsT("missingItemDbId", { id: it.id })
          );
        }
        return {
          itemId: dbId,
          quantity: it.quantity,
          unitPrice: it.unitNet, // NETO
          devHours: it.devHours,
        };
      });

      const payload: SaveProposalInput = {
        companyName: recordBase.companyName,
        country: recordBase.country,
        countryId: recordBase.countryId,
        subsidiary: recordBase.subsidiary,
        subsidiaryId: recordBase.subsidiaryId,
        totalAmount: recordBase.totalAmount,
        totalHours: recordBase.totalHours,
        oneShot: recordBase.oneShot,
        docUrl: parsed.url,
        docId: parsed.docId,
        userId,
        userEmail,
        // opcionales que tu backend puede ignorar si no están en el schema
        pipedriveLink,
        pipedriveDealId,
        items: payloadItems.filter((p) => !!p.itemId),
      };

      await saveProposal(payload);

      // --- NUEVO: Sincronizar con Pipedrive (server-side) ---
try {
  // construir líneas para Pipedrive DESDE selectedItems
  const pipedriveItems = selectedItems
    .map((i) => ({
      sku: i.sku,                                     // debe coincidir con code en Pipedrive
      quantity: Number(i.quantity) || 0,              // cantidad > 0
      // mandamos unitNet; el backend también acepta unit_price
      unitNet:
        i.unitNet !== undefined
          ? Number(i.unitNet)
          : Number(computeUnitNet(i.unitPrice, i.discountPct)),
    }))
    .filter((l) => l.sku && l.quantity > 0);

  // pequeño log en cliente, por si vuelve a fallar
  console.log("[sync] items ->", { len: pipedriveItems.length, sample: pipedriveItems.slice(0, 3) });

  const syncRes = await fetch("/api/pipedrive/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dealId: pipedriveDealId,
      proposalUrl: parsed.url,
      oneShot: recordBase.oneShot, // puede ser 0; el backend ya lo acepta
      items: pipedriveItems,
    }),
  });

  const syncJson = await syncRes.json().catch(() => ({}));
  if (!syncRes.ok) {
    console.error("Pipedrive sync error:", syncJson);
    toast.error(toastT("pipedriveSyncFailed"));
  } else {
    toast.success(toastT("pipedriveSyncSuccess"));
  }
} catch (err) {
  console.error(err);
  toast.error(toastT("pipedriveSyncUnavailable"));
}


      // Mostrar modal con link
      setOpenSummary(false);
      setCreatedUrl(parsed.url);
      setShowCreated(true);
    } catch (e) {
      const msg = resolveProposalErrorMessage(e, "proposal.saveFailed");
      toast.error(toastT("proposalCreationError", { message: msg }));
    } finally {
      setCreatingDoc(false);
    }
  };

  const applyWhatsApp = async () => {
    if (!pendingItemId) return;
    try {
      setApplyingWpp(true);
      setWppError("");
      const data = await priceWhatsApp({
        subsidiary,
        destCountry: wppForm.destCountry || country,
        kind: wppKind,
        qty: Number(wppForm.qty) || 0,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === pendingItemId
            ? {
                ...i,
                selected: true,
                quantity: data.totalQty,
                unitPrice: data.unitPrice,
                devHours: 0,
                discountPct: 0,
              }
            : i
        )
      );
      setOpenWpp(false);
      setPendingItemId(null);
      toast.success(toastT("whatsAppApplied"));
    } catch (error) {
      const message = resolveProposalErrorMessage(error, "pricing.whatsAppFailed");
      setWppError(message);
      toast.error(message);
    } finally {
      setApplyingWpp(false);
    }
  };

  const applyMinutes = async () => {
    if (!pendingItemId) return;
    try {
      setApplyingMin(true);
      setMinError("");
      const data = await priceMinutes({
        subsidiary,
        destCountry: minForm.destCountry || country,
        kind: minKind,
        qty: Number(minForm.qty) || 0,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === pendingItemId
            ? {
                ...i,
                selected: true,
                quantity: data.totalQty,
                unitPrice: data.unitPrice,
                devHours: 0,
                discountPct: 0,
              }
            : i
        )
      );
      setOpenMin(false);
      setPendingItemId(null);
      toast.success(toastT("minutesApplied"));
    } catch (error) {
      const message = resolveProposalErrorMessage(error, "pricing.minutesFailed");
      setMinError(message);
      toast.error(message);
    } finally {
      setApplyingMin(false);
    }
  };

  const applyWiser = () => {
    if (!pendingItemId) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === pendingItemId
          ? { ...i, selected: true, quantity: 1, unitPrice: 0, devHours: 0, discountPct: 0 }
          : i
      )
    );
    setOpenWiser(false);
    setPendingItemId(null);
    toast.success(toastT("wiserApplied"));
  };

  const handleToggleItem = (item: UIItem, checked: boolean) => {
    if (!checked) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, selected: false } : i))
      );
      return;
    }
    if (
      isWppUtility(item.name) ||
      isWppMarketing(item.name) ||
      isWppAuth(item.name)
    ) {
      setPendingItemId(item.id);
      setWppForm({ qty: 0, destCountry: country || "" });
      setWppError("");
      setWppKind(
        isWppUtility(item.name)
          ? "utility"
          : isWppMarketing(item.name)
          ? "marketing"
          : "auth"
      );
      setOpenWpp(true);
      return;
    }
    if (isMinutesOut(item.name) || isMinutesIn(item.name)) {
      setPendingItemId(item.id);
      setMinForm({ qty: 0, destCountry: country || "" });
      setMinError("");
      setMinKind(isMinutesOut(item.name) ? "out" : "in");
      setOpenMin(true);
      return;
    }
    if (isWiserPro(item.name)) {
      setPendingItemId(item.id);
      setOpenWiser(true);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, selected: true } : i))
    );
  };

  const onDeleteItem = async (itemId: string) => {
    const target = items.find((i) => i.id === itemId);
    if (!target) return;
    try {
      if (target.dbId) await deleteCatalogItem(target.dbId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success(toastT("itemDeleted"));
    } catch (e) {
      const msg = resolveProposalErrorMessage(e, "catalog.deleteFailed");
      toast.error(toastT("itemDeleteError", { message: msg }));
    }
  };

  const existingSkus = useMemo(
    () => items.map((i) => i.sku).filter(Boolean),
    [items]
  );

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_280px] gap-6">
        <aside className="hidden xl:block">
          <FilialesSidebar
            isAdmin={isAdmin}
            filiales={filiales}
            addFilial={addFilial}
            editFilialTitle={editFilialTitle}
            removeFilial={removeFilial}
            addCountry={addCountry}
            editCountry={editCountry}
            removeCountry={removeCountry}
          />
        </aside>

        <section>
          <div className="card border-2">
            <div className="heading-bar mb-3">{generatorT("heading")}</div>

            {/* NUEVO: Link Pipedrive (campo destacado) */}
            <div className="mb-4 rounded-md border-2 border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))]/20 shadow-soft p-4">
              <label className="block text-xs text-gray-700 mb-1">
                {pipedriveT("label")}
                <span className="text-red-600">*</span>
              </label>
              <input
                className="input w-full h-10 ring-2 ring-[rgb(var(--primary))]/40"
                placeholder={pipedriveT("placeholder", { example: pipedriveExample })}
                value={pipedriveLink}
                onChange={(e) => {
                  const v = e.target.value;
                  setPipedriveLink(v);
                  const id = extractDealIdFromLink(v);
                  setPipedriveDealId(id ?? "");
                }}
              />
              <div className="mt-1 text-[12px] text-gray-600">
                {pipedriveT("description")}
              </div>
              {pipedriveLink && !pipedriveDealId && (
                <div className="mt-2 text-[12px] text-red-600">
                  {pipedriveT("invalid")}
                </div>
              )}
              {pipedriveDealId && (
                <div className="mt-2 text-[12px] text-green-700">
                  {pipedriveT("detected")}: <strong>{pipedriveDealId}</strong>
                </div>
              )}
            </div>

            {/* Datos de la empresa / país / filial */}
            <div className="mb-4 rounded-md border-2 bg-white shadow-soft overflow-hidden">
              <div className="heading-bar-sm">{companyT("title")}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                {/* Empresa */}
                <div className="rounded-md border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))]/20 p-3">
                  <label className="block text-xs text-gray-700 mb-1">
                    {companyT("name.label")}
                  </label>
                  <input
                    className="input w-full h-10"
                    placeholder={companyT("name.placeholder")}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                {/* País */}
                <div className="rounded-md border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))]/20 p-3">
                  <label className="block text-xs text-gray-700 mb-1">
                    {companyT("country.label")}
                  </label>
                  <Combobox
                    options={COUNTRY_NAMES}
                    value={country}
                    onChange={(v) => {
                      setCountry(v);
                      setSubsidiary(autoSubsidiaryForCountry(v));
                    }}
                    placeholder={companyT("country.placeholder")}
                  />
                </div>

                {/* Filial */}
                <div className="rounded-md border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))]/20 p-3">
                  <label className="block text-xs text-gray-700 mb-1">
                    {companyT("subsidiary.label")}
                  </label>
                  <input className="input w-full h-10" value={subsidiary || emptyValue} readOnly />
                  <p className="mt-1 text-[12px] text-gray-600">
                    {companyT("subsidiary.helper")}
                  </p>
                </div>
              </div>
            </div>

            {/* + / filtros / acciones – y controles de orden */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
              {/* Lado izquierdo: + y filtros */}
              <div className="flex items-center gap-3 flex-1">
                {isAdmin && (
                  <button
                    onClick={openCreateForm}
                    className="btn-bar px-2 py-2 w-9 h-9 rounded-full"
                    title={actionsT("addItem")}
                    aria-label={actionsT("addItem")}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                  <select
                    className="select h-9"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">{filtersT("categoriesAll")}</option>
                    {Array.from(new Set(items.map((i) => i.category))).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <input
                    className="input h-9"
                    placeholder={filtersT("searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Lado derecho: ordenar + acciones */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{orderT("label")}</span>
                  <select
                    className="select h-9"
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                  >
                    <option value="popular">{orderT("options.popular")}</option>
                    <option value="sku">{orderT("options.sku")}</option>
                    <option value="unitPrice">{orderT("options.unitPrice")}</option>
                    <option value="name">{orderT("options.name")}</option>
                    <option value="category">{orderT("options.category")}</option>
                  </select>
                </div>

                <button onClick={generate} className="btn-bar">
                  {actionsT("generate")}
                </button>
                <button
                  onClick={() => setConfirmReset(true)}
                  className="btn-bar"
                  title={confirmResetT("title")}
                >
                  {actionsT("reset")}
                </button>
              </div>
            </div>

            <ItemsTable
              items={useMemo(() => ordered, [ordered])}
              isAdmin={isAdmin}
              onToggle={handleToggleItem}
              onChangeQty={(itemId, qty) =>
                setItems((prev) =>
                  prev.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i))
                )
              }
              onChangeDiscountPct={(itemId, pct) =>
                setItems((prev) =>
                  prev.map((i) =>
                    i.id === itemId
                      ? { ...i, discountPct: Math.max(0, Math.min(100, Number(pct) || 0)) }
                      : i
                  )
                )
              }
              onEdit={openEditForm}
              onDelete={onDeleteItem}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(n: number) => {
                setPageSize(n);
                setPage(1);
              }}
            />

            <div className="mt-3 flex justify-end">
              <div className="rounded-sm border-2 bg-white px-5 py-3 shadow-soft text-right">
                <div className="text-sm text-gray-500">{totalsT("monthly")}</div>
                <div className="text-[22px] font-semibold text-primary">
                  {formatUSD(totalAmount)}
                </div>
              </div>
            </div>
          </div>

          <SummaryModal
            open={openSummary}
            creating={creatingDoc}
            onClose={() => setOpenSummary(false)}
            onGenerate={finalizeProposal}
            companyName={companyName}
            country={country}
            subsidiary={subsidiary}
            selectedItems={selectedItems}
            totalHours={totalHours}
            totalAmount={totalAmount}
          />

          {/* Modal de confirmación para Reset */}
          <Modal
            open={confirmReset}
            onClose={() => setConfirmReset(false)}
            title={confirmResetT("title")}
            footer={
              <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
                  {confirmResetT("cancel")}
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setConfirmReset(false);
                    doReset();
                  }}
                >
                  {confirmResetT("confirm")}
                </button>
              </div>
            }
          >
            <p className="text-sm text-gray-700">{confirmResetT("message")}</p>
          </Modal>

          <WhatsAppModal
            open={openWpp}
            kind={wppKind}
            form={wppForm}
            billingSubsidiary={subsidiary}
            onChange={(n) => setWppForm((p) => ({ ...p, ...n }))}
            onApply={applyWhatsApp}
            onClose={() => {
              if (applyingWpp) return;
              setOpenWpp(false);
              setPendingItemId(null);
            }}
            error={wppError}
            applying={applyingWpp}
          />

          <MinutesModal
            open={openMin}
            kind={minKind}
            form={minForm}
            billingSubsidiary={subsidiary}
            onChange={(n) => setMinForm((p) => ({ ...p, ...n }))}
            onApply={applyMinutes}
            onClose={() => {
              if (applyingMin) return;
              setOpenMin(false);
              setPendingItemId(null);
            }}
            error={minError}
            applying={applyingMin}
          />

          <WiserModal
            open={openWiser}
            onConfirm={applyWiser}
            onClose={() => {
              setOpenWiser(false);
              setPendingItemId(null);
            }}
          />

          {isAdmin && (
            <ItemForm
              open={itemFormOpen}
              mode={itemFormMode}
              initial={editingInitial}
              onClose={() => setItemFormOpen(false)}
              onSave={handleSaveItem}
              existingSkus={existingSkus}
            />
          )}

          {/* Modal de éxito */}
          <ProposalCreatedModal
            open={showCreated && !!createdUrl}
            url={createdUrl ?? ""}
            onClose={() => setShowCreated(false)}
          />
        </section>

        <aside className="hidden xl:block">
          <GlossarySidebar
            isAdmin={isAdmin}
            glossary={glossary}
            addLink={addLink}
            editLink={editLink}
            removeLink={removeLink}
          />
        </aside>
      </div>
    </div>
  );
}
