"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  Plus,
  Trash2,
  Clock,
  Pencil,
  BarChart2,
  LayoutGrid,
  ExternalLink,
} from "lucide-react";
import Modal from "./ui/Modal";
import Combobox from "./ui/Combobox";
import ItemForm, { ItemFormData } from "./ui/ItemForm";

type Role = "admin" | "comercial";

interface Item {
  id: number;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  devHours: number;
  selected: boolean;
}

interface StoredItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  devHours: number;
}

interface ProposalRecord {
  id: string; // PPT-#########
  userId: string;
  userEmail: string;
  createdAt: string; // ISO
  companyName: string;
  country: string;
  countryId: string;
  subsidiary: string;
  subsidiaryId: string;
  items: StoredItem[];
  totalAmount: number;
  totalHours: number;
  oneShot: number;
}

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

/* ---------- Counters (localStorage) ---------- */
const LS_SKU_COUNTER = "wcx_sku_counter_v1";
const LS_PPT_COUNTER = "wcx_ppt_counter_v1";

function readCounter(key: string, fallback = 1): number {
  try {
    const raw = localStorage.getItem(key);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : fallback;
  } catch {
    return fallback;
  }
}
function writeCounter(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}
const pad = (num: number, size: number) => String(num).padStart(size, "0");

function getNextSku(): string {
  const current = readCounter(LS_SKU_COUNTER, 1);
  const sku = `SKU-${pad(current, 3)}`;
  writeCounter(LS_SKU_COUNTER, current + 1);
  return sku;
}
function getNextProposalId(): string {
  const current = readCounter(LS_PPT_COUNTER, 1);
  const id = `PPT-${pad(current, 9)}`;
  writeCounter(LS_PPT_COUNTER, current + 1);
  return id;
}

/* ---------- Catalogs ---------- */
const COUNTRY_CATALOG = [
  { id: "PAIS-ARG", name: "Argentina" },
  { id: "PAIS-BRA", name: "Brasil" },
  { id: "PAIS-CAN", name: "Canadá" },
  { id: "PAIS-CHL", name: "Chile" },
  { id: "PAIS-COL", name: "Colombia" },
  { id: "PAIS-CRI", name: "Costa Rica" },
  { id: "PAIS-CUB", name: "Cuba" },
  { id: "PAIS-DOM", name: "República Dominicana" },
  { id: "PAIS-ECU", name: "Ecuador" },
  { id: "PAIS-SLV", name: "El Salvador" },
  { id: "PAIS-ESP", name: "España" },
  { id: "PAIS-USA", name: "Estados Unidos" },
  { id: "PAIS-GTM", name: "Guatemala" },
  { id: "PAIS-HND", name: "Honduras" },
  { id: "PAIS-MEX", name: "México" },
  { id: "PAIS-NIC", name: "Nicaragua" },
  { id: "PAIS-PAN", name: "Panamá" },
  { id: "PAIS-PRY", name: "Paraguay" },
  { id: "PAIS-PER", name: "Perú" },
  { id: "PAIS-URY", name: "Uruguay" },
  { id: "PAIS-VEN", name: "Venezuela" },
];
const COUNTRY_NAMES = COUNTRY_CATALOG.map((c) => c.name);
const countryIdFromName = (name: string) =>
  COUNTRY_CATALOG.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id ?? "PAIS-UNK";

const SUBSIDIARIES = [
  { id: "FILIAL-AR", name: "ARGENTINA" },
  { id: "FILIAL-BR", name: "BRASIL" },
  { id: "FILIAL-ES", name: "ESPAÑA" },
  { id: "FILIAL-US", name: "USA" },
  { id: "FILIAL-CO", name: "COLOMBIA" },
];
const subsidiaryIdFromName = (name: string) =>
  SUBSIDIARIES.find((s) => s.name.toLowerCase() === name.toLowerCase())?.id ?? "FILIAL-UNK";

