"use client";

import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import type { FilialGroup, GlossaryLink } from "../lib/storage";

/* =========================================================
   FILIALES (izquierda) — “¿Desde dónde facturamos?”
   ========================================================= */
export function FilialesSidebar({
  isAdmin,
  filiales,
  addFilial,
  editFilialTitle,
  removeFilial,
  addCountry,
  editCountry,
  removeCountry,
}: {
  isAdmin: boolean;
  filiales: FilialGroup[];
  addFilial: (title: string) => void;
  editFilialTitle: (id: string, title: string) => void;
  removeFilial: (id: string) => void;
  addCountry: (filialId: string, name: string) => void;
  editCountry: (filialId: string, idx: number, name: string) => void;
  removeCountry: (filialId: string, idx: number) => void;
}) {
  // Modal: crear filial
  const [openNewFilial, setOpenNewFilial] = useState(false);
  const [newFilialTitle, setNewFilialTitle] = useState("");

  // Edición inline de título de filial (sin alertas)
  const [edGroupId, setEdGroupId] = useState<string | null>(null);
  const [edGroupTitle, setEdGroupTitle] = useState("");

  // Modal: agregar país
  const [openAddCountry, setOpenAddCountry] = useState<{
    open: boolean;
    filialId: string | null;
  }>({ open: false, filialId: null });
  const [countryName, setCountryName] = useState("");

  // Modal: editar país
  const [openEditCountry, setOpenEditCountry] = useState<{
    open: boolean;
    filialId: string | null;
    idx: number;
    name: string;
  }>({ open: false, filialId: null, idx: -1, name: "" });

  return (
    <div className="card">
      {/* Encabezado morado completo + (+) flotante */}
      <div className="relative -mx-4 -mt-3 mb-3">
        <div className="bg-primary text-white font-semibold px-3 py-2 text-[13px] rounded-t-[var(--radius)]">
          ¿Desde dónde facturamos?
        </div>
        {isAdmin && (
          <button
            aria-label="Nueva filial"
            title="Nueva filial"
            onClick={() => {
              setNewFilialTitle("");
              setOpenNewFilial(true);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/95 text-[rgb(var(--primary))] hover:bg-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lista de filiales */}
      <div className="space-y-3">
        {filiales.map((g) => (
          <div key={g.id} className="border rounded-[var(--radius)]">
            <div className="flex items-center justify-between px-3 py-2 bg-[rgb(var(--primary-soft))] border-b">
              {edGroupId === g.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    className="input flex-1"
                    value={edGroupTitle}
                    onChange={(e) => setEdGroupTitle(e.target.value)}
                    placeholder="Nombre de la filial"
                  />
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const val = edGroupTitle.trim();
                      if (!val) return;
                      editFilialTitle(g.id, val);
                      setEdGroupId(null);
                    }}
                  >
                    Guardar
                  </button>
                </div>
              ) : (
                <>
                  <div className="font-medium">{g.title}</div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        className="btn-warning-icon"
                        title="Editar filial"
                        onClick={() => {
                          setEdGroupId(g.id);
                          setEdGroupTitle(g.title);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="btn-danger-icon"
                        title="Eliminar filial"
                        onClick={() => removeFilial(g.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-3 space-y-2">
              {g.countries.map((c, idx) => (
                <div
                  key={`${g.id}-${idx}`}
                  className="flex items-center justify-between border rounded-[var(--radius)] px-3 py-2"
                >
                  <div>{c}</div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        className="btn-warning-icon"
                        title="Editar país"
                        onClick={() =>
                          setOpenEditCountry({
                            open: true,
                            filialId: g.id,
                            idx,
                            name: c,
                          })
                        }
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="btn-danger-icon"
                        title="Eliminar país"
                        onClick={() => removeCountry(g.id, idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isAdmin && (
                <button
                  className="btn-ghost w-full"
                  onClick={() =>
                    setOpenAddCountry({ open: true, filialId: g.id })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" /> Agregar país
                </button>
              )}
            </div>
          </div>
        ))}

        {filiales.length === 0 && (
          <div className="text-sm text-gray-500">
            No hay filiales aún. Usa el botón (+) para crear la primera.
          </div>
        )}
      </div>

      {/* MODAL: Nueva filial */}
      <Modal
        open={openNewFilial}
        onClose={() => setOpenNewFilial(false)}
        title="Nueva filial"
        footer={
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setOpenNewFilial(false)}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const t = newFilialTitle.trim();
                  if (!t) return;
                  addFilial(t);
                  setOpenNewFilial(false);
                }}
                disabled={!newFilialTitle.trim()}
              >
                Crear
              </button>
            </div>
        }
      >
        <div className="grid gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de la filial
            </label>
            <input
              className="input"
              value={newFilialTitle}
              onChange={(e) => setNewFilialTitle(e.target.value)}
              placeholder="Ej: Filial Argentina"
            />
          </div>
        </div>
      </Modal>

      {/* MODAL: Agregar país */}
      <Modal
        open={openAddCountry.open}
        onClose={() => {
          setOpenAddCountry({ open: false, filialId: null });
          setCountryName("");
        }}
        title="Agregar país"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn-ghost"
              onClick={() => {
                setOpenAddCountry({ open: false, filialId: null });
                setCountryName("");
              }}
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                const name = countryName.trim();
                if (!name || !openAddCountry.filialId) return;
                addCountry(openAddCountry.filialId, name);
                setOpenAddCountry({ open: false, filialId: null });
                setCountryName("");
              }}
              disabled={!countryName.trim()}
            >
              Agregar
            </button>
          </div>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del país
          </label>
          <input
            className="input"
            value={countryName}
            onChange={(e) => setCountryName(e.target.value)}
            placeholder="Ej: Argentina"
          />
        </div>
      </Modal>

      {/* MODAL: Editar país */}
      <Modal
        open={openEditCountry.open}
        onClose={() => setOpenEditCountry({ open: false, filialId: null, idx: -1, name: "" })}
        title="Editar país"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn-ghost"
              onClick={() =>
                setOpenEditCountry({ open: false, filialId: null, idx: -1, name: "" })
              }
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                const n = openEditCountry.name.trim();
                if (!n || !openEditCountry.filialId || openEditCountry.idx < 0) return;
                editCountry(openEditCountry.filialId, openEditCountry.idx, n);
                setOpenEditCountry({ open: false, filialId: null, idx: -1, name: "" });
              }}
              disabled={!openEditCountry.name.trim()}
            >
              Guardar
            </button>
          </div>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del país
          </label>
          <input
            className="input"
            value={openEditCountry.name}
            onChange={(e) =>
              setOpenEditCountry((s) => ({ ...s, name: e.target.value }))
            }
            placeholder="Ej: Argentina"
          />
        </div>
      </Modal>
    </div>
  );
}

/* =========================================================
   GLOSARIO (derecha)  — (igual que en el paso anterior)
   ========================================================= */
type LinkForm = { id?: string; label: string; url: string };

export function GlossarySidebar({
  isAdmin,
  glossary,
  addLink,
  editLink,
  removeLink,
}: {
  isAdmin: boolean;
  glossary: GlossaryLink[];
  addLink: (label: string, url: string) => void;
  editLink: (id: string, label: string, url: string) => void;
  removeLink: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LinkForm>({ label: "", url: "" });

  const sorted = useMemo(
    () => [...glossary].sort((a, b) => a.label.localeCompare(b.label)),
    [glossary]
  );

  const openCreate = () => {
    setForm({ label: "", url: "" });
    setOpen(true);
  };
  const openEdit = (link: GlossaryLink) => {
    setForm({ id: link.id, label: link.label, url: link.url });
    setOpen(true);
  };
  const onSave = () => {
    if (!form.label.trim() || !form.url.trim()) return;
    if (form.id) editLink(form.id, form.label.trim(), form.url.trim());
    else addLink(form.label.trim(), form.url.trim());
    setOpen(false);
  };

  return (
    <div className="card">
      {/* Encabezado morado completo + botón (+) flotante */}
      <div className="relative -mx-4 -mt-3 mb-3">
        <div className="bg-primary text-white font-semibold px-3 py-2 text-sm rounded-t-[var(--radius)]">
          Enlaces de Utilidad
        </div>
        {isAdmin && (
          <button
            title="Nuevo enlace"
            onClick={openCreate}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/95 text-[rgb(var(--primary))] hover:bg-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {sorted.map((l) => (
          <div
            key={l.id}
            className="flex items-center justify-between border rounded-[var(--radius)] px-3 py-2 bg-white"
          >
            <div className="font-medium truncate pr-2" title={l.label}>
              {l.label}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border hover:bg-gray-50 transition"
                title="Abrir enlace"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              {isAdmin && (
                <>
                  <button
                    className="btn-warning-icon"
                    title="Editar"
                    onClick={() => openEdit(l)}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="btn-danger-icon"
                    title="Eliminar"
                    onClick={() => removeLink(l.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="text-sm text-gray-500">Aún no hay enlaces cargados.</div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Editar enlace" : "Nuevo enlace"}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={onSave}
              disabled={!form.label.trim() || !form.url.trim()}
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="grid gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              className="input"
              value={form.label}
              onChange={(e) =>
                setForm((f) => ({ ...f, label: e.target.value }))
              }
              placeholder="Ej: Términos comerciales"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              className="input"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
