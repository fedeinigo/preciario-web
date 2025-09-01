import Modal from "@/app/components/ui/Modal";
import Combobox from "@/app/components/ui/Combobox";
import { COUNTRY_NAMES, SUBSIDIARIES } from "../lib/catalogs";

export type MinutesKind = "out" | "in";

export function MinutesModal({
  open,
  kind,
  form,
  onChange,
  onApply,
  onClose,
  error,
}: {
  open: boolean;
  kind: MinutesKind;
  form: { qty: number; destCountry: string; subsidiary: string };
  onChange: (next: { qty?: number; destCountry?: string; subsidiary?: string }) => void;
  onApply: () => void;
  onClose: () => void;
  error?: string;
}) {
  const label = kind === "out" ? "Salientes (min)" : "Entrantes (min)";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Calcular minutos de telefonía"
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={onApply}>Aplicar</button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">{label}</label>
          <input
            className="input"
            type="number"
            min={0}
            value={form.qty}
            onChange={(e) => onChange({ qty: Math.max(0, Number(e.target.value || 0)) })}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">País destino</label>
          <Combobox
            options={COUNTRY_NAMES}
            value={form.destCountry}
            onChange={(v) => onChange({ destCountry: v })}
            placeholder="Seleccione país"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Filial</label>
          <select
            className="select"
            value={form.subsidiary}
            onChange={(e) => onChange({ subsidiary: e.target.value })}
          >
            <option value="">(usar seleccionada)</option>
            {SUBSIDIARIES.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
    </Modal>
  );
}
