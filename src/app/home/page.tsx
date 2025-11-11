// src/app/home/page.tsx
import Link from "next/link";
import { Lock, Unlock } from "lucide-react";

import AuthLoginCard from "@/app/components/AuthLoginCard";
import { auth } from "@/lib/auth";
import type { PortalAccessId } from "@/constants/portals";

type PortalCard = {
  id: PortalAccessId;
  title: string;
  description: string;
  href: string;
};

const PORTAL_CARDS: PortalCard[] = [
  {
    id: "direct",
    title: "Portal Directo",
    description: "Genera propuestas, historicos, estadisticas y objetivos.",
    href: "/portal/directo",
  },
  {
    id: "mapache",
    title: "Portal Mapache",
    description: "Gestion de tareas y metricas del equipo Mapache.",
    href: "/portal/mapache",
  },
  {
    id: "marketing",
    title: "Portal Marketing",
    description: "Materiales y reportes para el equipo de marketing.",
    href: "/portal/marketing",
  },
  {
    id: "partner",
    title: "Portal Partner",
    description: "Recursos exclusivos para partners y alianzas.",
    href: "/portal/partner",
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

  return (
    <section className="min-h-[calc(100vh-var(--nav-h))] w-full bg-slate-50 px-4 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 text-center">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">
            Bienvenido
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Seleccione el portal</h1>
          <p className="text-base text-slate-600">
            Elegi donde queres trabajar. Mostramos solamente los portales habilitados para tu usuario.
          </p>
        </div>

        <div className="grid w-full gap-6 sm:grid-cols-2">
          {PORTAL_CARDS.map((portal) => {
            const isEnabled = accessiblePortals.has(portal.id);
            const card = (
              <div
                className={`relative h-full rounded-2xl border p-6 text-left transition ${
                  isEnabled
                    ? "border-[rgb(var(--primary))]/30 bg-white shadow hover:shadow-lg"
                    : "border-slate-200 bg-slate-100 text-slate-500"
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{portal.title}</h2>
                  {isEnabled ? (
                    <Unlock className="h-5 w-5 text-[rgb(var(--primary))]" aria-hidden="true" />
                  ) : (
                    <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  )}
                </div>
                <p className="text-sm leading-relaxed">{portal.description}</p>
                <span
                  className={`pointer-events-none mt-6 inline-flex items-center text-sm font-semibold ${
                    isEnabled ? "text-[rgb(var(--primary))]" : "text-slate-400"
                  }`}
                >
                  {isEnabled ? "Ingresar →" : "Acceso restringido"}
                </span>
              </div>
            );

            return isEnabled ? (
              <Link
                key={portal.id}
                href={portal.href}
                className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]"
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
      </div>
    </section>
  );
}
