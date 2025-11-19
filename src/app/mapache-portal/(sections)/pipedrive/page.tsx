"use client";

import * as React from "react";

import { Loader2 } from "lucide-react";

import Modal from "@/app/components/ui/Modal";
import { toast } from "@/app/components/ui/toast";
import type { PipedriveDealSummary } from "@/types/pipedrive";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});
const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type ApiResponse =
  | { ok: true; deals: PipedriveDealSummary[] }
  | { ok: false; error?: string };

const ACTION_BUTTON_CLASSES =
  "rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/50 hover:text-white";

export default function MapachePortalPipedrivePage() {
  const [deals, setDeals] = React.useState<PipedriveDealSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date | null>(null);
  const [selectedDeal, setSelectedDeal] = React.useState<PipedriveDealSummary | null>(null);

  const handleRefresh = React.useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/pipedrive/deals");
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error("Error de red");
      }
      if (!payload.ok) {
        throw new Error(payload.error ?? "Respuesta inválida");
      }
      setDeals(payload.deals ?? []);
      setLastSyncedAt(new Date());
      toast.success("Deals actualizados");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`No se pudieron cargar los deals: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const lastSyncedLabel = lastSyncedAt ? DATE_FORMATTER.format(lastSyncedAt) : "—";

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0a0e16] via-[#090c1a] to-[#05060d] px-6 py-12">
      <main className="mx-auto w-full max-w-[1200px] space-y-8">
        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_100px_rgba(2,6,23,0.85)] backdrop-blur-3xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Pipedrive</p>
              <h1 className="text-2xl font-semibold text-white">Deals asignados</h1>
              <p className="text-sm text-white/60">
                Actualiza la lista para ver los negocios que tienen tu nombre en el campo “Mapache Asignado”.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                Última actualización: {lastSyncedLabel}
              </span>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white px-4 py-2 text-xs font-semibold tracking-[0.35em] text-[#0f1b2a] transition hover:border-white hover:bg-white/90 disabled:cursor-wait disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#0f1b2a]" aria-hidden="true" />
                ) : null}
                Actualizar
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-white">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.4em] text-white/50">
                    <th className="px-4 py-4">Nombre deal</th>
                    <th className="px-4 py-4">Etapa</th>
                    <th className="px-4 py-4">Owner comercial</th>
                    <th className="px-4 py-4">Valor</th>
                    <th className="px-4 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-white/60">
                        Presiona “Actualizar” para sincronizar los deals asignados a tu nombre.
                      </td>
                    </tr>
                  ) : (
                    deals.map((deal) => (
                      <tr
                        key={deal.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedDeal(deal)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedDeal(deal);
                          }
                        }}
                        className="cursor-pointer border-t border-white/5 transition hover:bg-white/5 focus:bg-white/5 focus-visible:outline-none"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-white">{deal.title || "Sin título"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white/80">{deal.stageName ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white/80">{deal.ownerName ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white/80">{formatCurrency(deal.value)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {["Ver en pipe", "Ver propuesta", "Ver alcance"].map((label) => (
                              <button
                                key={label}
                                type="button"
                                onClick={(event) => event.stopPropagation()}
                                className={ACTION_BUTTON_CLASSES}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <Modal
        open={Boolean(selectedDeal)}
        onClose={() => setSelectedDeal(null)}
        title={selectedDeal?.title ?? "Detalles del deal"}
        panelWidthClassName="max-w-3xl"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedDeal(null)}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/20"
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedDeal ? (
          <dl className="grid gap-4 text-sm text-white/80 sm:grid-cols-2">
            <DetailRow label="ID" value={`#${selectedDeal.id}`} />
            <DetailRow label="Nombre del negocio" value={selectedDeal.title || "—"} />
            <DetailRow label="Etapa del funnel" value={selectedDeal.stageName ?? "—"} />
            <DetailRow label="Owner comercial" value={selectedDeal.ownerName ?? "—"} />
            <DetailRow label="Valor" value={formatCurrency(selectedDeal.value)} />
            <DetailRow label="Fee mensual" value={formatCurrency(selectedDeal.feeMensual)} />
            <DetailRow label="Mapache asignado" value={selectedDeal.mapacheAssigned ?? "—"} />
            <DetailRow label="Propuesta comercial" value={selectedDeal.proposalUrl ?? "—"} />
            <DetailRow label="Doc contexto deal" value={selectedDeal.docContextDeal ?? "—"} />
            <DetailRow
              label="Ver en Pipedrive"
              value={
                <a
                  href={selectedDeal.dealUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80 underline"
                >
                  Abrir en Pipedrive
                </a>
              }
            />
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return CURRENCY_FORMATTER.format(value);
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[11px] uppercase tracking-[0.35em] text-white/50">{label}</dt>
      <dd className="text-sm text-white">{value}</dd>
    </div>
  );
}
