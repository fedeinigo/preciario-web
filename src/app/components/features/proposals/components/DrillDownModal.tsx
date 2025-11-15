import React from "react";
import { X } from "lucide-react";
import Modal from "@/app/components/ui/Modal";

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Array<Record<string, unknown>>;
  columns: Array<{ key: string; label: string; format?: (value: unknown) => string }>;
}

export function DrillDownModal({ isOpen, onClose, title, data, columns }: DrillDownModalProps) {
  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} variant="default">
      <div className="relative max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-purple-50 to-slate-50 px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {data.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-slate-400">
              No hay datos disponibles
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data.map((row, idx) => (
                    <tr key={idx} className="transition hover:bg-slate-50">
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-slate-700">
                          {col.format ? col.format(row[col.key]) : String(row[col.key] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50 px-6 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-medium text-purple-700 transition hover:border-purple-300 hover:bg-purple-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
