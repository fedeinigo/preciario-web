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
    <section className="min-h-[calc(100vh-var(--nav-h))] bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-purple-600">
              <Sparkles className="h-4 w-4" />
              Hola, {userName}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Selecciona tu Portal
            </h1>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PORTAL_CARDS.map((portal) => {
            const isEnabled = accessiblePortals.has(portal.id);
            const Icon = portal.icon;
            
            const card = (
              <div
                className={`group relative overflow-hidden rounded-xl border transition-all duration-200 ${
                  isEnabled
                    ? "border-slate-200 bg-white shadow-sm hover:border-purple-300 hover:shadow-md"
                    : "border-slate-200 bg-slate-50 opacity-50"
                }`}
              >
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`rounded-lg p-2.5 ${
                      isEnabled 
                        ? "bg-purple-100 group-hover:bg-purple-200" 
                        : "bg-slate-200"
                    }`}>
                      <Icon className={`h-5 w-5 ${isEnabled ? "text-purple-600" : "text-slate-400"}`} />
                    </div>
                    {!isEnabled && <Lock className="h-4 w-4 text-slate-400" />}
                  </div>

                  <div className="space-y-2">
                    <h3 className={`text-base font-bold ${isEnabled ? "text-slate-900" : "text-slate-500"}`}>
                      {portal.title}
                    </h3>
                    <p className={`text-sm leading-snug ${isEnabled ? "text-slate-600" : "text-slate-400"}`}>
                      {portal.description}
                    </p>
                  </div>

                  {isEnabled && (
                    <div className="mt-4 flex items-center text-sm font-semibold text-purple-600">
                      Acceder
                      <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Necesitas acceso a más portales? Contacta al administrador de tu equipo.
        </p>
      </div>
    </section>
  );
}
