// src/app/home/page.tsx
import Link from "next/link";
import { Lock, FileText, Users, Sparkles } from "lucide-react";

import AuthLoginCard from "@/app/components/AuthLoginCard";
import { auth } from "@/lib/auth";
import type { PortalAccessId } from "@/constants/portals";

type PortalCard = {
  id: PortalAccessId;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  glowColor: string;
};

const PORTAL_CARDS: PortalCard[] = [
  {
    id: "direct",
    title: "Portal Directo",
    description: "Genera propuestas, historicos, estadisticas y objetivos.",
    href: "/portal/directo",
    icon: FileText,
    gradient: "from-purple-500/10 via-purple-600/5 to-transparent",
    glowColor: "shadow-purple-500/20 hover:shadow-purple-500/40",
  },
  {
    id: "mapache",
    title: "Portal Mapache",
    description: "Gestion de tareas y metricas del equipo Mapache.",
    href: "/portal/mapache",
    icon: Users,
    gradient: "from-blue-500/10 via-blue-600/5 to-transparent",
    glowColor: "shadow-blue-500/20 hover:shadow-blue-500/40",
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

  return (
    <section className="relative min-h-[calc(100vh-var(--nav-h))] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-purple-50/40 px-4 py-10">
      <div className="pointer-events-none absolute -top-24 right-6 h-72 w-72 rounded-full bg-purple-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-6 h-80 w-80 rounded-full bg-indigo-200/35 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/70 px-3 py-1 text-sm font-medium text-purple-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Hola, {userName}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Selecciona tu Portal</h1>
            <p className="mt-2 text-sm text-slate-600">
              Acceso rapido a tus tableros y herramientas del dia a dia.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PORTAL_CARDS.map((portal) => {
            const isEnabled = accessiblePortals.has(portal.id);
            const Icon = portal.icon;
            const accent =
              portal.id === "mapache"
                ? { container: "bg-blue-100 group-hover:bg-blue-200", icon: "text-blue-600", text: "text-blue-600" }
                : { container: "bg-purple-100 group-hover:bg-purple-200", icon: "text-purple-600", text: "text-purple-600" };

            const card = (
              <div
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
                  isEnabled
                    ? `border-slate-200 bg-white shadow-sm hover:border-purple-300 hover:shadow-xl ${portal.glowColor}`
                    : "border-slate-200 bg-slate-50 opacity-50"
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${portal.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />
                <div className="relative z-10 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`rounded-2xl p-3 ${isEnabled ? accent.container : "bg-slate-200"}`}>
                      <Icon className={`h-5 w-5 ${isEnabled ? accent.icon : "text-slate-400"}`} />
                    </div>
                    {!isEnabled && <Lock className="h-4 w-4 text-slate-400" />}
                  </div>

                  <div className="space-y-2">
                    <h3 className={`text-lg font-bold ${isEnabled ? "text-slate-900" : "text-slate-500"}`}>
                      {portal.title}
                    </h3>
                    <p className={`text-sm leading-snug ${isEnabled ? "text-slate-600" : "text-slate-400"}`}>
                      {portal.description}
                    </p>
                  </div>

                  {isEnabled && (
                    <div className={`mt-4 inline-flex items-center text-sm font-semibold ${accent.text}`}>
                      Acceder
                      <svg
                        className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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
                {card}
              </Link>
            ) : (
              <div key={portal.id} aria-disabled="true">
                {card}
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-purple-200 bg-white/70 px-6 py-4 text-center text-sm text-slate-600 shadow-sm">
          Necesitas acceso a mas portales? Contacta al administrador de tu equipo.
        </div>
      </div>
    </section>
  );
}
