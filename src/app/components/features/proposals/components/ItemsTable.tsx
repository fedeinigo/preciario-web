// src/app/components/features/proposals/components/ItemsTable.tsx
"use client";

import React, { useMemo } from "react";
import type { UIItem } from "../lib/types";
import { formatUSD } from "../lib/format";

type Props = {
  items: UIItem[];
  isAdmin: boolean;
  onToggle: (item: UIItem, checked: boolean) => void;
  onChangeQty: (itemId: string, qty: number) => void;
  onChangeDiscountPct: (itemId: string, pct: number) => void;
  onEdit: (it: UIItem) => void;
  onDelete: (itemId: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
};

export default function ItemsTable({
  items,
  isAdmin,
  onToggle,
  onChangeQty,
  onChangeDiscountPct,
  onEdit,
  onDelete,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const totalRows = items.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);
  const colSpan = isAdmin ? 8 : 7;

  return (
    <div className="overflow-x-auto rounded-md border-2 bg-white">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="table-th w-10" title="Seleccionar ítem"></th>
            <th className="table-th">SKU</th>
            <th className="table-th">Categoría</th>
            <th className="table-th">Ítem</th>
            <th className="table-th w-28 text-right" title="Cantidad">Cant.</th>
            <th className="table-th w-32 text-right" title="Precio unitario (base)">Unitario</th>
            <th className="table-th w-40 text-right" title="Aplicar descuento al subtotal del ítem">
              Descuento (%)
            </th>
            {isAdmin && <th className="table-th w-36 text-center">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {visible.map((it) => {
            const pct = Math.max(0, Math.min(100, Number(it.discountPct ?? 0)));
            const unitNet = Math.max(0, it.unitPrice * (1 - pct / 100));
            return (
              <tr key={it.id}>
                <td className="table-td">
                  <input
                    type="checkbox"
                    checked={it.selected}
                    onChange={(e) => onToggle(it, e.target.checked)}
                    title="Seleccionar para la propuesta"
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
                    className="input h-9 text-right"
                    type="number"
                    min={0}
                    value={it.quantity}
                    onChange={(e) => onChangeQty(it.id, Number(e.target.value))}
                  />
                </td>
                <td className="table-td text-right" title={`Neto: ${formatUSD(unitNet)}`}>
                  {formatUSD(it.unitPrice)}
                </td>
                <td className="table-td text-right">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      className="input h-9 w-20 text-right"
                      type="number"
                      min={0}
                      max={100}
                      value={pct}
                      onChange={(e) => onChangeDiscountPct(it.id, Number(e.target.value))}
                      title="Porcentaje de descuento (0 a 100)"
                    />
                    <span className="text-xs text-gray-500 mr-1" title="Unitario neto">
                      {formatUSD(unitNet)}
                    </span>
                  </div>
                </td>
                {isAdmin && (
                  <td className="table-td text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="btn-ghost" onClick={() => onEdit(it)} title="Editar ítem">
                        Editar
                      </button>
                      <button className="btn-ghost" onClick={() => onDelete(it.id)} title="Eliminar ítem">
                        Borrar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
          {totalRows === 0 && (
            <tr>
              <td className="table-td text-center text-gray-500" colSpan={colSpan}>
                No hay ítems.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalRows > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 border-t">
          <div className="text-sm text-gray-600">
            Mostrando {start + 1}–{Math.min(start + pageSize, totalRows)} de {totalRows}
          </div>
          <div className="flex items-center gap-2">
            <select
              className="select h-9"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / página
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <button
                className="btn-bar"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                title="Anterior"
              >
                Anterior
              </button>
              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>
              <button
                className="btn-bar"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                title="Siguiente"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
