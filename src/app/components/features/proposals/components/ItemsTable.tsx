import { Pencil, Trash2 } from "lucide-react";
import { formatUSD } from "../lib/format";
import type { Item } from "../lib/types";

export function ItemsTable({
  items,
  isAdmin,
  onToggle,
  onChangeQty,
  onEdit,
  onDelete,
}: {
  items: Item[];
  isAdmin: boolean;
  onToggle: (item: Item, checked: boolean) => void;
  onChangeQty: (item: Item, qty: number) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}) {
  return (
    <div className="overflow-x-auto border rounded-sm">
      <table className="min-w-full bg-white">
        <thead className="sticky top-0 z-10">
          <tr className="bg-primary text-white">
            <th className="table-th">Categoría</th>
            <th className="table-th w-14 text-center">Sel.</th>
            <th className="table-th w-28">SKU</th>
            <th className="table-th">Ítem</th>
            <th className="table-th">Descripción</th>
            <th className="table-th w-28 text-center">Horas</th>
            <th className="table-th w-32 text-center">Cantidad</th>
            <th className="table-th w-36 text-right">Precio</th>
            <th className="table-th w-36 text-right">Subtotal</th>
            {isAdmin && <th className="table-th w-24 text-center">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id} className={idx % 2 ? "bg-primarySoft/40" : ""}>
              <td className="table-td text-[13px]">{item.category}</td>
              <td className="table-td text-center">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-primary cursor-pointer"
                  checked={!!item.selected}
                  onChange={(e) => onToggle(item, e.target.checked)}
                />
              </td>
              <td className="table-td">
                <span className="text-xs text-gray-500 font-mono">{item.sku}</span>
              </td>
              <td className="table-td max-w-[300px] truncate" title={item.name}>
                {item.name}
              </td>
              <td className="table-td max-w-[420px] truncate text-gray-700" title={item.description}>
                {item.description || "—"}
              </td>
              <td className="table-td text-center">{item.devHours}</td>
              <td className="table-td text-center">
                <input
                  type="number"
                  min={1}
                  className="input text-center"
                  value={item.quantity}
                  onChange={(e) => onChangeQty(item, Math.max(1, Number(e.target.value || 1)))}
                />
              </td>
              <td className="table-td text-right">{formatUSD(item.unitPrice)}</td>
              <td className="table-td text-right font-semibold">
                {formatUSD(item.quantity * item.unitPrice)}
              </td>
              {isAdmin && (
                <td className="table-td text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="btn-ghost" title="Editar" onClick={() => onEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="btn-ghost" title="Eliminar" onClick={() => onDelete(item)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td className="table-td text-center text-gray-500" colSpan={isAdmin ? 10 : 9}>
                No hay ítems que coincidan con los filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
