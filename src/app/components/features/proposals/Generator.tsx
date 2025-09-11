// src/app/components/features/proposals/Generator.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import Combobox from "@/app/components/ui/Combobox";
import ItemForm, { type ItemFormData } from "@/app/components/ui/ItemForm";
import { Plus } from "lucide-react";

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

type Props = {
  isAdmin: boolean;
  userId: string;
  userEmail: string;
  onSaved: (id: string) => void; // lo mantenemos en el tipo por compatibilidad, pero no lo usamos aquí
};

export default function Generator({ isAdmin, userId, userEmail }: Props) {
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [subsidiary, setSubsidiary] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Paginación local controlada
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter]);

  const [items, setItems] = useState<UIItem[]>(() => getInitialItems());
  useEffect(() => {
    fetchCatalogItems()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const {
    filiales,
    addFilial,
    editFilialTitle,
    removeFilial,
    addCountry,
    editCountry,
    removeCountry,
  } = useFiliales();

  const { glossary, addLink, editLink, removeLink } = useGlossary();

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
        toast.success("Ítem creado");
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
        toast.success("Ítem actualizado");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Desconocido";
      toast.error(`Error guardando ítem: ${msg}`);
    } finally {
      setItemFormOpen(false);
    }
  };

  const generate = () => {
    if (selectedItems.length === 0) {
      toast.info("Selecciona al menos un ítem para generar la propuesta.");
      return;
    }
    if (!companyName || !country || !subsidiary) {
      toast.info("Completa Empresa, País y Filial antes de continuar.");
      return;
    }
    setOpenSummary(true);
  };

  // -------- Reset con confirmación (modal)
  const [confirmReset, setConfirmReset] = useState(false);
  const doReset = () => {
    setCompanyName("");
    setCountry("");
    setSubsidiary("");
    setSearchTerm("");
    setCategoryFilter("");
    setPage(1);
    setItems((prev) =>
      prev.map((i) => ({ ...i, selected: false, quantity: 1 }))
    );
    setOpenSummary(false);
    toast.info("Generador restablecido");
  };

  const finalizeProposal = async () => {
    setCreatingDoc(true);
    try {
      const recordBase: Omit<
        SaveProposalInput,
        "docUrl" | "docId" | "items"
      > & {
        items: Array<{
          sku: string;
          category: string;
          name: string;
          quantity: number;
          unitPrice: number;
          devHours: number;
        }>;
      } = {
        companyName,
        country,
        countryId: countryIdFromName(country),
        subsidiary,
        subsidiaryId: subsidiaryIdFromName(subsidiary),
        items: selectedItems.map((it) => ({
          sku: it.sku,
          category: it.category,
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          devHours: it.devHours,
        })),
        totalAmount,
        totalHours,
        oneShot: totalHours * 50,
        userId,
        userEmail,
      };

      const res = await fetch("/api/docs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: recordBase.companyName,
          country: recordBase.country,
          subsidiary: recordBase.subsidiary,
          items: recordBase.items.map(
            ({ name, quantity, unitPrice, devHours }) => ({
              name,
              quantity,
              unitPrice,
              devHours,
            })
          ),
          totals: {
            monthly: recordBase.totalAmount,
            oneShot: recordBase.oneShot,
            hours: recordBase.totalHours,
          },
        }),
      });

      const parsed = (await res.json()) as {
        url?: string;
        docId?: string;
        error?: string;
      };
      if (!res.ok || !parsed.url)
        throw new Error(parsed.error ?? "No se recibió la URL del documento.");

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
        items: selectedItems.map((it) => ({
          itemId: it.dbId!, // viene de la DB
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          devHours: it.devHours,
        })),
      };

      await saveProposal(payload);

      // No redirigimos automáticamente: mostramos modal con acciones
      setOpenSummary(false);
      setCreatedUrl(parsed.url);
      setShowCreated(true);

      // Si quisieras limpiar selección después de crear, descomenta:
      // doReset();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast.error(`Error creando propuesta: ${msg}`);
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
              }
            : i
        )
      );
      setOpenWpp(false);
      setPendingItemId(null);
      toast.success("Tarifas de WhatsApp aplicadas");
    } catch (e) {
      setWppError(e instanceof Error ? e.message : "Error");
      toast.error("No se pudo calcular WhatsApp");
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
              }
            : i
        )
      );
      setOpenMin(false);
      setPendingItemId(null);
      toast.success("Minutos aplicados");
    } catch (e) {
      setMinError(e instanceof Error ? e.message : "Error");
      toast.error("No se pudo calcular Minutos");
    } finally {
      setApplyingMin(false);
    }
  };

  const applyWiser = () => {
    if (!pendingItemId) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === pendingItemId
          ? { ...i, selected: true, quantity: 1, unitPrice: 0, devHours: 0 }
          : i
      )
    );
    setOpenWiser(false);
    setPendingItemId(null);
    toast.success("WiserPro aplicado");
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
      toast.success("Ítem eliminado");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Desconocido";
      toast.error(`No se pudo eliminar el ítem: ${msg}`);
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
            <div className="heading-bar mb-3">Generador de Propuestas</div>

            {/* Datos de la empresa / país / filial */}
            <div className="mb-4 rounded-md border-2 bg-white shadow-soft overflow-hidden">
              <div className="heading-bar-sm">Datos de la empresa</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                {/* Empresa */}
                <div className="rounded-md border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))]/20 p-3">
                  <label className="block text-xs text-gray-700 mb-1">
                    Nombre de la empresa
                  </label>
                  <input
                    className="input w-full h-10"
                    placeholder="Ej: Acme S.A."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                {/* País */}
                <div className="rounded-md border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))]/20 p-3">
                  <label className="block text-xs text-gray-700 mb-1">País</label>
                  <Combobox
                    options={COUNTRY_NAMES}
                    value={country}
                    onChange={(v) => {
                      setCountry(v);
                      setSubsidiary(autoSubsidiaryForCountry(v));
                    }}
                    placeholder="Seleccione un país"
                  />
                </div>

                {/* Filial */}
                <div className="rounded-md border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary-soft))]/20 p-3">
                  <label className="block text-xs text-gray-700 mb-1">Filial</label>
                  <input className="input w-full h-10" value={subsidiary || "—"} readOnly />
                  <p className="mt-1 text-[12px] text-gray-600">
                    Se determina automáticamente según el país.
                  </p>
                </div>
              </div>
            </div>

            {/* + / filtros / acciones – MISMO RENGLÓN */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
              {/* Lado izquierdo: + y filtros */}
              <div className="flex items-center gap-3 flex-1">
                {isAdmin && (
                  <button
                    onClick={openCreateForm}
                    className="btn-ghost px-2 py-2 w-9 h-9 rounded-full"
                    title="Agregar ítem"
                    aria-label="Agregar ítem"
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
                    <option value="">Todas las categorías</option>
                    {Array.from(new Set(items.map((i) => i.category))).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <input
                    className="input h-9"
                    placeholder="Filtrar por texto (nombre, descripción o SKU)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Lado derecho: acciones */}
              <div className="flex items-center gap-3">
                <button onClick={generate} className="btn-primary">
                  Generar Propuesta
                </button>
                <button
                  onClick={() => setConfirmReset(true)}
                  className="btn-ghost"
                  title="Restablecer generador"
                >
                  Resetear
                </button>
              </div>
            </div>

            <ItemsTable
              items={useMemo(() => filtered, [filtered])}
              isAdmin={isAdmin}
              onToggle={handleToggleItem}
              onChangeQty={(itemId, qty) =>
                setItems((prev) =>
                  prev.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i))
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
                <div className="text-sm text-gray-500">Total mensual</div>
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
            title="Restablecer generador"
            footer={
              <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setConfirmReset(false);
                    doReset();
                  }}
                >
                  Confirmar
                </button>
              </div>
            }
          >
            <p className="text-sm text-gray-700">
              Esta acción limpia los campos y des-selecciona los ítems. ¿Deseas continuar?
            </p>
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
