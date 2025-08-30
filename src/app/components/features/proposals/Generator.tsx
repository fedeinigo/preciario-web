"use client";

import React, { useMemo, useState } from "react";
import Modal from "@/app/components/ui/Modal";
import Combobox from "@/app/components/ui/Combobox";
import ItemForm, { ItemFormData } from "@/app/components/ui/ItemForm";
import { Plus, Trash2, Pencil } from "lucide-react";

import { formatUSD } from "./lib/format";
import {
  COUNTRY_NAMES,
  SUBSIDIARIES,
  countryIdFromName,
  subsidiaryIdFromName,
} from "./lib/catalogs";
import { getNextSku, getNextProposalId, initSkuCounterIfNeeded } from "./lib/ids";
import { saveProposal } from "./lib/storage";
import type { Item, ProposalRecord } from "./lib/types";

const DEFAULT_ITEMS: Item[] = [
  {
    id: 1,
    sku: "SKU-001",
    name: "Canal WhatsApp",
    description: "Implementación y configuración inicial",
    quantity: 1,
    unitPrice: 100,
    devHours: 10,
    selected: false,
  },
  {
    id: 2,
    sku: "SKU-002",
    name: "Crédito WhatsApp - Calculadora",
    description: "Módulo de cálculo de consumos",
    quantity: 1,
    unitPrice: 100,
    devHours: 1,
    selected: false,
  },
  {
    id: 3,
    sku: "SKU-003",
    name: "Canal META",
    description: "Integración de campañas + tracking",
    quantity: 2,
    unitPrice: 100,
    devHours: 1,
    selected: false,
  },
  {
    id: 4,
    sku: "SKU-004",
    name: "Canal Email",
    description: "Plantillas y tracking básico",
    quantity: 1,
    unitPrice: 100,
    devHours: 1,
    selected: false,
  },
  {
    id: 5,
    sku: "SKU-005",
    name: "Canal LinkedIn",
    description: "Automatizaciones y contenidos",
    quantity: 1,
    unitPrice: 100,
    devHours: 1,
    selected: false,
  },
];

