import Modal from "@/app/components/ui/Modal";
import Combobox from "@/app/components/ui/Combobox";
import { COUNTRY_NAMES, SUBSIDIARIES } from "../lib/catalogs";

export type WppKind = "marketing" | "utility" | "auth";

export function WhatsAppModal({
  open,
  kind,
  form,
  onChange,
  onApply,
  onClose,
  error,
  applying = false,
}: {
  open: boolean;
  kind: WppKind;
  form: { qty: number; destCountry: string; subsidiary: string };
  onChange: (next: { qty?: number; destCountry?: string; subsidiary?: string }) => void;
  onApply: () => void;
  onClose: () => void;
  error?: string;
  applying?: boolean;
}) {
  const kindLabel =
    kind === "marketing" ? "Marketing" : kind === "utility" ? "Utility" : "Authentication";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Calcular crédito WhatsApp"
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose} disabled={applying}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={onApply} disabled={applying}>
            {applying ? "Calculando…" : "Aplicar"}
          </button>
        </div>
      }
    >
      <div className="relative space-y-4">
        {/* Encabezado con badge */}
        <div className="flex items-center justify-between">
          <span className="chip">Tipo: {kindLabel}</span>
          <span className="text-xs text-muted">
            Define la cantidad de créditos y el destino para obtener el precio.
          </span>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Qty con sufijo */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">{kindLabel}</label>
            <div className="relative">
              <input
                className="input pr-16"
                type="number"
                min={0}
                value={form.qty}
                onChange={(e) => onChange({ qty: Math.max(0, Number(e.target.value || 0)) })}
                disabled={applying}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                créditos
              </span>
            </div>
            <p className="mt-1 text-[12px] text-muted">Cantidad mensual estimada.</p>
          </div>

          {/* País */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">País destino</label>
            <Combobox
              options={COUNTRY_NAMES}
              value={form.destCountry}
              onChange={(v) => onChange({ destCountry: v })}
              placeholder="Seleccione país"
            />
            <p className="mt-1 text-[12px] text-muted">Usado para el lookup de precios.</p>
          </div>

          {/* Filial */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Filial</label>
            <select
              className="select"
              value={form.subsidiary}
              onChange={(e) => onChange({ subsidiary: e.target.value })}
              disabled={applying}
            >
              <option value="">(usar seleccionada)</option>
              {SUBSIDIARIES.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[12px] text-muted">Opcional: sobrescribe la filial actual.</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Overlay de espera */}
        {applying && (
          <div className="absolute inset-0 rounded-sm bg-white/65 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-700">
              <span className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
              <span>Calculando precios…</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
