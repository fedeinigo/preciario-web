"use client";

import React, { useMemo, useState } from "react";
import Combobox from "@/app/components/ui/Combobox";
import ItemForm, { ItemFormData } from "@/app/components/ui/ItemForm";
import { Plus } from "lucide-react";

import { formatUSD } from "./lib/format";
import { COUNTRY_NAMES, SUBSIDIARIES, countryIdFromName, subsidiaryIdFromName } from "./lib/catalogs";
import { getNextProposalId } from "./lib/ids";
import { saveProposal, type ProposalRecord } from "./lib/storage";
import type { Item } from "./lib/types";

import { getInitialItems } from "./lib/items";
import { isWppAuth, isWppMarketing, isWppUtility, isMinutesIn, isMinutesOut, isWiserPro } from "./lib/itemKinds";
import { priceMinutes, priceWhatsApp } from "./lib/pricingClient";

import ItemsTable from "./components/ItemsTable";
import { SummaryModal } from "./components/SummaryModal";
import { WhatsAppModal, type WppKind } from "./components/WhatsAppModal";
import { MinutesModal, type MinutesKind } from "./components/MinutesModal";
import { WiserModal } from "./components/WiserModal";
import { FilialesSidebar, GlossarySidebar } from "./components/Sidebars";

import { useFiliales } from "./hooks/useFiliales";
import { useGlossary } from "./hooks/useGlossary";
import { useProposalTotals } from "./hooks/useProposalTotals";

/* ===== Tipos de formularios locales (UI) ===== */
type WppForm = { qty: number; destCountry: string; subsidiary: string };
type MinForm = { qty: number; destCountry: string; subsidiary: string };

