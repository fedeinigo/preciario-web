"use client";

import React from "react";
import { Trash2, Pencil, CheckSquare, Square } from "lucide-react";
import type { Item } from "../lib/types";
import { formatUSD } from "../lib/format";

type Props = {
  items: Item[];
  isAdmin: boolean;
  onToggle: (item: Item, checked: boolean) => void;
  onChangeQty: (itemId: number, qty: number) => void;
  onEdit: (it: Item) => void;
  onDelete: (itemId: number) => void;
};

export default function ItemsTable({
  items,
  isAdmin,
  onToggle,
  onChangeQty,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-x-auto border bg-white">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="table-th w-10"></th>
            <th className="table-th">SKU</th>
            <th className="table-th">Categoría</th>
            <th className="table-th">Nombre</th>
            <th className="table-th">Descripción</th>
            <th className="table-th text-right">Horas</th>
            <th className="table-th text-right">Precio unitario</th>
            <th className="table-th text-right">Cantidad</th>
            <th className="table-th text-right">Subtotal</th>
            {isAdmin && <th className="table-th text-center w-24">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const subtotal = it.unitPrice * it.quantity;
            return (
              <tr key={it.id} className="align-top">
                {/* Selección */}
                <td className="table-td">
                  <button
                    className="p-1 rounded hover:bg-gray-100"
                    onClick={() => onToggle(it, !it.selected)}
                    title={it.selected ? "Quitar de la propuesta" : "Agregar a la propuesta"}
                  >
                    {it.selected ? (
                      <CheckSquare className="w-5 h-5 text-[rgb(var(--primary))]" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </td>

                {/* Datos */}
                <td className="table-td font-mono text-gray-600">{it.sku}</td>
                <td className="table-td">{it.category}</td>
                <td className="table-td font-medium">{it.name}</td>
                <td className="table-td text-sm text-gray-600">{it.description}</td>
                <td className="table-td text-right">{it.devHours}</td>
                <td className="table-td text-right">{formatUSD(it.unitPrice)}</td>

                {/* Cantidad */}
                <td className="table-td text-right">
                  <input
                    type="number"
                    min={0}
                    value={it.quantity}
                    onChange={(e) => onChangeQty(it.id, Number(e.target.value) || 0)}
                    className="input w-24 text-right"
                  />
                </td>

                {/* Subtotal */}
                <td className="table-td text-right font-semibold">
                  {formatUSD(subtotal)}
                </td>

                {/* Acciones admin */}
                {isAdmin && (
                  <td className="table-td text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="btn-warning-icon"
                        title="Editar"
                        onClick={() => onEdit(it)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="btn-danger-icon"
                        title="Eliminar"
                        onClick={() => onDelete(it.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}

          {items.length === 0 && (
            <tr>
              <td className="table-td text-center text-gray-500" colSpan={isAdmin ? 10 : 9}>
                No hay ítems para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