initSkuCounterIfNeeded(DEFAULT_ITEMS);

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
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [subsidiary, setSubsidiary] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [items, setItems] = useState<Item[]>(DEFAULT_ITEMS);

  const [openSummary, setOpenSummary] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemFormMode, setItemFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingInitial, setEditingInitial] = useState<ItemFormData | undefined>(undefined);

  const handleInput =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setter(e.target.value);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
    );
  }, [items, searchTerm]);

  const { selectedItems, totalAmount, totalHours } = useMemo(() => {
    const sel = items.filter((i) => i.selected);
    const totalAmt = sel.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const totalHrs = sel.reduce((s, it) => s + it.devHours * it.quantity, 0);
    return { selectedItems: sel, totalAmount: totalAmt, totalHours: totalHrs };
  }, [items]);

  const openCreateForm = () => {
    setItemFormMode("create");
    setEditingId(null);
    setEditingInitial({
      sku: getNextSku(),
      name: "",
      description: "",
      devHours: 1,
      unitPrice: 100,
    });
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
      const newItem: Item = {
        id: Date.now(),
        sku: data.sku || getNextSku(),
        name: data.name,
        description: data.description,
        devHours: data.devHours,
        unitPrice: data.unitPrice,
        quantity: 1,
        selected: false,
      };
      setItems((prev) => [newItem, ...prev]);
    } else if (itemFormMode === "edit" && editingId != null) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingId
            ? {
                ...i,
                sku: data.sku || i.sku,
                name: data.name,
                description: data.description,
                devHours: data.devHours,
                unitPrice: data.unitPrice,
              }
            : i
        )
      );
    }
    setItemFormOpen(false);
  };

  const generate = () => {
    const validCountry = COUNTRY_NAMES.some(
      (n) => n.toLowerCase() === country.toLowerCase()
    );
    if (selectedItems.length === 0 || !companyName || !validCountry || !subsidiary) {
      alert("Completa empresa, país (desde la lista), filial y selecciona al menos un ítem.");
      return;
    }
    setOpenSummary(true);
  };

  const finalizeProposal = () => {
    const record: ProposalRecord = {
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
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        devHours: it.devHours,
      })),
      totalAmount,
      totalHours,
      oneShot: totalHours * 50,
    };
    saveProposal(record);
    setOpenSummary(false);
    onSaved(record.id);
  };

  const resetAll = () => {
    setCompanyName("");
    setCountry("");
    setSubsidiary("");
    setSearchTerm("");
    setItems((prev) => prev.map((i) => ({ ...i, selected: false })));
    setOpenSummary(false);
  };

  return (
    <div className="p-6">
      <div className="card border border-gray-100">
        <h2 className="text-2xl font-bold mb-6">Generador de Propuestas</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            className="input"
            placeholder="Nombre de la empresa"
            value={companyName}
            onChange={handleInput(setCompanyName)}
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
            onChange={handleInput(setSubsidiary)}
          >
            <option value="">Seleccione una filial</option>
            {SUBSIDIARIES.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={generate} className="btn-primary">
            Generar Propuesta
          </button>
          <button onClick={resetAll} className="btn-ghost">
            Resetear
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <input
            className="input"
            placeholder="Escriba para filtrar ítems… (por nombre, descripción o SKU)"
            value={searchTerm}
            onChange={handleInput(setSearchTerm)}
          />
          {isAdmin && (
            <button onClick={openCreateForm} className="btn-ghost">
              <Plus className="mr-2 h-4 w-4" /> Agregar ítem
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="table-th w-16 text-center">Sel.</th>
                <th className="table-th w-32">SKU</th>
                <th className="table-th">Nombre del ítem</th>
                <th className="table-th">Descripción</th>
                <th className="table-th w-36 text-center">Horas</th>
                <th className="table-th w-36 text-center">Cantidad</th>
                <th className="table-th w-40 text-center">Precio (US$)</th>
                <th className="table-th w-32 text-center">Subtotal</th>
                {isAdmin && <th className="table-th w-24 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="odd:bg-primarySoft/40">
                  <td className="table-td text-center">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-primary cursor-pointer"
                      checked={item.selected}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id ? { ...i, selected: e.target.checked } : i
                          )
                        )
                      }
                    />
                  </td>
                  <td className="table-td">
                    <span className="text-xs text-gray-500 font-mono">{item.sku}</span>
                  </td>
                  <td className="table-td">
                    <div className="py-2">{item.name}</div>
                  </td>
                  <td className="table-td">
                    <div className="py-2 text-gray-700">{item.description}</div>
                  </td>
                  <td className="table-td text-center">
                    <div className="py-2">{item.devHours}</div>
                  </td>
                  <td className="table-td text-center">
                    <input
                      type="number"
                      min={1}
                      className="input text-center"
                      value={item.quantity}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id
                              ? { ...i, quantity: Number(e.target.value) }
                              : i
                          )
                        )
                      }
                    />
                  </td>
                  <td className="table-td text-center">
                    <div className="py-2">{formatUSD(item.unitPrice)}</div>
                  </td>
                  <td className="table-td text-center font-semibold">
                    {formatUSD(item.quantity * item.unitPrice)}
                  </td>
                  {isAdmin && (
                    <td className="table-td text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="btn-ghost"
                          title="Editar"
                          onClick={() => openEditForm(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-ghost"
                          title="Eliminar"
                          onClick={() =>
                            setItems((prev) => prev.filter((i) => i.id !== item.id))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex justify-end">
          <div className="rounded-lg border bg-white px-5 py-3 shadow-soft text-right">
            <div className="text-sm text-gray-500">Total mensual</div>
            <div className="text-2xl font-extrabold text-primary">
              {formatUSD(totalAmount)}
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <ItemForm
          open={itemFormOpen}
          mode={itemFormMode}
          initial={editingInitial}
          onClose={() => setItemFormOpen(false)}
          onSave={handleSaveItem}
        />
      )}

      <Modal
        open={openSummary}
        onClose={() => setOpenSummary(false)}
        title="Resumen de la Propuesta"
        footer={
          <div className="flex justify-end gap-3">
            <button className="btn-ghost" onClick={() => setOpenSummary(false)}>
              Cerrar
            </button>
            <button className="btn-primary" onClick={finalizeProposal}>
              Generar Documento
            </button>
          </div>
        }
      >
        <div className="mb-6">
          <h4 className="font-semibold mb-3">Información General</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InfoCard label="Empresa" value={companyName} />
            <InfoCard
              label="País"
              value={
                <>
                  {country}{" "}
                  <span className="text-xs text-gray-500">
                    ({countryIdFromName(country)})
                  </span>
                </>
              }
            />
            <InfoCard
              label="Filial"
              value={
                <>
                  {subsidiary}{" "}
                  <span className="text-xs text-gray-500">
                    ({subsidiaryIdFromName(subsidiary)})
                  </span>
                </>
              }
            />
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold mb-3">Ítems Seleccionados</h4>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="table-th">SKU</th>
                  <th className="table-th">Ítem</th>
                  <th className="table-th w-24 text-center">Horas</th>
                  <th className="table-th w-24 text-center">Cantidad</th>
                  <th className="table-th w-36 text-center">Precio Unit. (US$)</th>
                  <th className="table-th w-32 text-center">Subtotal (US$)</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((it) => (
                  <tr key={it.id}>
                    <td className="table-td">
                      <span className="text-gray-500 font-mono text-xs">{it.sku}</span>
                    </td>
                    <td className="table-td">{it.name}</td>
                    <td className="table-td text-center">{it.devHours}</td>
                    <td className="table-td text-center">{it.quantity}</td>
                    <td className="table-td text-center">{formatUSD(it.unitPrice)}</td>
                    <td className="table-td text-center font-semibold">
                      {formatUSD(it.quantity * it.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-stretch sm:justify-between gap-3">
            <div className="flex gap-3">
              <TotalCard label="Horas de desarrollo" value={String(totalHours)} />
              <TotalCard label="Total OneShot" value={formatUSD(totalHours * 50)} />
            </div>
            <TotalCard label="Total mensual" value={formatUSD(totalAmount)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white px-4 py-3 shadow-soft">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-base font-semibold text-gray-900 truncate">{value}</div>
    </div>
  );
}
function TotalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white px-5 py-3 shadow-soft text-right">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-extrabold text-primary">{value}</div>
    </div>
  );
}