export default function Generator({
  isAdmin,
  userId,
  userEmail,
  onSaved,
}: {
  isAdmin: boolean;
  userId: string;
  userEmail: string;
  onSaved: (id: string) => void;
}) {
  // ===== Estado general
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [subsidiary, setSubsidiary] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const [items, setItems] = useState<Item[]>(() => getInitialItems());

  // Sidebars (hooks)
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

  // Resumen
  const [openSummary, setOpenSummary] = useState(false);
  const [creatingDoc, setCreatingDoc] = useState(false);

  // ItemForm (crear/editar)
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemFormMode, setItemFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingInitial, setEditingInitial] = useState<ItemFormData | undefined>(undefined);

  // Modales pricing + ítem/variante pendiente
  const [pendingItemId, setPendingItemId] = useState<number | null>(null);

  // WhatsApp modal
  const [openWpp, setOpenWpp] = useState(false);
  const [wppKind, setWppKind] = useState<WppKind>("marketing");
  const [wppForm, setWppForm] = useState<WppForm>({ qty: 0, destCountry: "", subsidiary: "" });
  const [wppError, setWppError] = useState("");

  // Minutes modal
  const [openMin, setOpenMin] = useState(false);
  const [minKind, setMinKind] = useState<MinutesKind>("out");
  const [minForm, setMinForm] = useState<MinForm>({ qty: 0, destCountry: "", subsidiary: "" });
  const [minError, setMinError] = useState("");

  // Wiser modal
  const [openWiser, setOpenWiser] = useState(false);

  // ===== Filtros + Totales
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

  // ===== Handlers menores
  const openCreateForm = () => {
    setItemFormMode("create");
    setEditingId(null);
    setEditingInitial({ sku: "", name: "", description: "", devHours: 1, unitPrice: 100 });
    setItemFormOpen(true);
  };
  const openEditForm = (it: Item) => {
    setItemFormMode("edit");
    setEditingId(it.id);
    setEditingInitial({
      sku: it.sku,
      name: it.name,
      description: it.description,
      devHours: it.devHours,
      unitPrice: it.unitPrice,
    });
    setItemFormOpen(true);
  };
  const handleSaveItem = (data: ItemFormData) => {
    if (itemFormMode === "create") {
      const now: Item = {
        id: Date.now(),
        sku: data.sku || "",
        category: "Otros",
        name: data.name,
        description: data.description,
        devHours: data.devHours,
        unitPrice: data.unitPrice,
        quantity: 1,
        selected: false,
      };
      setItems((prev) => [now, ...prev]);
    } else if (itemFormMode === "edit" && editingId != null) {
      setItems((prev) =>
        prev.map((i) => (i.id === editingId ? { ...i, ...data, sku: data.sku || i.sku } : i))
      );
    }
    setItemFormOpen(false);
  };

  // ===== Generación
  const generate = () => {
    if (selectedItems.length === 0 || !companyName || !country || !subsidiary) {
      alert("Completa empresa, país, filial y selecciona al menos un ítem.");
      return;
    }
    setOpenSummary(true);
  };
  const resetAll = () => {
    setCompanyName("");
    setCountry("");
    setSubsidiary("");
    setSearchTerm("");
    setCategoryFilter("");
    setItems((prev) => prev.map((i) => ({ ...i, selected: false, quantity: 1 })));
    setOpenSummary(false);
  };

  const finalizeProposal = async () => {
    setCreatingDoc(true);
    try {
      const recordBase: Omit<ProposalRecord, "docUrl"> = {
        id: getNextProposalId(),
        userId,
        userEmail,
        createdAt: new Date().toISOString(),
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
      };

      const res = await fetch("/api/docs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: recordBase.companyName,
          country: recordBase.country,
          subsidiary: recordBase.subsidiary,
          items: recordBase.items.map(({ name, quantity, unitPrice, devHours }) => ({
            name,
            quantity,
            unitPrice,
            devHours,
          })),
          totals: {
            monthly: recordBase.totalAmount,
            oneShot: recordBase.oneShot,
            hours: recordBase.totalHours,
          },
        }),
      });

      const raw = await res.text();
      const parsed = JSON.parse(raw) as { url?: string; error?: string };
      if (!res.ok) throw new Error(parsed.error ?? raw);

      const record: ProposalRecord = { ...recordBase, docUrl: parsed.url };
      saveProposal(record);
      onSaved(record.id);
      setOpenSummary(false);
      if (parsed.url) window.open(parsed.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      alert(`Error creando documento: ${e instanceof Error ? e.message : "Error desconocido"}`);
    } finally {
      setCreatingDoc(false);
    }
  };

  // ===== Toggle de ítems especiales
  const handleToggleItem = (item: Item, checked: boolean) => {
    if (!checked) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, selected: false } : i)));
      return;
    }

    // WhatsApp
    if (isWppUtility(item.name) || isWppMarketing(item.name) || isWppAuth(item.name)) {
      setPendingItemId(item.id);
      setWppForm({ qty: 0, destCountry: country || "", subsidiary: subsidiary || "" });
      setWppError("");
      setWppKind(isWppUtility(item.name) ? "utility" : isWppMarketing(item.name) ? "marketing" : "auth");
      setOpenWpp(true);
      return;
    }

    // Minutos
    if (isMinutesOut(item.name) || isMinutesIn(item.name)) {
      setPendingItemId(item.id);
      setMinForm({ qty: 0, destCountry: country || "", subsidiary: subsidiary || "" });
      setMinError("");
      setMinKind(isMinutesOut(item.name) ? "out" : "in");
      setOpenMin(true);
      return;
    }

    // Wiser
    if (isWiserPro(item.name)) {
      setPendingItemId(item.id);
      setOpenWiser(true);
      return;
    }

    // Comunes
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, selected: true } : i)));
  };

  // ===== Aplicar pricing
  const applyWhatsApp = async () => {
    if (!pendingItemId) return;
    try {
      setWppError("");
      const data = await priceWhatsApp({
        subsidiary: wppForm.subsidiary || subsidiary,
        destCountry: wppForm.destCountry || country,
        kind: wppKind,
        qty: Number(wppForm.qty) || 0,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === pendingItemId
            ? { ...i, selected: true, quantity: data.totalQty, unitPrice: data.unitPrice, devHours: 0 }
            : i
        )
      );
      setOpenWpp(false);
      setPendingItemId(null);
    } catch (e) {
      setWppError(e instanceof Error ? e.message : "Error");
    }
  };

  const applyMinutes = async () => {
    if (!pendingItemId) return;
    try {
      setMinError("");
      const data = await priceMinutes({
        subsidiary: minForm.subsidiary || subsidiary,
        destCountry: minForm.destCountry || country,
        kind: minKind,
        qty: Number(minForm.qty) || 0,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === pendingItemId
            ? { ...i, selected: true, quantity: data.totalQty, unitPrice: data.unitPrice, devHours: 0 }
            : i
        )
      );
      setOpenMin(false);
      setPendingItemId(null);
    } catch (e) {
      setMinError(e instanceof Error ? e.message : "Error");
    }
  };

  const applyWiser = () => {
    if (!pendingItemId) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === pendingItemId ? { ...i, selected: true, quantity: 1, unitPrice: 0, devHours: 0 } : i
      )
    );
    setOpenWiser(false);
    setPendingItemId(null);
  };

  // ===== Render
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_280px] gap-6">
        {/* Left */}
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

        {/* Center */}
        <section>
          <div className="card border">
            <div className="bg-primary text-white font-semibold px-3 py-2 text-sm mb-4">
              Generador de Propuestas
            </div>

            {/* Acciones superiores: izquierda generar/reset — derecha agregar item */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <button onClick={generate} className="btn-primary">Generar Propuesta</button>
                <button onClick={resetAll} className="btn-ghost">Resetear</button>
              </div>

              {isAdmin && (
                <button onClick={openCreateForm} className="btn-ghost">
                  <Plus className="mr-2 h-4 w-4" /> Agregar ítem
                </button>
              )}
            </div>

            {/* Empresa / país / filial */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                className="input"
                placeholder="Nombre de la empresa"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Combobox
                options={COUNTRY_NAMES}
                value={country}
                onChange={setCountry}
                placeholder="Seleccione un país"
              />
              <select
                className="select"
                value={subsidiary}
                onChange={(e) => setSubsidiary(e.target.value)}
              >
                <option value="">Seleccione una filial</option>
                {SUBSIDIARIES.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-3">
              <select
                className="select"
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
                className="input min-w-[260px]"
                placeholder="Filtrar por texto (nombre, descripción o SKU)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <ItemsTable
              items={useMemo(() => filtered, [filtered])}
              isAdmin={isAdmin}
              onToggle={handleToggleItem}
              onChangeQty={(itemId, qty) =>
                setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i)))
              }
              onEdit={openEditForm}
              onDelete={(itemId) => setItems((prev) => prev.filter((i) => i.id !== itemId))}
            />

            <div className="mt-3 flex justify-end">
              <div className="rounded-sm border bg-white px-5 py-3 shadow-soft text-right">
                <div className="text-sm text-gray-500">Total mensual</div>
                <div className="text-[22px] font-semibold text-primary">
                  {formatUSD(totalAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Modales */}
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

          <WhatsAppModal
            open={openWpp}
            kind={wppKind}
            form={wppForm}
            onChange={(n) => setWppForm((p) => ({ ...p, ...n }))}
            onApply={applyWhatsApp}
            onClose={() => { setOpenWpp(false); setPendingItemId(null); }}
            error={wppError}
          />

          <MinutesModal
            open={openMin}
            kind={minKind}
            form={minForm}
            onChange={(n) => setMinForm((p) => ({ ...p, ...n }))}
            onApply={applyMinutes}
            onClose={() => { setOpenMin(false); setPendingItemId(null); }}
            error={minError}
          />

          <WiserModal
            open={openWiser}
            onConfirm={applyWiser}
            onClose={() => { setOpenWiser(false); setPendingItemId(null); }}
          />

          {isAdmin && (
            <ItemForm
              open={itemFormOpen}
              mode={itemFormMode}
              initial={editingInitial}
              onClose={() => setItemFormOpen(false)}
              onSave={handleSaveItem}
            />
          )}
        </section>

        {/* Right */}
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
