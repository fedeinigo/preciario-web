"use client";

import * as React from "react";

const COUNTRIES = [
  "Argentina",
  "México",
  "Perú",
  "Chile",
  "Colombia",
  "Brasil (Portugués)",
] as const;

const SEGMENTS = [
  "Educación",
  "Salud",
  "E-commerce",
  "Seguros",
  "Banco / Finanzas",
] as const;

const INTRO_HINTS = [
  "Agradecé la apertura de nuestros correos.",
  "Explicá por qué compartimos el análisis (tendencias del sector, benchmarks, insights internos).",
  "Reforzá que el objetivo es aportar valor, no vender.",
] as const;

const ANALYSIS_HINTS = [
  "Resumen público de la empresa: sector, país, tamaño, clientes destacados.",
  "Desafíos detectados: volumen de tickets, satisfacción del cliente, soporte digital, etc.",
  "Insights rápidos del segmento (por ejemplo: “En educación, el 40% de los alumnos prefiere soporte omnicanal”).",
] as const;

const BENCHMARK_HINTS = [
  "Destacá una métrica relevante del sector.",
  "Comparála con mejores prácticas o líderes de la industria.",
] as const;

const RECOMMENDATION_HINTS = [
  "Detallá recomendaciones accionables para la empresa.",
  "Orientalas a mejoras en Customer Experience / Customer Success.",
  "Conectá con casos de empresas similares y los resultados que obtuvieron.",
] as const;

function HintList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-500">
          <span className="mt-2 block h-1.5 w-1.5 rounded-full bg-[rgb(var(--primary))]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MarketingPortalPage() {
  const [confirmationVisible, setConfirmationVisible] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  const handleGenerate = React.useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    setConfirmationVisible(true);
    timeoutRef.current = window.setTimeout(() => {
      setConfirmationVisible(false);
      timeoutRef.current = null;
    }, 4000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-[calc(100vh-var(--nav-h))] bg-gradient-to-b from-[#f5f7ff] via-[#f1f2f8] to-[#eef0f7] px-4 py-16 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="space-y-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 shadow-sm">
            Portal Marketing
          </span>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Bienvenido al Portal Marketing
          </h1>
          <p className="mx-auto max-w-2xl text-sm md:text-base text-slate-600">
            Prepará un entregable claro, elegante y alineado a tu audiencia. Completá los campos,
            sumá contexto relevante y generá un documento listo para compartir.
          </p>
        </header>

        <section className="rounded-3xl bg-white/90 shadow-xl ring-1 ring-slate-100 backdrop-blur">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Generador</h2>
              <p className="mt-1 text-sm text-slate-500">
                Define los datos base del cliente y redactá cada bloque con foco en valor.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Beta interna
            </span>
          </div>

          <div className="space-y-10 px-6 py-8">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Nombre de la empresa
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
                  placeholder="Ej: Acme S.A."
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                País
                <select
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
                >
                  <option value="" disabled>
                    Seleccione un país
                  </option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                Segmento
                <select
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30 md:w-1/2"
                >
                  <option value="" disabled>
                    Seleccione un segmento
                  </option>
                  {SEGMENTS.map((segment) => (
                    <option key={segment} value={segment}>
                      {segment}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Introducción
                  <textarea
                    rows={5}
                    className="min-h-[140px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
                    placeholder="Redacta la introducción del documento…"
                  />
                </label>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <HintList items={INTRO_HINTS} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Análisis de la empresa
                  <textarea
                    rows={6}
                    className="min-h-[160px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
                    placeholder="Describe hallazgos clave, contexto y oportunidades…"
                  />
                </label>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <HintList items={ANALYSIS_HINTS} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Benchmark / comparativa sectorial
                  <textarea
                    rows={4}
                    className="min-h-[130px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
                    placeholder="Comparte métricas relevantes del sector…"
                  />
                </label>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <HintList items={BENCHMARK_HINTS} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Recomendaciones personalizadas
                  <textarea
                    rows={6}
                    className="min-h-[160px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
                    placeholder="Detallá iniciativas y próximos pasos sugeridos…"
                  />
                </label>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <HintList items={RECOMMENDATION_HINTS} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:flex-row">
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center justify-center rounded-full bg-[rgb(var(--primary))] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[rgb(var(--primary))]/30 transition hover:bg-[rgb(var(--primary))]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--primary))]"
            >
              Generar documento
            </button>
            <div className="text-sm text-slate-500" aria-live="polite">
              {confirmationVisible ? (
                <span className="font-medium text-[rgb(var(--primary))]">
                  Documento generado (simulado). Podés seguir editando.
                </span>
              ) : (
                <span>
                  Al publicar, podrás exportar este contenido como presentación o PDF.
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
