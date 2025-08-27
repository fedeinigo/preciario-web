"use client";

import React, { useEffect, useState } from "react";
import Modal from "./Modal";

export interface ItemFormData {
  name: string;
  description: string;
  devHours: number;
  unitPrice: number;
}

interface ItemFormProps {
  open: boolean;
  mode: "create" | "edit";
  initial?: ItemFormData;                 // opcional para crear
  onClose: () => void;
  onSave: (data: ItemFormData) => void;   // retorna solo campos editables
}

const emptyData: ItemFormData = {
  name: "",
  description: "",
  devHours: 0,
  unitPrice: 0,
};

export default function ItemForm({
  open,
  mode,
  initial,
  onClose,
  onSave,
}: ItemFormProps) {
  const [data, setData] = useState<ItemFormData>(initial ?? emptyData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setData(initial ?? emptyData);
    setErrors({});
  }, [initial, open]);

  function validate() {
    const e: Record<string, string> = {};
    if (!data.name.trim()) e.name = "Requerido";
    if (!data.description.trim()) e.description = "Requerido";
    if (Number.isNaN(data.devHours) || data.devHours < 0) e.devHours = "Inválido";
    if (Number.isNaN(data.unitPrice) || data.unitPrice < 0) e.unitPrice = "Inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onSave({
      name: data.name.trim(),
      description: data.description.trim(),
      devHours: Number(data.devHours),
      unitPrice: Number(data.unitPrice),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Nuevo ítem" : "Editar ítem"}
      footer={
        <div className="flex justify-end gap-3">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={submit}>
            {mode === "create" ? "Crear ítem" : "Guardar cambios"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Nombre</label>
          <input
            className={`input ${errors.name ? "border-red-400" : ""}`}
            value={data.name}
            onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
            placeholder="Ej: Canal WhatsApp"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Descripción</label>
          <input
            className={`input ${errors.description ? "border-red-400" : ""}`}
            value={data.description}
            onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))}
            placeholder="Resumen del servicio"
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Horas de desarrollo</label>
            <input
              type="number"
              min={0}
              className={`input ${errors.devHours ? "border-red-400" : ""}`}
              value={data.devHours}
              onChange={(e) =>
                setData((d) => ({ ...d, devHours: Number(e.target.value) }))
              }
            />
            {errors.devHours && (
              <p className="text-xs text-red-500 mt-1">{errors.devHours}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Precio unitario (US$)</label>
            <input
              type="number"
              min={0}
              className={`input ${errors.unitPrice ? "border-red-400" : ""}`}
              value={data.unitPrice}
              onChange={(e) =>
                setData((d) => ({ ...d, unitPrice: Number(e.target.value) }))
              }
            />
            {errors.unitPrice && (
              <p className="text-xs text-red-500 mt-1">{errors.unitPrice}</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
