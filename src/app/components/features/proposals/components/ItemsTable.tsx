// src/app/components/features/proposals/components/ItemsTable.tsx
"use client";

import React from "react";
import type { UIItem } from "../lib/types";
import { formatUSD } from "../lib/format";

export default function ItemsTable({
  items,
  isAdmin,
  onToggle,
  onChangeQty,
  onEdit,
  onDelete,
}: {
  items: UIItem[];
  isAdmin: boolean;
  onToggle: (item: UIItem, checked: boolean) => void;
  onChangeQty: (itemId: string, qty: number) => void;
  onEdit: (it: UIItem) => void;
  onDelete: (itemId: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-md border bg-white">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="table-th w-10"></th>
            <th className="table-th">SKU</th>
            <th className="table-th">Categoría</th>
            <th className="table-th">Ítem</th>
            <th className="table-th w-28 text-right">Cantidad</th>
            <th className="table-th w-32 text-right">Unitario</th>
            <th className="table-th w-24 text-right">Horas</th>
            {isAdmin && <th className="table-th w-36 text-center">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td className="table-td">
                <input
                  type="checkbox"
                  checked={it.selected}
                  onChange={(e) => onToggle(it, e.target.checked)}
                />
              </td>
              <td className="table-td">
                <span className="font-mono text-gray-600">{it.sku}</span>
              </td>
              <td className="table-td">{it.category}</td>
              <td className="table-td">
                <div className="font-medium">{it.name}</div>
                {it.description && (
                  <div className="text-xs text-gray-500">{it.description}</div>
                )}
              </td>
              <td className="table-td text-right">
                <input
                  className="input text-right"
                  type="number"
                  min={0}
                  value={it.quantity}
                  onChange={(e) => onChangeQty(it.id, Number(e.target.value))}
                />
              </td>
              <td className="table-td text-right">{formatUSD(it.unitPrice)}</td>
              <td className="table-td text-right">{it.devHours}</td>
              {isAdmin && (
                <td className="table-td text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="btn-ghost" onClick={() => onEdit(it)}>
                      Editar
                    </button>
                    <button className="btn-ghost" onClick={() => onDelete(it.id)}>
                      Borrar
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td className="table-td text-center text-gray-500" colSpan={8}>
                No hay ítems.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
