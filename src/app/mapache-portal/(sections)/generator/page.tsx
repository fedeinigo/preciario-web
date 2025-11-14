"use client";

import * as React from "react";

const SCOPE_TYPES = ["Presales", "Postsales", "Presales+Postsales"] as const;

function ScopeGeneratorForm() {
  return (
    <section className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-white/75">
          Nombre de la empresa
          <input
            type="text"
            placeholder="Ej: Acme Corp"
            className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/75">
          Nombre de la Integración API
          <input
            type="text"
            placeholder="Ej: Zendesk - CRM"
            className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/75 md:col-span-2">
          Tipo de Alcance
          <select
            defaultValue=""
            className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <option value="" disabled>
              Seleccioná una opción
            </option>
            {SCOPE_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/75">
          Cantidad de documentos
          <input
            type="number"
            min={0}
            placeholder="Ej: 12"
            className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/75">
          Cantidad de palabras promedio
          <input
            type="number"
            min={0}
            placeholder="Ej: 450"
            className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/75">
          Cantidad de conversaciones
          <input
            type="number"
            min={0}
            placeholder="Ej: 30"
            className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/75">
          Horas de desarrollo
          <input
            type="number"
            min={0}
            placeholder="Ej: 120"
            className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/75">
          Fee mensual
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-white/60">USD</span>
            <input
              type="number"
              min={0}
              placeholder="Ej: 2500"
              className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            />
          </div>
        </label>
      </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-5">
          <div className="max-w-xl text-sm text-white/70">
            <p className="font-medium text-white">¿Qué sucede al generar?</p>
            <p className="mt-1 leading-relaxed">
              El alcance se arma con un resumen ejecutivo, responsables sugeridos y próximos pasos. Podés ajustar
              el resultado antes de compartirlo con el equipo o con el cliente.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-gradient-to-r from-[#1f2031] to-[#2f3146] px-6 py-3 text-sm font-semibold text-white shadow-[0_30px_80px_rgba(2,6,23,0.6)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
          >
            Generar Alcance
          </button>
        </div>

      <div className="rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.04] to-white/[0.02] px-6 py-6 text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        <p className="text-sm font-medium text-white">Previsualización</p>
        <p className="mt-2 text-sm leading-relaxed">
          Una vez generado, el alcance aparecerá aquí con todos los bloques listos para copiar o descargar.
        </p>
      </div>
    </section>
  );
}

export default function MapachePortalGeneratorPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0a0e16] via-[#090c1a] to-[#05060d] px-6 py-12">
      <main className="mx-auto w-full max-w-[1100px]">
        <section className="w-full rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_100px_rgba(2,6,23,0.85)] backdrop-blur-3xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.35em] text-white/50">Generador de Alcance</span>
              <p className="text-sm text-white/60">
                Definí el contexto del cliente, cargá la información del proyecto y obtené una propuesta lista para
                enviar al equipo.
              </p>
            </div>
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs uppercase tracking-[0.4em] text-white/60">
              Prototipo visual
            </div>
          </div>

          <div className="mt-8">
            <ScopeGeneratorForm />
          </div>
        </section>
      </main>
    </div>
  );
}