/* ---------- Local storage mock DB ---------- */
const LS_USERS = "wcx_users_v2";       // [{email,userId}]
const LS_PROPOSALS = "wcx_proposals_v2";

interface UserEntry { email: string; userId: string; }

function saveUser(entry: UserEntry) {
  try {
    const raw = localStorage.getItem(LS_USERS);
    const list: UserEntry[] = raw ? JSON.parse(raw) : [];
    if (!list.some((u) => u.email === entry.email)) {
      list.push(entry);
      localStorage.setItem(LS_USERS, JSON.stringify(list));
    }
  } catch {}
}
function readUsers(): UserEntry[] {
  try {
    const raw = localStorage.getItem(LS_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveProposal(p: ProposalRecord) {
  try {
    const raw = localStorage.getItem(LS_PROPOSALS);
    const list: ProposalRecord[] = raw ? JSON.parse(raw) : [];
    list.push(p);
    localStorage.setItem(LS_PROPOSALS, JSON.stringify(list));
  } catch {}
}
function readProposals(): ProposalRecord[] {
  try {
    const raw = localStorage.getItem(LS_PROPOSALS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/* ---------- Initial items ---------- */
const DEFAULT_ITEMS: Item[] = [
  { id: 1, sku: "SKU-001", name: "Canal WhatsApp", description: "Implementación y configuración inicial", quantity: 1, unitPrice: 100, devHours: 10, selected: false },
  { id: 2, sku: "SKU-002", name: "Crédito WhatsApp - Calculadora", description: "Módulo de cálculo de consumos", quantity: 1, unitPrice: 100, devHours: 1, selected: false },
  { id: 3, sku: "SKU-003", name: "Canal META", description: "Integración de campañas + tracking", quantity: 2, unitPrice: 100, devHours: 1, selected: false },
  { id: 4, sku: "SKU-004", name: "Canal Email", description: "Plantillas y tracking básico", quantity: 1, unitPrice: 100, devHours: 1, selected: false },
  { id: 5, sku: "SKU-005", name: "Canal LinkedIn", description: "Automatizaciones y contenidos", quantity: 1, unitPrice: 100, devHours: 1, selected: false },
];
function initSkuCounterIfNeeded(items: Item[]) {
  const current = readCounter(LS_SKU_COUNTER, 0);
  if (current > 0) return;
  const max = items.reduce((acc, it) => {
    const m = it.sku.match(/^SKU-(\d{3,})$/);
    return Math.max(acc, m ? Number(m[1]) : 0);
  }, 0);
  writeCounter(LS_SKU_COUNTER, max + 1);
}

/* =================================================================== */

export default function ProposalSystem() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const isAdmin = (session?.user?.role as Role) === "admin";
  const userId = session?.user?.id as string | undefined;

  const [activeTab, setActiveTab] = useState<"generator" | "history" | "stats">("generator");

  // Generator
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [subsidiary, setSubsidiary] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<Item[]>(DEFAULT_ITEMS);

  // Modals
  const [openSummary, setOpenSummary] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemFormMode, setItemFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingInitial, setEditingInitial] = useState<ItemFormData | undefined>(undefined);

  // Success modal with proposal ID
  const [savedId, setSavedId] = useState<string | null>(null);

  // History/Stats
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserEntry | null>(null); // null = Todos (para admin)

  // History filters
  const [filterId, setFilterId] = useState<string>("");          // PPT-…
  const [filterCompany, setFilterCompany] = useState<string>(""); // por nombre
  const [filterCountry, setFilterCountry] = useState<string>("");
  const [filterSubsidiary, setFilterSubsidiary] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");       // YYYY-MM-DD exacto
  const [sortTotal, setSortTotal] = useState<"none" | "asc" | "desc">("none");

  // Redirect modal (history action)
  const [redirectOpen, setRedirectOpen] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Stats date range (now fully local state)
  const [rangeFrom, setRangeFrom] = useState<string>("");
  const [rangeTo, setRangeTo] = useState<string>("");

  // Load base
  useEffect(() => {
    setProposals(readProposals());
    setUsers(readUsers());
    initSkuCounterIfNeeded(DEFAULT_ITEMS);
  }, [openSummary, activeTab]);

  // Register user
  useEffect(() => {
    if (session?.user?.email && userId) {
      saveUser({ email: session.user.email, userId });
      setUsers(readUsers());
      // Comerciales: por defecto ver su propio histórico
      if (!isAdmin) {
        setSelectedUser({ email: session.user.email, userId });
      }
    }
  }, [session?.user?.email, userId, isAdmin]);

  const handleInput =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setter(e.target.value);

  const resetAll = () => {
    setCompanyName("");
    setCountry("");
    setSubsidiary("");
    setSearchTerm("");
    setItems((prev) => prev.map((i) => ({ ...i, selected: false })));
    setOpenSummary(false);
  };

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
    );
  }, [items, searchTerm]);

  const subtotal = (item: Item) => item.quantity * item.unitPrice;

  const { selectedItems, totalAmount, totalHours } = useMemo(() => {
    const sel = items.filter((i) => i.selected);
    const totalAmt = sel.reduce((sum, it) => sum + subtotal(it), 0);
    const totalHrs = sel.reduce((sum, it) => sum + it.devHours * it.quantity, 0);
    return { selectedItems: sel, totalAmount: totalAmt, totalHours: totalHrs };
  }, [items]);

  // Create/Edit item
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
            ? { ...i, sku: data.sku || i.sku, name: data.name, description: data.description, devHours: data.devHours, unitPrice: data.unitPrice }
            : i
        )
      );
    }
    setItemFormOpen(false);
  };

  // Generate summary
  const generate = () => {
    const validCountry = COUNTRY_NAMES.some((n) => n.toLowerCase() === country.toLowerCase());
    if (selectedItems.length === 0 || !companyName || !validCountry || !subsidiary) {
      alert("Completa empresa, país (desde la lista), filial y selecciona al menos un ítem.");
      return;
    }
    setOpenSummary(true);
  };

  // Confirm -> save proposal + success modal with PPT id
  const finalizeProposal = () => {
    if (!session?.user?.email || !userId) return;

    const record: ProposalRecord = {
      id: getNextProposalId(),
      userId,
      userEmail: session.user.email!,
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
    setProposals(readProposals());
    setOpenSummary(false);
    setSavedId(record.id);
    setTimeout(() => setSavedId(null), 2000);
  };

  // Login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const res = await signIn("credentials", {
      email: loginEmail,
      password: loginPass,
      redirect: false,
    });
    if (!res?.ok) setLoginError("Credenciales inválidas. Recuerda que la contraseña es 1234.");
  }

  if (loading) return <div className="p-8 text-center">Cargando…</div>;

  /* -------------------- LOGIN -------------------- */
  if (!session) {
    return (
      <div className="p-6">
        <div className="card max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-2">Bienvenido a Wise CX</h1>
          <p className="text-center text-gray-600 mb-6">
            Para acceder al sistema de generación de propuestas, por favor inicia sesión.
          </p>

          <form onSubmit={handleLogin} className="max-w-md mx-auto grid gap-3">
            <input
              className="input"
              type="email"
              placeholder='Correo (admin: "admin@wisecx.com")'
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder='Contraseña (demo: "1234")'
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              required
            />
            {loginError && <div className="text-red-600 text-sm">{loginError}</div>}
            <button type="submit" className="btn-primary w-full">Iniciar sesión</button>
          </form>
        </div>
      </div>
    );
  }

  /* -------------------- TABS -------------------- */
  return (
    <div className="bg-gray-100 rounded-xl">
      <div className="px-6 pt-6">
        <div className="flex gap-3">
          <button
            className={`tab ${activeTab === "generator" ? "tab-active" : "tab-inactive"}`}
            onClick={() => setActiveTab("generator")}
          >
            <LayoutGrid className="mr-2 h-4 w-4" /> Generador
          </button>
          <button
            className={`tab ${activeTab === "history" ? "tab-active" : "tab-inactive"}`}
            onClick={() => setActiveTab("history")}
          >
            <Clock className="mr-2 h-4 w-4" /> Histórico
          </button>
          <button
            className={`tab ${activeTab === "stats" ? "tab-active" : "tab-inactive"}`}
            onClick={() => setActiveTab("stats")}
          >
            <BarChart2 className="mr-2 h-4 w-4" /> Estadísticas
          </button>
        </div>
      </div>

      {/* -------------------- GENERATOR -------------------- */}
      {activeTab === "generator" && (
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
              <button onClick={generate} className="btn-primary">Generar Propuesta</button>
              <button onClick={resetAll} className="btn-ghost">Resetear</button>
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
                      <td className="table-td"><div className="py-2">{item.name}</div></td>
                      <td className="table-td"><div className="py-2 text-gray-700">{item.description}</div></td>
                      <td className="table-td text-center"><div className="py-2">{item.devHours}</div></td>
                      <td className="table-td text-center">
                        <input
                          type="number"
                          min={1}
                          className="input text-center"
                          value={item.quantity}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id ? { ...i, quantity: Number(e.target.value) } : i
                              )
                            )
                          }
                        />
                      </td>
                      <td className="table-td text-center"><div className="py-2">{formatUSD(item.unitPrice)}</div></td>
                      <td className="table-td text-center font-semibold">{formatUSD(item.quantity * item.unitPrice)}</td>
                      {isAdmin && (
                        <td className="table-td text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button className="btn-ghost" title="Editar" onClick={() => openEditForm(item)}>
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button className="btn-ghost" title="Eliminar" onClick={() =>
                              setItems((prev) => prev.filter((i) => i.id !== item.id))
                            }>
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
                <div className="text-2xl font-extrabold text-primary">{formatUSD(totalAmount)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- HISTORY -------------------- */}
      {activeTab === "history" && (
        <div className="p-6">
          <div className="card border border-gray-100">
            <h2 className="text-2xl font-bold mb-4">Histórico</h2>

            {/* User scope chips (admin) */}
            {isAdmin ? (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Usuarios</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`btn ${selectedUser === null ? "tab-active" : "tab-inactive"} border`}
                    onClick={() => setSelectedUser(null)}
                  >
                    Todos
                  </button>
                  {users.map((u) => (
                    <button
                      key={u.email}
                      className={`btn ${selectedUser?.email === u.email ? "tab-active" : "tab-inactive"} border`}
                      onClick={() => setSelectedUser(u)}
                      title={u.userId}
                    >
                      {u.email}
                      <span className="ml-2 text-xs text-gray-500">({u.userId})</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 text-sm text-gray-600">
                Viendo histórico de <span className="font-medium">{session.user?.email}</span>
              </div>
            )}

            {/* Filters aligned with columns */}
            <div className="rounded-lg border bg-white p-3 shadow-soft mb-2">
              <div className="grid grid-cols-7 gap-2 items-end">
                {/* Col 1: ID */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ID (PPT)</label>
                  <input
                    className="input"
                    placeholder="PPT-000000123"
                    value={filterId}
                    onChange={(e) => setFilterId(e.target.value)}
                  />
                </div>
                {/* Col 2: Empresa */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Empresa</label>
                  <input
                    className="input"
                    placeholder="Buscar…"
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                  />
                </div>
                {/* Col 3: País */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">País</label>
                  <select
                    className="select"
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {Array.from(new Set(proposals.map((p) => p.country))).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {/* Col 4: Filial */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Filial</label>
                  <select
                    className="select"
                    value={filterSubsidiary}
                    onChange={(e) => setFilterSubsidiary(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {Array.from(new Set(proposals.map((p) => p.subsidiary))).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {/* Col 5: Mensual (orden) */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Orden por mensual</label>
                  <select
                    className="select"
                    value={sortTotal}
                    onChange={(e) => setSortTotal(e.target.value as "none" | "asc" | "desc")}
                  >
                    <option value="none">—</option>
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                </div>
                {/* Col 6: Fecha (día) */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fecha (día)</label>
                  <input
                    type="date"
                    className="input"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>
                {/* Col 7: Acciones */}
                <div className="flex items-end">
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setFilterId("");
                      setFilterCompany("");
                      setFilterCountry("");
                      setFilterSubsidiary("");
                      setFilterDate("");
                      setSortTotal("none");
                    }}
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="table-th">ID Propuesta</th>
                    <th className="table-th">Empresa</th>
                    <th className="table-th">País</th>
                    <th className="table-th">Filial</th>
                    <th className="table-th text-right">Mensual</th>
                    <th className="table-th">Fecha</th>
                    <th className="table-th w-40 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals
                    // Scope (admin todos/uno, comercial propio)
                    .filter((p) =>
                      isAdmin
                        ? selectedUser
                          ? p.userEmail === selectedUser.email
                          : true
                        : p.userEmail === session.user?.email
                    )
                    // ID
                    .filter((p) =>
                      !filterId ||
                      p.id.toLowerCase().includes(filterId.toLowerCase())
                    )
                    // Empresa
                    .filter((p) =>
                      !filterCompany ||
                      p.companyName.toLowerCase().includes(filterCompany.toLowerCase())
                    )
                    // País
                    .filter((p) => !filterCountry || p.country === filterCountry)
                    // Filial
                    .filter((p) => !filterSubsidiary || p.subsidiary === filterSubsidiary)
                    // Fecha exacta
                    .filter((p) => {
                      if (!filterDate) return true;
                      const d = new Date(p.createdAt);
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, "0");
                      const dd = String(d.getDate()).padStart(2, "0");
                      const onlyDate = `${yyyy}-${mm}-${dd}`;
                      return onlyDate === filterDate;
                    })
                    // Orden
                    .sort((a, b) =>
                      sortTotal === "asc"
                        ? a.totalAmount - b.totalAmount
                        : sortTotal === "desc"
                        ? b.totalAmount - a.totalAmount
                        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .map((p) => (
                      <tr key={p.id}>
                        <td className="table-td">
                          <span className="text-gray-500 font-mono">{p.id}</span>
                        </td>
                        <td className="table-td">{p.companyName}</td>
                        <td className="table-td">
                          {p.country} <span className="text-xs text-gray-500">({countryIdFromName(p.country)})</span>
                        </td>
                        <td className="table-td">
                          {p.subsidiary} <span className="text-xs text-gray-500">({subsidiaryIdFromName(p.subsidiary)})</span>
                        </td>
                        <td className="table-td text-right">{formatUSD(p.totalAmount)}</td>
                        <td className="table-td">{new Date(p.createdAt).toLocaleString()}</td>
                        <td className="table-td text-center">
                          <button
                            className="btn-ghost"
                            onClick={() => {
                              setRedirectOpen(true);
                              setTimeout(() => setRedirectOpen(false), 2000);
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver propuesta
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- STATS -------------------- */}
      {activeTab === "stats" && (
        <div className="p-6">
          <div className="card border border-gray-100">
            <h2 className="text-2xl font-bold mb-4">Estadísticas</h2>

            {/* Date range */}
            <div className="rounded-lg border bg-white p-4 shadow-soft mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <DateInput label="Desde" value={rangeFrom} onChange={setRangeFrom} />
                <DateInput label="Hasta" value={rangeTo} onChange={setRangeTo} />
                <div className="flex items-end">
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setRangeFrom("");
                      setRangeTo("");
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>

            {(() => {
              const subset = proposals.filter((p) => {
                // Scope
                const inScope = isAdmin ? true : p.userEmail === session.user?.email;
                if (!inScope) return false;
                // Range
                const t = new Date(p.createdAt).getTime();
                const f = rangeFrom ? new Date(rangeFrom).getTime() : -Infinity;
                const to = rangeTo ? new Date(rangeTo).getTime() + 24 * 3600 * 1000 - 1 : Infinity;
                return t >= f && t <= to;
              });

              const uniqueUsers = Array.from(new Set(subset.map((p) => p.userEmail))).length;
              const uniqueCompanies = Array.from(new Set(subset.map((p) => p.companyName))).length;

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard label="Propuestas generadas" value={String(subset.length)} />
                    <StatCard label="Usuarios únicos" value={String(uniqueUsers)} />
                    <StatCard label="Empresas distintas" value={String(uniqueCompanies)} />
                  </div>

                  {/* Items count */}
                  <Section title="Ítems más cotizados (por SKU)">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr>
                          <th className="table-th">SKU</th>
                          <th className="table-th">Ítem</th>
                          <th className="table-th w-40 text-right">Cantidad total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(
                          subset.reduce<Record<string, { name: string; qty: number }>>((acc, p) => {
                            p.items.forEach((it) => {
                              const cur = acc[it.sku] ?? { name: it.name, qty: 0 };
                              cur.qty += it.quantity;
                              cur.name = cur.name || it.name;
                              acc[it.sku] = cur;
                            });
                            return acc;
                          }, {})
                        )
                          .sort((a, b) => b[1].qty - a[1].qty)
                          .map(([sku, info]) => (
                            <tr key={sku}>
                              <td className="table-td">
                                <span className="text-gray-500 font-mono">{sku}</span>
                              </td>
                              <td className="table-td">{info.name}</td>
                              <td className="table-td text-right font-semibold">{info.qty}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </Section>

                  {/* Proposals by country */}
                  <Section title="Propuestas por país">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr>
                          <th className="table-th">País</th>
                          <th className="table-th w-40 text-right">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(
                          subset.reduce<Record<string, number>>((acc, p) => {
                            acc[p.country] = (acc[p.country] ?? 0) + 1;
                            return acc;
                          }, {})
                        )
                          .sort((a, b) => b[1] - a[1])
                          .map(([c, n]) => (
                            <tr key={c}>
                              <td className="table-td">
                                {c} <span className="text-xs text-gray-500">({countryIdFromName(c)})</span>
                              </td>
                              <td className="table-td text-right font-semibold">{n}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </Section>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* -------------------- MODAL: Summary -------------------- */}
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
                  <span className="text-xs text-gray-500">({countryIdFromName(country)})</span>
                </>
              }
            />
            <InfoCard
              label="Filial"
              value={
                <>
                  {subsidiary}{" "}
                  <span className="text-xs text-gray-500">({subsidiaryIdFromName(subsidiary)})</span>
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

      {/* Create/Edit item */}
      {isAdmin && (
        <ItemForm
          open={itemFormOpen}
          mode={itemFormMode}
          initial={editingInitial}
          onClose={() => setItemFormOpen(false)}
          onSave={handleSaveItem}
        />
      )}

      {/* Redirect simulation */}
      <Modal
        open={redirectOpen}
        onClose={() => setRedirectOpen(false)}
        title="Redireccionando"
        footer={null}
      >
        <p className="text-gray-700">Estás siendo redireccionado a la propuesta…</p>
      </Modal>

      {/* Success modal with PPT ID */}
      <Modal
        open={!!savedId}
        onClose={() => setSavedId(null)}
        title="Propuesta generada"
        footer={null}
      >
        <p className="text-gray-700">
          ¡Listo! ID de la propuesta: <span className="font-mono font-semibold">{savedId}</span>
        </p>
      </Modal>
    </div>
  );
}

/* -------------------- Little UI helpers -------------------- */
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
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white px-5 py-4 shadow-soft">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-3xl font-extrabold text-primary">{value}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="overflow-x-auto rounded-lg border">{children}</div>
    </div>
  );
}
function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input
        type="date"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
