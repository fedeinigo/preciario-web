"use client";

import Modal from "@/app/components/ui/Modal";
import Combobox from "@/app/components/ui/Combobox";

/** === Tipos expuestos para que Generator.tsx los importe === */
export type WppKind = "marketing" | "utility" | "auth";
export type WppForm = { qty: number; destCountry: string };

/** Lista PROPIA de países destino (no la del generador) */
const DESTINATION_COUNTRIES: string[] = [
  "Argentina",
  "Alemania",
  "Aruba",
  "Belgica",
  "Bolivia",
  "Brasil",
  "Canadá",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Ecuador",
  "Egipto",
  "El Salvador",
  "España",
  "Estados Unidos",
  "Francia",
  "Guatemala",
  "Haití",
  "Honduras",
  "India",
  "Indonesia",
  "Israel",
  "Italia",
  "Jamaica",
  "Malasia",
  "México",
  "Nicaragua",
  "Nigeria",
  "Noruega",
  "Países Bajos",
  "Pakistán",
  "Panamá",
  "Paraguay",
  "Perú",
  "Polonia",
  "Puerto Rico",
  "Reino Unido",
  "República Dominicana",
  "Rumania",
  "Rusia",
  "Arabia Saudita",
  "Suecia",
  "Suiza",
  "Turquía",
  "Uruguay",
  "Venezuela",
  "Emiratos Árabes Unidos",
  "Resto de Asia",
  "Resto de Europa",
  "Resto de Africa",
  "Resto de America",
  "Other",
];

export function WhatsAppModal({
  open,
  kind,
  form,
  billingSubsidiary,
  onChange,
  onApply,
  onClose,
  error,
  applying = false,
}: {
  open: boolean;
  kind: WppKind;
  form: WppForm;
  /** Filial seteada por el país de la propuesta (solo lectura en el modal) */
  billingSubsidiary: string;
  onChange: (next: Partial<WppForm>) => void;
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

          {/* País destino (lista propia) */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">País destino</label>
            <Combobox
              options={DESTINATION_COUNTRIES}
              value={form.destCountry}
              onChange={(v) => onChange({ destCountry: v })}
              placeholder="Seleccione país"
            />
            <p className="mt-1 text-[12px] text-muted">Usado para el lookup de precios.</p>
          </div>

          {/* Filial de facturación (solo lectura) */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Filial de facturación</label>
            <input className="input" value={billingSubsidiary || "—"} readOnly />
            <p className="mt-1 text-[12px] text-muted">Determinada por el país de la propuesta.</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Overlay de espera (tapa todo el modal content) */}
        {applying && (
          <div className="absolute inset-0 z-[60] rounded-sm bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
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
