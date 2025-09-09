// src/app/components/features/proposals/components/SummaryModal.tsx
"use client";

import Modal from "@/app/components/ui/Modal";
import { formatUSD } from "../lib/format";
import React from "react";

type SelectedItemRow = {
  name: string;
  quantity: number;
  unitPrice: number;
  devHours: number;
};

export function SummaryModal({
  open,
  creating,
  onClose,
  onGenerate,
  companyName,
  country,
  subsidiary,
  selectedItems,
  totalHours,
  totalAmount,
}: {
  open: boolean;
  creating: boolean;
  onClose: () => void;
  onGenerate: () => void;
  companyName: string;
  country: string;
  subsidiary: string;
  selectedItems: SelectedItemRow[];
  totalHours: number;
  totalAmount: number;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Resumen de la propuesta">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-gray-600">Empresa</div>
            <div className="font-semibold">{companyName || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">País</div>
            <div className="font-semibold">{country || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Filial</div>
            <div className="font-semibold">{subsidiary || "—"}</div>
          </div>
        </div>

        <div className="overflow-x-auto border-2 rounded">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="table-th">Ítem</th>
                <th className="table-th w-24 text-right">Cant.</th>
                <th className="table-th w-32 text-right">Unitario</th>
                <th className="table-th w-24 text-right">Horas</th>
                <th className="table-th w-36 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((it, i) => (
                <tr key={i}>
                  <td className="table-td">{it.name}</td>
                  <td className="table-td text-right">{it.quantity}</td>
                  <td className="table-td text-right">{formatUSD(it.unitPrice)}</td>
                  <td className="table-td text-right">{it.devHours}</td>
                  <td className="table-td text-right">
                    {formatUSD(it.quantity * it.unitPrice)}
                  </td>
                </tr>
              ))}
              {selectedItems.length === 0 && (
                <tr>
                  <td className="table-td text-center text-gray-500" colSpan={5}>
                    No hay ítems seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          <div className="rounded-sm border-2 bg-white px-4 py-3 shadow-soft text-right">
            <div className="text-sm text-gray-500">Total mensual</div>
            <div className="text-xl font-semibold text-primary">
              {formatUSD(totalAmount)}
            </div>
          </div>
          <div className="rounded-sm border-2 bg-white px-4 py-3 shadow-soft text-right">
            <div className="text-sm text-gray-500">Horas de desarrollo</div>
            <div className="text-xl font-semibold">{totalHours}</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose} disabled={creating}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={onGenerate} disabled={creating}>
            {creating ? "Generando…" : "Generar documento"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
