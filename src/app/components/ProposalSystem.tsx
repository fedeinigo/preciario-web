"use client";

import React, { useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Plus, Trash2, Lock, Clock, Pencil } from "lucide-react";
import Modal from "./ui/Modal";
import Combobox from "./ui/Combobox";
import ItemForm, { ItemFormData } from "./ui/ItemForm";

type Role = "admin" | "comercial";

interface Item {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  devHours: number;
  selected: boolean;
}

// Países de América + España
const COUNTRIES = [
  "Antigua y Barbuda","Argentina","Bahamas","Barbados","Belice","Bolivia",
  "Brasil","Canadá","Chile","Colombia","Costa Rica","Cuba","Dominica",
  "República Dominicana","Ecuador","El Salvador","España","Estados Unidos",
  "Granada","Guatemala","Guyana","Haití","Honduras","Jamaica","México",
  "Nicaragua","Panamá","Paraguay","Perú","Puerto Rico",
  "San Cristóbal y Nieves","Santa Lucía","San Vicente y las Granadinas",
  "Surinam","Trinidad y Tobago","Uruguay","Venezuela"
];

const DEFAULT_ITEMS: Item[] = [
  { id: 1, name: "Canal WhatsApp", description: "Implementación y configuración inicial", quantity: 1, unitPrice: 100, devHours: 10, selected: false },
  { id: 2, name: "Crédito WhatsApp - Calculadora", description: "Módulo de cálculo de consumos", quantity: 1, unitPrice: 100, devHours: 1, selected: false },
  { id: 3, name: "Canal META", description: "Integración de campañas + tracking", quantity: 2, unitPrice: 100, devHours: 1, selected: false },
  { id: 4, name: "Canal Email", description: "Plantillas y tracking básico", quantity: 1, unitPrice: 100, devHours: 1, selected: false },
  { id: 5, name: "Canal LinkedIn", description: "Automatizaciones y contenidos", quantity: 1, unitPrice: 100, devHours: 1, selected: false },
];

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function ProposalSystem() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const isAdmin = (session?.user?.role as Role) === "admin";

  const [activeTab, setActiveTab] = useState<"generator" | "history">("generator");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState(""); // SIEMPRE de la lista
  const [subsidiary, setSubsidiary] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<Item[]>(DEFAULT_ITEMS);

  // MODALES
  const [openSummary, setOpenSummary] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemFormMode, setItemFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingInitial, setEditingInitial] = useState<ItemFormData | undefined>(undefined);

  // Filiales disponibles
  const subsidiaries = ["ARGENTINA", "BRASIL", "ESPAÑA", "USA", "COLOMBIA"];

  const handleInput =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setter(e.target.value);

  const deleteItem = (id: number) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const resetAll = () => {
    setCompanyName("");
    setCountry("");
    setSubsidiary("");
    setSearchTerm("");
    setItems(DEFAULT_ITEMS.map((i) => ({ ...i, selected: false, quantity: 1 })));
    setOpenSummary(false);
  };

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [items, searchTerm]);

  const subtotal = (item: Item) => item.quantity * item.unitPrice;

  const { selectedItems, totalAmount, totalHours } = useMemo(() => {
    const sel = items.filter((i) => i.selected);
    const totalAmt = sel.reduce((sum, it) => sum + subtotal(it), 0);
    const totalHrs = sel.reduce((sum, it) => sum + it.devHours * it.quantity, 0);
    return { selectedItems: sel, totalAmount: totalAmt, totalHours: totalHrs };
  }, [items]);

  // Abrir modal crear
  const openCreateForm = () => {
    setItemFormMode("create");
    setEditingId(null);
    setEditingInitial(undefined);
    setItemFormOpen(true);
  };

  // Abrir modal editar
  const openEditForm = (it: Item) => {
    setItemFormMode("edit");
    setEditingId(it.id);
    setEditingInitial({
      name: it.name,
      description: it.description,
      devHours: it.devHours,
      unitPrice: it.unitPrice,
    });
    setItemFormOpen(true);
  };

  // Guardar (crear/editar)
  const handleSaveItem = (data: ItemFormData) => {
    if (itemFormMode === "create") {
      const newItem: Item = {
        id: Date.now(),
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
    const isValidCountry = COUNTRIES.some(
      (c) => c.toLowerCase() === country.toLowerCase()
    );
    if (selectedItems.length === 0 || !companyName || !isValidCountry || !subsidiary) {
      alert("Completa empresa, país (desde la lista), filial y selecciona al menos un ítem.");
      return;
    }
    setOpenSummary(true);
  };

  if (loading) return <div className="p-8 text-center">Cargando…</div>;

  // LANDING sin sesión (login DEMO)
  if (!session) {
    return (
      <div className="p-6">
        <div className="card max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-2">Bienvenido a Wise CX</h1>
        <p className="text-center text-gray-600 mb-6">
            Para acceder al sistema de generación de propuestas, por favor inicia sesión.
          </p>

          <div className="flex justify-center">
            <button
              className="btn-primary"
              onClick={() =>
                signIn("credentials", {
                  email: "admin@test.com",
                  password: "1234",
                  redirect: false,
                })
              }
            >
              Iniciar sesión (Demo)
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-500 text-center">
            También podés entrar como <b>comercial@test.com</b> / 1234:
            <div className="mt-3 flex justify-center gap-3">
              <button
                className="btn-ghost"
                onClick={() =>
                  signIn("credentials", {
                    email: "comercial@test.com",
                    password: "1234",
                    redirect: false,
                  })
                }
              >
                Entrar como Comercial
              </button>
              <button
                className="btn-ghost"
                onClick={() =>
                  signIn("credentials", {
                    email: "admin@test.com",
                    password: "1234",
                    redirect: false,
                  })
                }
              >
                Entrar como Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GENERADOR (con sesión)
  return (
    <div className="bg-gray-100 rounded-xl">
      {/* Tabs */}
      <div className="px-6 pt-6">
        <div className="flex gap-3">
          <button
            className={`tab ${activeTab === "generator" ? "tab-active" : "tab-inactive"}`}
            onClick={() => setActiveTab("generator")}
          >
            <Lock className="mr-2 h-4 w-4" /> Generador
          </button>
          <button
            className={`tab ${activeTab === "history" ? "tab-active" : "tab-inactive"}`}
            onClick={() => setActiveTab("history")}
          >
            <Clock className="mr-2 h-4 w-4" /> Histórico
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="card border border-gray-100">
          <h2 className="text-2xl font-bold mb-6">Generador de Propuestas</h2>

          {/* Encabezado con acciones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              className="input"
              placeholder="Nombre de la empresa"
              value={companyName}
              onChange={handleInput(setCompanyName)}
            />

            {/* País: Combobox (válidos) */}
            <Combobox
              options={COUNTRIES}
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
              {subsidiaries.map((s) => (
                <option key={s} value={s}>
                  {s}
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

          {/* Buscador + Agregar (solo admin) */}
          <div className="flex items-center gap-3 mb-3">
            <input
              className="input"
              placeholder="Escriba para filtrar ítems…"
              value={searchTerm}
              onChange={handleInput(setSearchTerm)}
            />
            {isAdmin && (
              <button onClick={openCreateForm} className="btn-ghost">
                <Plus className="mr-2 h-4 w-4" /> Agregar ítem
              </button>
            )}
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="table-th w-28 text-center">Seleccionar</th>
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

                    {/* Nombre y descripción como texto */}
                    <td className="table-td">
                      <div className="py-2">{item.name}</div>
                    </td>
                    <td className="table-td">
                      <div className="py-2 text-gray-700">{item.description}</div>
                    </td>

                    {/* Horas (texto; se edita en modal) */}
                    <td className="table-td text-center">
                      <div className="py-2">{item.devHours}</div>
                    </td>

                    {/* Cantidad: editable para ambos */}
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

                    {/* Precio (texto; se edita en modal) */}
                    <td className="table-td text-center">
                      <div className="py-2">{formatUSD(item.unitPrice)}</div>
                    </td>

                    <td className="table-td text-center font-semibold">
                      {formatUSD(subtotal(item))}
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
                            onClick={() => deleteItem(item.id)}
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

          {/* Total mensual: caja aparte */}
          <div className="mt-3 flex justify-end">
            <div className="rounded-lg border bg-white px-5 py-3 shadow-soft text-right">
              <div className="text-sm text-gray-500">Total mensual</div>
              <div className="text-2xl font-extrabold text-primary">
                {formatUSD(totalAmount)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Resumen de la Propuesta */}
      <Modal
        open={openSummary}
        onClose={() => setOpenSummary(false)}
        title="Resumen de la Propuesta"
        footer={
          <div className="flex justify-end gap-3">
            <button className="btn-ghost" onClick={() => setOpenSummary(false)}>
              Cerrar
            </button>
            <button className="btn-primary">Generar Documento</button>
          </div>
        }
      >
        {/* Información General: 3 tarjetas */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3">Información General</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border bg-white px-4 py-3 shadow-soft">
              <div className="text-xs uppercase tracking-wide text-gray-500">Empresa</div>
              <div className="text-base font-semibold text-gray-900 truncate">{companyName}</div>
            </div>
            <div className="rounded-lg border bg-white px-4 py-3 shadow-soft">
              <div className="text-xs uppercase tracking-wide text-gray-500">País</div>
              <div className="text-base font-semibold text-gray-900 truncate">{country}</div>
            </div>
            <div className="rounded-lg border bg-white px-4 py-3 shadow-soft">
              <div className="text-xs uppercase tracking-wide text-gray-500">Filial</div>
              <div className="text-base font-semibold text-gray-900 truncate">{subsidiary}</div>
            </div>
          </div>
        </div>

        {/* Ítems seleccionados */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3">Ítems Seleccionados</h4>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
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
                    <td className="table-td">{it.name}</td>
                    <td className="table-td text-center">{it.devHours}</td>
                    <td className="table-td text-center">{it.quantity}</td>
                    <td className="table-td text-center">{formatUSD(it.unitPrice)}</td>
                    <td className="table-td text-center font-semibold">
                      {formatUSD(subtotal(it))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tres tarjetas: izquierda horas + OneShot, derecha total mensual */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-stretch sm:justify-between gap-3">
            {/* Izquierda */}
            <div className="flex gap-3">
              <div className="rounded-lg border bg-white px-5 py-3 shadow-soft text-left">
                <div className="text-sm text-gray-500">Horas de desarrollo</div>
                <div className="text-2xl font-extrabold text-primary">{totalHours}</div>
              </div>
              <div className="rounded-lg border bg-white px-5 py-3 shadow-soft text-right">
                <div className="text-sm text-gray-500">Total OneShot</div>
                <div className="text-2xl font-extrabold text-primary">
                  {formatUSD(totalHours * 50)}
                </div>
              </div>
            </div>

            {/* Derecha */}
            <div className="rounded-lg border bg-white px-5 py-3 shadow-soft text-right">
              <div className="text-sm text-gray-500">Total mensual</div>
              <div className="text-2xl font-extrabold text-primary">
                {formatUSD(totalAmount)}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: Crear/Editar ítem */}
      {isAdmin && (
        <ItemForm
          open={itemFormOpen}
          mode={itemFormMode}
          initial={editingInitial}
          onClose={() => setItemFormOpen(false)}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
}
