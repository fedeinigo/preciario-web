import Link from "next/link";
import { redirect } from "next/navigation";
import { TrendingUp, Target, ArrowRight, Users } from "lucide-react";

import MapachePortalReadySignal from "@/app/mapache-portal/MapachePortalReadySignal";
import { auth } from "@/lib/auth";

function UnauthorizedNotice() {
  return (
    <div className="flex min-h-[calc(100vh-var(--nav-h))] flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20">
          <Users className="h-6 w-6 text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-white">
          Acceso restringido
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          No tienes acceso al portal Mapache. Contacta al administrador si crees que es un error.
        </p>
      </div>
    </div>
  );
}

type QuickAccessCard = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
};

const QUICK_ACCESS_CARDS: QuickAccessCard[] = [
  {
    title: "Pipedrive",
    description: "Sincroniza y gestiona deals del equipo",
    href: "/portal/mapache/pipedrive",
    icon: TrendingUp,
    gradient: "from-cyan-500/10 to-blue-500/10",
    iconBg: "bg-gradient-to-br from-cyan-500 to-blue-600",
  },
  {
    title: "Objetivos",
    description: "Seguimiento de metas y progreso del equipo",
    href: "/portal/mapache/goals",
    icon: Target,
    gradient: "from-violet-500/10 to-purple-500/10",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
  },
];

export default async function MapachePortalLobbyPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const { user } = session;
  const isAdmin = user.role === "admin";
  const isMapache = user.team === "Mapaches";
  const userName = user.name?.split(" ")[0] || "Mapache";

  if (!isAdmin && !isMapache) {
    return (
      <>
        <MapachePortalReadySignal />
        <UnauthorizedNotice />
      </>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-var(--nav-h))] px-4 pb-16 sm:px-6 lg:px-8 -mt-[var(--nav-h)] pt-[calc(var(--nav-h)+2rem)]">
      <MapachePortalReadySignal />

      <div className="pointer-events-none absolute -top-20 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-purple-500/30 via-violet-500/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-gradient-to-tr from-cyan-500/25 via-blue-500/15 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[250px] w-[250px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-10">
        <header className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/80 shadow-lg backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            Bienvenido, {userName}
          </div>
          <h1 className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Portal Mapache
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-white/60">
            Centro de comando del equipo de preventa tecnica
          </p>
        </header>

        <section className="grid gap-5 sm:grid-cols-3">
          {QUICK_ACCESS_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

                <div className="relative z-10">
                  <div className={`mb-4 inline-flex rounded-xl p-3 shadow-lg ${card.iconBg}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {card.title}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-white/50">
                    {card.description}
                  </p>

                  <div className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400">
                    Acceder
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <footer className="text-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-4 text-sm text-white/40 backdrop-blur-sm">
            <Users className="h-4 w-4" />
            Equipo de Preventa Tecnica
          </div>
        </footer>
      </div>
    </div>
  );
}
