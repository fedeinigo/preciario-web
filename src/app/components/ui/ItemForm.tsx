"use client";

import React, { useEffect, useState } from "react";
import Modal from "./Modal";

export interface ItemFormData {
  sku: string;
  name: string;
  description: string;
  unitPrice: number;
  devHours: number;
}

export default function ItemForm({
  open,
  mode,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: ItemFormData;
  onClose: () => void;
  onSave: (data: ItemFormData) => void;
}) {
  const [form, setForm] = useState<ItemFormData>(
    initial ?? {
      sku: "",
      name: "",
      description: "",
      unitPrice: 100,
      devHours: 1,
    }
  );

  useEffect(() => {
    setForm(
      initial ?? {
        sku: "",
        name: "",
        description: "",
        unitPrice: 100,
        devHours: 1,
      }
    );
  }, [initial, open]);

  const handle =
    (k: keyof ItemFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v =
        k === "unitPrice" || k === "devHours"
          ? Number(e.target.value)
          : e.target.value;
      setForm((f) => ({ ...f, [k]: v }));
    };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Nuevo ítem" : "Editar ítem"}
      footer={
        <div className="flex justify-end gap-3">
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={() => onSave(form)}
            disabled={!form.sku || !form.name}
          >
            Guardar
          </button>
        </div>
      }
    >
      <div className="grid gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU (ID del ítem)
          </label>
          <input
            className="input"
            value={form.sku}
            onChange={handle("sku")}
            placeholder="SKU-XXXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            className="input"
            value={form.name}
            onChange={handle("name")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            className="input"
            value={form.description}
            onChange={handle("description")}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio unitario (US$)
            </label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.unitPrice}
              onChange={handle("unitPrice")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horas de desarrollo
            </label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.devHours}
              onChange={handle("devHours")}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
