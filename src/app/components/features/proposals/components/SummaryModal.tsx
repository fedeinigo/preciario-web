import Modal from "@/app/components/ui/Modal";
import { formatUSD } from "../lib/format";
import type { Item } from "../lib/types";

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
  selectedItems: Item[];
  totalHours: number;
  totalAmount: number;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Resumen de la Propuesta"
      footer={
        <div className="flex justify-end gap-3">
          <button className="btn-ghost" onClick={onClose} disabled={creating}>
            Cerrar
          </button>
          <button className="btn-primary" onClick={onGenerate} disabled={creating}>
            {creating ? "Generando…" : "Generar Documento"}
          </button>
        </div>
      }
    >
      <div className="mb-6">
        <h4 className="font-semibold mb-3">Información General</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Info label="Empresa" value={companyName} />
          <Info label="País" value={country} />
          <Info label="Filial" value={subsidiary} />
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold mb-3">Ítems Seleccionados</h4>
        <div className="overflow-x-auto border rounded-sm">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-primary text-white">
                <th className="table-th">Categoría</th>
                <th className="table-th">SKU</th>
                <th className="table-th">Ítem</th>
                <th className="table-th w-24 text-center">Horas</th>
                <th className="table-th w-24 text-center">Cant.</th>
                <th className="table-th w-36 text-right">Precio Unit.</th>
                <th className="table-th w-32 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((it) => (
                <tr key={it.id}>
                  <td className="table-td">{it.category}</td>
                  <td className="table-td">
                    <span className="text-gray-500 font-mono text-xs">{it.sku}</span>
                  </td>
                  <td className="table-td">{it.name}</td>
                  <td className="table-td text-center">{it.devHours}</td>
                  <td className="table-td text-center">{it.quantity}</td>
                  <td className="table-td text-right">{formatUSD(it.unitPrice)}</td>
                  <td className="table-td text-right font-semibold">
                    {formatUSD(it.quantity * it.unitPrice)}
                  </td>
                </tr>
              ))}
              {selectedItems.length === 0 && (
                <tr>
                  <td className="table-td text-center text-gray-500" colSpan={7}>
                    No seleccionaste ítems.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-stretch sm:justify-between gap-3">
          <Total label="Horas de desarrollo" value={String(totalHours)} />
          <Total label="Total OneShot" value={formatUSD(totalHours * 50)} />
          <Total label="Total mensual" value={formatUSD(totalAmount)} />
        </div>
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border bg-white px-4 py-3 shadow-soft">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-[15px] font-medium text-gray-900 truncate">{value}</div>
    </div>
  );
}
function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border bg-white px-5 py-3 shadow-soft text-right">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-[22px] font-semibold text-primary">{value}</div>
    </div>
  );
}
