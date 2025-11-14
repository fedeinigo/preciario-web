// src/app/home/page.tsx
import Link from "next/link";
import { Lock, FileText, Users, Megaphone, Handshake, Sparkles } from "lucide-react";

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
  {
    id: "marketing",
    title: "Portal Marketing",
    description: "Materiales y reportes para el equipo de marketing.",
    href: "/portal/marketing",
    icon: Megaphone,
    gradient: "from-pink-500/10 via-pink-600/5 to-transparent",
    glowColor: "shadow-pink-500/20 hover:shadow-pink-500/40",
  },
  {
    id: "partner",
    title: "Portal Partner",
    description: "Recursos exclusivos para partners y alianzas.",
    href: "/portal/partner",
    icon: Handshake,
    gradient: "from-emerald-500/10 via-emerald-600/5 to-transparent",
    glowColor: "shadow-emerald-500/20 hover:shadow-emerald-500/40",
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
    <section className="relative min-h-[calc(100vh-var(--nav-h))] w-full overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 py-16 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Bienvenido, {userName}
          </div>
          <h1 className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            Selecciona tu Portal
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Accede a las herramientas y recursos de tu equipo. Mostramos solo los portales habilitados para tu usuario.
          </p>
        </div>

        <div className="grid w-full gap-6 sm:grid-cols-2 lg:gap-8">
          {PORTAL_CARDS.map((portal) => {
            const isEnabled = accessiblePortals.has(portal.id);
            const Icon = portal.icon;
            
            const card = (
              <div
                className={`group relative h-full overflow-hidden rounded-3xl border-2 p-8 text-left transition-all duration-300 ${
                  isEnabled
                    ? `border-slate-200 bg-white ${portal.glowColor} shadow-lg hover:-translate-y-1 hover:border-purple-200 hover:shadow-2xl`
                    : "border-slate-200 bg-slate-100/50 opacity-60"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${portal.gradient} opacity-0 transition-opacity duration-300 ${isEnabled ? "group-hover:opacity-100" : ""}`} />
                
                <div className="relative space-y-6">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-2xl p-4 transition-all duration-300 ${
                      isEnabled 
                        ? "bg-gradient-to-br from-purple-100 to-purple-50 group-hover:scale-110 group-hover:shadow-lg" 
                        : "bg-slate-200"
                    }`}>
                      <Icon className={`h-8 w-8 ${isEnabled ? "text-purple-600" : "text-slate-400"}`} />
                    </div>
                    {!isEnabled && <Lock className="h-6 w-6 text-slate-400" />}
                  </div>

                  <div className="space-y-3">
                    <h2 className={`text-2xl font-bold ${isEnabled ? "text-slate-900" : "text-slate-500"}`}>
                      {portal.title}
                    </h2>
                    <p className={`text-base leading-relaxed ${isEnabled ? "text-slate-600" : "text-slate-400"}`}>
                      {portal.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    {isEnabled ? (
                      <>
                        <span className="inline-flex items-center gap-2 text-base font-semibold text-purple-600 transition-colors group-hover:text-purple-700">
                          Acceder
                          <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-400">
                        <Lock className="h-4 w-4" />
                        Acceso restringido
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );

            return isEnabled ? (
              <Link
                key={portal.id}
                href={portal.href}
                className="focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/20 focus-visible:ring-offset-2"
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

        <div className="mt-4 text-sm text-slate-500">
          ¿Necesitas acceso a más portales? Contacta al administrador de tu equipo.
        </div>
      </div>
    </section>
  );
}
