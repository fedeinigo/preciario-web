"use client";

import * as React from "react";

const SUBSECTIONS = [
  {
    id: "scope",
    title: "Generador de Alcances",
    description:
      "Definí el contexto clave del cliente y prepará un alcance listo para revisar con el equipo.",
  },
  {
    id: "sheets",
    title: "Generador de Planillas",
    description:
      "Centralizá la información operativa en plantillas listas para compartir. Disponible muy pronto.",
  },
] as const;

const SCOPE_TYPES = ["Presales", "Postsales", "Presales+Postsales"] as const;

type SubsectionId = (typeof SUBSECTIONS)[number]["id"];

function SubsectionButton({
  subsection,
  active,
  onSelect,
}: {
  subsection: (typeof SUBSECTIONS)[number];
  active: boolean;
  onSelect: (id: SubsectionId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(subsection.id)}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/40 ${
        active
          ? "border-transparent bg-[rgb(var(--primary))] text-white shadow-lg"
          : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-[rgb(var(--primary))]/40 hover:text-slate-900"
      }`}
      aria-pressed={active}
    >
      <span className="block text-sm font-semibold leading-5">
        {subsection.title}
      </span>
      <span className="mt-1 block text-xs leading-relaxed opacity-80">
        {subsection.description}
      </span>
    </button>
  );
}

function ScopeGeneratorForm() {
  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h3 className="text-2xl font-semibold text-slate-900">Diseñá el alcance</h3>
        <p className="text-sm leading-relaxed text-slate-600">
          Completá los campos base para contextualizar el pedido. Esta información ayuda a ordenar la
          conversación con el cliente y asignar responsables internos.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Nombre de la empresa
          <input
            type="text"
            placeholder="Ej: Acme Corp"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Nombre de la Integración API
          <input
            type="text"
            placeholder="Ej: Zendesk - CRM"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2 md:max-w-sm">
          Tipo de Alcance
          <select
            defaultValue=""
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
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
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-5">
        <div className="max-w-xl text-sm text-slate-600">
          <p className="font-medium text-slate-800">¿Qué sucede al generar?</p>
          <p className="mt-1 leading-relaxed">
            El alcance se arma con un resumen ejecutivo, responsables sugeridos y próximos pasos.
            Podés ajustar el resultado antes de compartirlo con el equipo o con el cliente.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl bg-[rgb(var(--primary))] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[rgb(var(--primary))]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/40"
        >
          Generar Alcance
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-5 py-6 shadow-inner">
        <p className="text-sm font-medium text-slate-800">Previsualización</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Una vez generado, el alcance aparecerá aquí con todos los bloques listos para copiar o descargar.
        </p>
      </div>
    </section>
  );
}

function SheetsPlaceholder() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
        En desarrollo
      </span>
      <h3 className="text-xl font-semibold text-slate-900">Estamos preparando este módulo</h3>
      <p className="max-w-md text-sm leading-relaxed text-slate-600">
        Pronto vas a poder generar planillas operativas con indicadores clave, responsables y seguimiento
        automático. Mientras tanto, contanos qué necesitás para priorizarlo.
      </p>
    </section>
  );
}

export default function MapachePortalGeneratorPage() {
  const [activeSubsection, setActiveSubsection] = React.useState<SubsectionId>("scope");
  const activeMeta = React.useMemo(
    () => SUBSECTIONS.find((subsection) => subsection.id === activeSubsection) ?? SUBSECTIONS[0],
    [activeSubsection],
  );

  return (
    <div className="px-4 pb-12">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 shadow-sm">
            Portal Mapache
          </span>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Generador centralizado</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
            Simplificá la creación de materiales clave. Seleccioná el formulario que necesitás y completá los datos
            para avanzar con tu cliente sin fricción.
          </p>
        </header>

        <section className="rounded-3xl bg-white/90 shadow-xl ring-1 ring-slate-100 backdrop-blur">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-slate-900">{activeMeta.title}</h2>
              <p className="text-sm text-slate-500">{activeMeta.description}</p>
            </div>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Prototipo visual
            </span>
          </div>

          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[260px,1fr]">
            <nav className="space-y-3">
              {SUBSECTIONS.map((subsection) => (
                <SubsectionButton
                  key={subsection.id}
                  subsection={subsection}
                  active={subsection.id === activeSubsection}
                  onSelect={setActiveSubsection}
                />
              ))}
            </nav>

            {activeSubsection === "scope" ? <ScopeGeneratorForm /> : <SheetsPlaceholder />}
          </div>
        </section>
      </main>
    </div>
  );
}
