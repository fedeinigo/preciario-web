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
      className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
        active
          ? "border-white/30 bg-white/10 text-white shadow-[0_25px_80px_rgba(2,6,23,0.55)]"
          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white/80"
      }`}
      aria-pressed={active}
    >
      <span className="block text-sm font-semibold leading-5 text-current">
        {subsection.title}
      </span>
      <span className="mt-1 block text-xs leading-relaxed opacity-80 transition-opacity duration-200 group-hover:opacity-100">
        {subsection.description}
      </span>
    </button>
  );
}

function ScopeGeneratorForm() {
  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <h3 className="text-2xl font-semibold text-white">Diseñá el alcance</h3>
        <p className="max-w-2xl text-sm leading-relaxed text-white/70">
          Completá los campos base para contextualizar el pedido. Esta información ayuda a ordenar la
          conversación con el cliente y asignar responsables internos.
        </p>
      </header>

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

        <label className="flex flex-col gap-2 text-sm font-medium text-white/75 md:col-span-2 md:max-w-sm">
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
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-5">
        <div className="max-w-xl text-sm text-white/70">
          <p className="font-medium text-white">¿Qué sucede al generar?</p>
          <p className="mt-1 leading-relaxed">
            El alcance se arma con un resumen ejecutivo, responsables sugeridos y próximos pasos.
            Podés ajustar el resultado antes de compartirlo con el equipo o con el cliente.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-[rgba(255,255,255,0.85)] px-5 py-2.5 text-sm font-semibold text-[rgb(17,19,27)] shadow-[0_22px_70px_rgba(2,6,23,0.55)] transition hover:border-white/40 hover:bg-[rgba(255,255,255,0.92)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Generar Alcance
        </button>
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-6 text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <p className="text-sm font-medium text-white">Previsualización</p>
        <p className="mt-2 text-sm leading-relaxed">
          Una vez generado, el alcance aparecerá aquí con todos los bloques listos para copiar o descargar.
        </p>
      </div>
    </section>
  );
}

function SheetsPlaceholder() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-16 text-center text-white/70">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">
        En desarrollo
      </span>
      <h3 className="text-xl font-semibold text-white">Estamos preparando este módulo</h3>
      <p className="max-w-md text-sm leading-relaxed">
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
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
            Portal Mapache
          </span>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">Generador centralizado</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            Simplificá la creación de materiales clave. Seleccioná el formulario que necesitás y completá los datos
            para avanzar con tu cliente sin fricción.
          </p>
        </header>

        <section className="rounded-[36px] border border-white/10 bg-white/[0.03] shadow-[0_60px_160px_rgba(2,6,23,0.6)] backdrop-blur-2xl">
          <div className="flex flex-col gap-4 border-b border-white/10 px-8 py-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold text-white">{activeMeta.title}</h2>
              <p className="text-sm text-white/65">{activeMeta.description}</p>
            </div>
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-white/60">
              Prototipo visual
            </span>
          </div>

          <div className="grid gap-8 px-8 py-10 lg:grid-cols-[260px,1fr]">
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
