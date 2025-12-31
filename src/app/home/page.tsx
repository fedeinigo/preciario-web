import Link from "next/link";
import { Lock, FileText, Users, Sparkles, ArrowRight, BarChart3, Target } from "lucide-react";

import AuthLoginCard from "@/app/components/AuthLoginCard";
import { auth } from "@/lib/auth";
import type { PortalAccessId } from "@/constants/portals";

type PortalCard = {
  id: PortalAccessId;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  accentFrom: string;
  accentTo: string;
  iconBg: string;
  iconColor: string;
  hoverBorder: string;
  glowColor: string;
};

const PORTAL_CARDS: PortalCard[] = [
  {
    id: "direct",
    title: "Portal Directo",
    subtitle: "Ventas directas",
    description: "Herramientas completas para el equipo de ventas directas.",
    href: "/portal/directo",
    icon: FileText,
    features: ["Generador de propuestas", "Historial", "Estadisticas", "Objetivos"],
    accentFrom: "from-purple-600",
    accentTo: "to-violet-600",
    iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
    iconColor: "text-white",
    hoverBorder: "hover:border-purple-300",
    glowColor: "group-hover:shadow-purple-500/25",
  },
  {
    id: "mapache",
    title: "Portal Mapache",
    subtitle: "Preventa tecnica",
    description: "Gestion integral del equipo de preventa y metricas.",
    href: "/portal/mapache",
    icon: Users,
    features: ["Pipedrive sync", "Objetivos de equipo", "Analytics"],
    accentFrom: "from-cyan-500",
    accentTo: "to-blue-600",
    iconBg: "bg-gradient-to-br from-cyan-500 to-blue-600",
    iconColor: "text-white",
    hoverBorder: "hover:border-cyan-300",
    glowColor: "group-hover:shadow-cyan-500/25",
  },
];

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    return (
      <div className="flex min-h-[calc(100vh-var(--nav-h))] items-center justify-center px-4 py-10">
        <AuthLoginCard />
      </div>
    );
  }

  const accessiblePortals = new Set<PortalAccessId>(session.user?.portals ?? ["direct"]);
  const userName = session.user?.name?.split(" ")[0] || "Usuario";
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Buenos dias" : currentHour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <section className="relative min-h-[calc(100vh-var(--nav-h))] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-purple-50/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-200/40 via-violet-200/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-indigo-200/30 via-blue-200/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-purple-100/40 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200/60 bg-white/80 px-4 py-2 text-sm font-medium text-purple-700 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-purple-500" />
            {greeting}, {userName}
          </div>
          <h1 className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Portal Wise CX
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-slate-600">
            Selecciona tu espacio de trabajo para acceder a todas las herramientas.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {PORTAL_CARDS.map((portal) => {
            const isEnabled = accessiblePortals.has(portal.id);
            const Icon = portal.icon;

            const cardContent = (
              <div
                className={`group relative overflow-hidden rounded-3xl border bg-white/80 backdrop-blur-sm transition-all duration-300 ${
                  isEnabled
                    ? `border-slate-200/80 shadow-lg shadow-slate-200/50 ${portal.hoverBorder} hover:shadow-2xl ${portal.glowColor} hover:-translate-y-1`
                    : "border-slate-200/60 opacity-60 grayscale"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${portal.accentFrom} ${portal.accentTo} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.03]`} />

                <div className="relative p-8">
                  <div className="mb-6 flex items-start justify-between">
                    <div className={`rounded-2xl p-4 shadow-lg ${isEnabled ? portal.iconBg : "bg-slate-300"}`}>
                      <Icon className={`h-7 w-7 ${isEnabled ? portal.iconColor : "text-slate-500"}`} />
                    </div>
                    {!isEnabled && (
                      <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                        <Lock className="h-3.5 w-3.5" />
                        Bloqueado
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isEnabled ? "text-purple-600" : "text-slate-400"}`}>
                      {portal.subtitle}
                    </p>
                    <h3 className={`mt-1 text-2xl font-bold ${isEnabled ? "text-slate-900" : "text-slate-500"}`}>
                      {portal.title}
                    </h3>
                  </div>

                  <p className={`mb-6 text-sm leading-relaxed ${isEnabled ? "text-slate-600" : "text-slate-400"}`}>
                    {portal.description}
                  </p>

                  <div className="mb-6 flex flex-wrap gap-2">
                    {portal.features.map((feature) => (
                      <span
                        key={feature}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          isEnabled
                            ? "bg-slate-100 text-slate-700"
                            : "bg-slate-100/50 text-slate-400"
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {isEnabled && (
                    <div className={`inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${portal.accentFrom} ${portal.accentTo} bg-clip-text text-transparent`}>
                      Acceder al portal
                      <ArrowRight className="h-4 w-4 text-purple-600 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  )}
                </div>
              </div>
            );

            return isEnabled ? (
              <Link
                key={portal.id}
                href={portal.href}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              >
                {cardContent}
              </Link>
            ) : (
              <div key={portal.id} aria-disabled="true">
                {cardContent}
              </div>
            );
          })}
        </div>

        <footer className="mt-10 text-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/60 px-6 py-4 text-sm text-slate-500 shadow-sm backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
            </div>
            <span>
              Necesitas acceso adicional? <span className="font-medium text-slate-700">Contacta al administrador.</span>
            </span>
          </div>
        </footer>
      </div>
    </section>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
