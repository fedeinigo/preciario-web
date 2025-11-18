"use client";

import * as React from "react";
import Link from "next/link";
import MarketingHistory from "./History";
import Modal from "@/app/components/ui/Modal";
import { toast } from "@/app/components/ui/toast";
import { copyToClipboard } from "@/app/components/features/proposals/lib/clipboard";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

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

type MarketingPortalView = "generator" | "history";

type FormState = {
  companyName: string;
  country: string;
  segment: string;
  introduction: string;
  analysis: string;
  comparative: string;
  recommendations: string;
};

function HintList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-600">
          <span className="mt-2 block h-1.5 w-1.5 rounded-full bg-[rgb(var(--marketing-primary))]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function GeneratorSection() {
  const [form, setForm] = React.useState<FormState>({
    companyName: "",
    country: "",
    segment: "",
    introduction: "",
    analysis: "",
    comparative: "",
    recommendations: "",
  });
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [docUrl, setDocUrl] = React.useState<string | null>(null);
  const [docName, setDocName] = React.useState<string | null>(null);
  const [reportId, setReportId] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalStatus, setModalStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [modalError, setModalError] = React.useState<string | null>(null);

  const handleFieldChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const isFormValid = React.useMemo(() => {
    return (
      form.companyName.trim().length > 0 &&
      form.segment.trim().length > 0 &&
      form.introduction.trim().length > 0 &&
      form.analysis.trim().length > 0 &&
      form.comparative.trim().length > 0 &&
      form.recommendations.trim().length > 0
    );
  }, [form]);

  const handleGenerate = React.useCallback(async () => {
    if (!isFormValid || isGenerating) return;

    setIsGenerating(true);
    setDocUrl(null);
    setDocName(null);
    setReportId(null);
    setModalOpen(true);
    setModalStatus("loading");
    setModalError(null);

    try {
      const res = await fetch("/api/marketing/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          segment: form.segment.trim(),
          country: form.country.trim(),
          introduction: form.introduction.trim(),
          analysis: form.analysis.trim(),
          comparative: form.comparative.trim(),
          recommendations: form.recommendations.trim(),
        }),
      });

      let data: { error?: string; url?: string; name?: string; reportId?: string } | null = null;
      try {
        data = (await res.json()) as { error?: string; url?: string; name?: string; reportId?: string };
      } catch {
        data = null;
      }

      if (!res.ok || !data?.url) {
        const message =
          data?.error ??
          (res.status === 401
            ? "No autorizado. Revisá tu sesión y vuelve a intentarlo."
            : "No se pudo generar el documento. Probá nuevamente.");
        setModalStatus("error");
        setModalError(message);
        return;
      }

      setDocUrl(data.url);
      setDocName(data.name ?? null);
      setReportId(data.reportId ?? null);
      setModalStatus("success");
      setModalError(null);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("marketing-history:refresh"));
      }
    } catch (err) {
      setModalStatus("error");
      setModalError(err instanceof Error ? err.message : "Error inesperado al generar el documento.");
    } finally {
      setIsGenerating(false);
    }
  }, [form, isFormValid, isGenerating]);

  const handleCopyLink = React.useCallback(
    async (url: string | null) => {
      if (!url) return;
      const success = await copyToClipboard(url);
      if (success) toast.success("Enlace copiado al portapapeles");
      else toast.error("No se pudo copiar el enlace");
    },
    [],
  );

  const closeModal = React.useCallback(() => {
    setModalOpen(false);
    setModalStatus("idle");
  }, []);

  const fieldClass =
    "w-full rounded-2xl border border-[rgb(var(--marketing-ring))]/70 bg-white/90 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[rgb(var(--marketing-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--marketing-primary))]/25";
  const textAreaClass =
    "rounded-3xl border border-[rgb(var(--marketing-ring))]/70 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[rgb(var(--marketing-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--marketing-primary))]/25";
  const hintCardClass =
    "rounded-3xl border border-[rgb(var(--marketing-ring))]/60 bg-[rgb(var(--marketing-surface-strong))]/80 px-4 py-3 shadow-inner shadow-sky-100/40";
  const primaryActionClass =
    "inline-flex items-center gap-2 rounded-full bg-[rgb(var(--marketing-primary))] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[rgb(var(--marketing-primary))]/30 transition hover:bg-[rgb(var(--marketing-primary))]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--marketing-primary))]";
  const secondaryActionClass =
    "inline-flex items-center gap-2 rounded-full border border-[rgb(var(--marketing-ring))] bg-white/90 px-4 py-2 text-sm font-semibold text-[rgb(var(--marketing-primary))] transition hover:bg-[rgb(var(--marketing-primary))]/10";

  return (
    <div className="space-y-10">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Nombre de la empresa
          <input
            type="text"
            name="companyName"
            value={form.companyName}
            onChange={handleFieldChange}
            className={fieldClass}
            placeholder="Ej: Acme S.A."
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          País
          <select
            name="country"
            value={form.country}
            onChange={handleFieldChange}
            className={fieldClass}
          >
            <option value="">Seleccioná un país</option>
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
            name="segment"
            value={form.segment}
            onChange={handleFieldChange}
            className={`${fieldClass} md:w-1/2`}
          >
            <option value="">Seleccioná un segmento</option>
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
              name="introduction"
              value={form.introduction}
              onChange={handleFieldChange}
              className={`${textAreaClass} min-h-[140px]`}
              placeholder="Redactá la introducción del documento…"
            />
          </label>
          <div className={hintCardClass}>
            <HintList items={INTRO_HINTS} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Análisis de la empresa
            <textarea
              rows={6}
              name="analysis"
              value={form.analysis}
              onChange={handleFieldChange}
              className={`${textAreaClass} min-h-[160px]`}
              placeholder="Describe hallazgos clave, contexto y oportunidades…"
            />
          </label>
          <div className={hintCardClass}>
            <HintList items={ANALYSIS_HINTS} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Benchmark / comparativa sectorial
            <textarea
              rows={4}
              name="comparative"
              value={form.comparative}
              onChange={handleFieldChange}
              className={`${textAreaClass} min-h-[130px]`}
              placeholder="Compartí métricas relevantes del sector…"
            />
          </label>
          <div className={hintCardClass}>
            <HintList items={BENCHMARK_HINTS} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Recomendaciones personalizadas
            <textarea
              rows={6}
              name="recommendations"
              value={form.recommendations}
              onChange={handleFieldChange}
              className={`${textAreaClass} min-h-[160px]`}
              placeholder="Detallá iniciativas y próximos pasos sugeridos…"
            />
          </label>
          <div className={hintCardClass}>
            <HintList items={RECOMMENDATION_HINTS} />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-[rgb(var(--marketing-ring))]/70 bg-[rgb(var(--marketing-surface-strong))]/80 px-6 py-5 text-slate-700 shadow-inner shadow-sky-100/40 sm:flex-row">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!isFormValid || isGenerating}
          className="inline-flex items-center justify-center rounded-full bg-[rgb(var(--marketing-primary))] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[rgb(var(--marketing-primary))]/30 transition hover:bg-[rgb(var(--marketing-primary))]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--marketing-primary))] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {isGenerating ? "Generando…" : "Generar documento"}
        </button>
        <div className="text-sm text-slate-600">
          El resultado se mostrará en un modal con accesos directos para abrir o copiar el enlace.
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={modalStatus === "loading" ? () => undefined : closeModal}
        disableCloseOnBackdrop={modalStatus === "loading"}
        containerClassName="marketing-portal-theme"
        panelClassName="border-[rgb(var(--marketing-ring))]/80 bg-white/95 text-slate-900 shadow-[0_35px_110px_rgba(15,23,42,0.25)]"
        headerClassName="bg-[rgb(var(--marketing-card))] border-b border-[rgb(var(--marketing-ring))]/60 text-slate-900"
        titleClassName="text-lg font-semibold text-[rgb(var(--marketing-primary-strong))]"
        backdropClassName="bg-[rgba(12,74,110,0.35)]"
        title={
          modalStatus === "success"
            ? "Informe generado"
            : modalStatus === "error"
            ? "No se pudo generar el informe"
            : "Generando informe"
        }
        footer={
          modalStatus === "loading"
            ? null
            : modalStatus === "error"
              ? (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-[rgb(var(--marketing-primary))] transition hover:bg-[rgb(var(--marketing-primary))]/10"
                    onClick={closeModal}
                  >
                    Cerrar
                  </button>
                </div>
              )
              : (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <a
                    href={docUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={primaryActionClass}
                  >
                    Abrir documento
                  </a>
                  <Link
                    href="/portal/marketing/history"
                    className={secondaryActionClass}
                  >
                    Ver histórico
                  </Link>
                  <button
                    type="button"
                    className={secondaryActionClass}
                    onClick={() => handleCopyLink(docUrl)}
                  >
                    Copiar enlace
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-slate-500 transition hover:text-[rgb(var(--marketing-primary))]"
                    onClick={closeModal}
                  >
                    Cerrar
                  </button>
                </div>
              )
        }
      >
        {modalStatus === "loading" && (
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-[rgb(var(--marketing-primary))]" />
            <span>Estamos generando tu documento. Esto puede tardar unos segundos…</span>
          </div>
        )}

        {modalStatus === "error" && (
          <div className="flex items-start gap-3 text-sm text-slate-700">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p>{modalError ?? "Ocurrió un error inesperado al generar el documento."}</p>
              <p className="mt-2 text-xs text-slate-500">
                Revisá tu conexión o volv\u00e9 a iniciar sesión antes de intentar nuevamente.
              </p>
            </div>
          </div>
        )}

        {modalStatus === "success" && (
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-[rgb(var(--marketing-primary))]" />
              <div>
                <p className="font-semibold text-slate-900">{docName ?? "Documento listo"}</p>
                <p className="text-xs text-slate-500">
                  El archivo se guardó en tu Google Drive con el nombre indicado. Podés abrirlo o compartirlo desde aquí.
                </p>
              </div>
            </div>
            {reportId && (
              <p className="text-xs text-slate-400">
                ID interno: {reportId}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function MarketingPortalFallback() {
  return (
    <main className="marketing-portal-theme marketing-portal-surface relative isolate overflow-hidden min-h-[calc(100vh-var(--nav-h))] px-4 py-16 text-slate-900 md:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-10 h-64 w-64 rounded-full bg-[#74c1ff]/40 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-48 w-96 rounded-[999px] bg-[#a7d8ff]/40 blur-[120px]" />
      </div>
      <div className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-10">
        <div className="marketing-portal-hero flex flex-col gap-4 rounded-[28px] border border-[rgb(var(--marketing-ring))]/80 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-64 animate-pulse rounded-full bg-slate-200" />
          </div>
          <span className="inline-flex items-center rounded-full border border-[rgb(var(--marketing-primary))]/30 bg-[rgb(var(--marketing-primary))]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--marketing-primary))]">
            Beta interna
          </span>
        </div>
        <div className="w-full rounded-[32px] bg-[rgb(var(--marketing-card))]/80 px-6 py-10 shadow-[0_25px_80px_rgba(15,23,42,0.12)] ring-1 ring-[rgb(var(--marketing-ring))]/70 backdrop-blur">
          <div className="h-72 w-full animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    </main>
  );
}

function MarketingPortalContent({ view }: { view: MarketingPortalView }) {
  const tabDescription =
    view === "generator"
      ? "Completá los campos, sumá contexto relevante y generá un documento listo para compartir."
      : "Consulta y filtra los informes creados por tu equipo directamente desde este portal.";

  return (
    <main className="marketing-portal-theme marketing-portal-surface min-h-[calc(100vh-var(--nav-h))] px-4 py-16 text-slate-900 md:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
        <div className="marketing-portal-hero flex flex-col gap-4 rounded-[28px] border border-[rgb(var(--marketing-ring))]/80 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[rgb(var(--marketing-muted))]">
              Portal marketing
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {view === "generator" ? "Generador" : "Histórico"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{tabDescription}</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-[rgb(var(--marketing-primary))]/30 bg-[rgb(var(--marketing-primary))]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--marketing-primary))]">
            Beta interna
          </span>
        </div>

        {view === "generator" ? (
          <div className="w-full rounded-[32px] bg-[rgb(var(--marketing-card))] px-6 py-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] ring-1 ring-[rgb(var(--marketing-ring))]/70 backdrop-blur md:px-10 md:py-10">
            <GeneratorSection />
          </div>
        ) : (
          <div className="w-full rounded-[32px] bg-[rgb(var(--marketing-card))] px-4 py-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)] ring-1 ring-[rgb(var(--marketing-ring))]/70 backdrop-blur md:px-8 md:py-8">
            <MarketingHistory />
          </div>
        )}
      </div>
    </main>
  );
}

export default function MarketingPortalClient({ initialView }: { initialView: MarketingPortalView }) {
  return (
    <React.Suspense fallback={<MarketingPortalFallback />}>
      <MarketingPortalContent view={initialView} />
    </React.Suspense>
  );
}
