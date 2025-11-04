"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-500">
          <span className="mt-2 block h-1.5 w-1.5 rounded-full bg-[rgb(var(--primary))]" />
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
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
            placeholder="Ej: Acme S.A."
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          País
          <select
            name="country"
            value={form.country}
            onChange={handleFieldChange}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
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
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30 md:w-1/2"
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
              className="min-h-[140px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
              placeholder="Redactá la introducción del documento…"
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
              name="analysis"
              value={form.analysis}
              onChange={handleFieldChange}
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
              name="comparative"
              value={form.comparative}
              onChange={handleFieldChange}
              className="min-h-[130px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
              placeholder="Compartí métricas relevantes del sector…"
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
              name="recommendations"
              value={form.recommendations}
              onChange={handleFieldChange}
              className="min-h-[160px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
              placeholder="Detallá iniciativas y próximos pasos sugeridos…"
            />
          </label>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
            <HintList items={RECOMMENDATION_HINTS} />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-6 py-5 sm:flex-row">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!isFormValid || isGenerating}
          className="inline-flex items-center justify-center rounded-full bg-[rgb(var(--primary))] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[rgb(var(--primary))]/30 transition hover:bg-[rgb(var(--primary))]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--primary))] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {isGenerating ? "Generando…" : "Generar documento"}
        </button>
        <div className="text-sm text-slate-500">
          El resultado se mostrará en un modal con accesos directos para abrir o copiar el enlace.
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={modalStatus === "loading" ? () => undefined : closeModal}
        disableCloseOnBackdrop={modalStatus === "loading"}
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
                  <button type="button" className="btn-ghost" onClick={closeModal}>
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
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    Abrir documento
                  </a>
                  <Link
                    href="/marketing-portal?view=history"
                    className="btn-bar inline-flex items-center gap-2 !py-1"
                  >
                    Ver histórico
                  </Link>
                  <button
                    type="button"
                    className="btn-bar inline-flex items-center gap-2 !py-1"
                    onClick={() => handleCopyLink(docUrl)}
                  >
                    Copiar enlace
                  </button>
                  <button type="button" className="btn-ghost" onClick={closeModal}>
                    Cerrar
                  </button>
                </div>
              )
        }
      >
        {modalStatus === "loading" && (
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-[rgb(var(--primary))]" />
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
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
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
    <main className="min-h-[calc(100vh-var(--nav-h))] bg-gradient-to-b from-[#f5f7ff] via-[#f1f2f8] to-[#eef0f7] px-4 py-16 text-slate-900 md:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
        <div className="flex flex-col gap-4 border-b border-white/40 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-64 animate-pulse rounded-full bg-slate-200" />
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Beta interna
          </span>
        </div>
        <div className="w-full rounded-3xl bg-white/60 px-6 py-10 shadow-inner ring-1 ring-slate-100 backdrop-blur">
          <div className="h-72 w-full animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    </main>
  );
}

function MarketingPortalContent() {
  const searchParams = useSearchParams();
  const viewParam = searchParams?.get("view");
  const activeView = viewParam === "history" ? "history" : "generator";

  const tabDescription =
    activeView === "generator"
      ? "Completá los campos, sumá contexto relevante y generá un documento listo para compartir."
      : "Consulta y filtra los informes creados por tu equipo directamente desde este portal.";

  return (
    <main className="min-h-[calc(100vh-var(--nav-h))] bg-gradient-to-b from-[#f5f7ff] via-[#f1f2f8] to-[#eef0f7] px-4 py-16 text-slate-900 md:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
        <div className="flex flex-col gap-4 border-b border-white/40 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">
              {activeView === "generator" ? "Generador" : "Histórico"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{tabDescription}</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Beta interna
          </span>
        </div>

        {activeView === "generator" ? (
          <div className="w-full rounded-3xl bg-white/90 px-6 py-8 shadow-xl ring-1 ring-slate-100 backdrop-blur md:px-10 md:py-10">
            <GeneratorSection />
          </div>
        ) : (
          <MarketingHistory />
        )}
      </div>
    </main>
  );
}

export default function MarketingPortalPage() {
  return (
    <React.Suspense fallback={<MarketingPortalFallback />}>
      <MarketingPortalContent />
    </React.Suspense>
  );
}
